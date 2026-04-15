import { Component, OnInit, OnDestroy, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError, tap } from 'rxjs/operators';
import { ComplaintService } from '@core/services/complaint.service';
import { AuthService } from '@core/services/auth.service';
import {
  ComplaintCategory, ComplaintPriority,
  CATEGORY_LABELS, PRIORITY_LABELS, CreateComplaintRequest
} from '@core/models/complaint.model';
import { AttachmentManagerComponent, ManagedFile } from '@shared/components/attachment-manager/attachment-manager.component';

const MAX_FILES      = 5;
const MAX_FILE_SIZE_MB = 10;

@Component({
  selector: 'app-create-complaint',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatSnackBarModule, TranslateModule,
    AttachmentManagerComponent
  ],
  templateUrl: './create-complaint.component.html',
  styleUrls: ['./create-complaint.component.scss']
})
export class CreateComplaintComponent implements OnInit, OnDestroy {

  @ViewChild(AttachmentManagerComponent) attachmentManager?: AttachmentManagerComponent;

  // ── State ─────────────────────────────────────────────────
  isSubmitting   = signal(false);
  isUploading    = signal(false);
  uploadProgress = signal<string>('');
  formSubmitted  = signal(false);

  // ── Email verification state ──────────────────────────────
  emailChecking  = signal(false);
  emailResolved  = signal<{firstName: string; lastName: string; type: string} | null>(null);
  emailNotFound  = signal(false);

  // ── Données statiques ─────────────────────────────────────
  categories = Object.values(ComplaintCategory).map(v => ({
    value: v, label: CATEGORY_LABELS[v], icon: this.getCategoryIcon(v)
  }));
  priorities = Object.values(ComplaintPriority).map(v => ({
    value: v, label: PRIORITY_LABELS[v]
  }));

  maxFileSizeMb = MAX_FILE_SIZE_MB;
  maxFiles      = MAX_FILES;

  // ── Reactive Form ─────────────────────────────────────────
  form!: FormGroup;

  private fb            = inject(FormBuilder);
  private complaintSvc  = inject(ComplaintService);
  private authService   = inject(AuthService);
  private router        = inject(Router);
  private snackBar      = inject(MatSnackBar);

  private destroy$ = new Subject<void>();

  // ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.form = this.fb.group({
      category:       ['', Validators.required],
      priority:       [ComplaintPriority.MEDIUM, Validators.required],
      subject: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(255)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(5000)
      ]],
      reportedUserEmail: ['', [
        Validators.maxLength(255),
        Validators.email,
        (control: AbstractControl) => {
          const currentEmail = this.authService.getCurrentUser()?.email;
          if (control.value && control.value === currentEmail) {
            return { selfReport: true };
          }
          return null;
        }
      ]],
      projectName: ['', [
        Validators.maxLength(255)
      ]]
    });

    // ── Debounced email verification ──
    this.ctrl('reportedUserEmail').valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged(),
      tap(val => {
        // Reset state on every change
        this.emailResolved.set(null);
        this.emailNotFound.set(false);
        if (!val || val.trim().length === 0) {
          this.emailChecking.set(false);
        }
      }),
      switchMap(val => {
        const email = val?.trim();
        if (!email || this.ctrl('reportedUserEmail').hasError('email') || this.ctrl('reportedUserEmail').hasError('selfReport')) {
          return of(null);
        }
        this.emailChecking.set(true);
        return this.complaintSvc.checkUserByEmail(email).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(result => {
      this.emailChecking.set(false);
      if (result) {
        this.emailResolved.set({ firstName: result.firstName, lastName: result.lastName, type: result.type });
        this.emailNotFound.set(false);
      } else if (this.ctrl('reportedUserEmail').value?.trim()?.length > 0
                 && !this.ctrl('reportedUserEmail').hasError('email')
                 && !this.ctrl('reportedUserEmail').hasError('selfReport')) {
        this.emailNotFound.set(true);
        this.emailResolved.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Helpers validation ─────────────────────────────────────

  ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  showError(name: string): boolean {
    const c = this.ctrl(name);
    return c.invalid && (c.touched || c.dirty || this.formSubmitted());
  }

  errorMsg(name: string): string {
    const c = this.ctrl(name);
    if (!c.errors) return '';
    if (c.errors['required'])  return 'Ce champ est obligatoire.';
    if (c.errors['minlength']) {
      const min = c.errors['minlength'].requiredLength;
      return `Minimum ${min} caractère${min > 1 ? 's' : ''} requis.`;
    }
    if (c.errors['maxlength']) {
      const max = c.errors['maxlength'].requiredLength;
      return `Maximum ${max} caractères autorisés.`;
    }
    if (c.errors['pattern'])    return 'Format invalide.';
    if (c.errors['email'])      return 'Adresse e-mail invalide.';
    if (c.errors['selfReport']) return 'Vous ne pouvez pas déposer une réclamation contre vous-même.';
    return 'Valeur invalide.';
  }

  /** true si un email a été saisi mais n'est pas encore validé */
  get emailPending(): boolean {
    const val = this.ctrl('reportedUserEmail').value?.trim();
    if (!val) return false;
    if (this.ctrl('reportedUserEmail').hasError('email') || this.ctrl('reportedUserEmail').hasError('selfReport')) return false;
    return this.emailChecking() || (!this.emailResolved() && !this.emailNotFound());
  }

  /** Soumission bloquée si email non résolu */
  get isSubmitBlocked(): boolean {
    const emailVal = this.ctrl('reportedUserEmail').value?.trim();
    if (!emailVal) return false; // pas d'email = pas de blocage
    return this.emailPending || this.emailNotFound() || this.emailChecking();
  }

  // ── Soumission ─────────────────────────────────────────────

  submit(): void {
    this.formSubmitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitBlocked) {
      setTimeout(() => {
        const el = document.querySelector('.field-error, .email-status.not-found');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    this.isSubmitting.set(true);
    const managedFiles: ManagedFile[] = this.attachmentManager?.getFiles() ?? [];
    const files = managedFiles.map(f => f.file).filter((f): f is File => !!f);

    if (files.length > 0) {
      this.isUploading.set(true);
      this.uploadProgress.set(`Upload de ${files.length} fichier${files.length > 1 ? 's' : ''}...`);
      this.complaintSvc.uploadComplaintAttachments(files).subscribe({
        next: ({ urls }) => {
          this.isUploading.set(false);
          this.uploadProgress.set('');
          this.submitWithAttachments(urls);
        },
        error: err => {
          this.isUploading.set(false);
          this.uploadProgress.set('');
          const msg = err?.error?.error || "Erreur lors de l'upload des fichiers.";
          this.snackBar.open(msg, 'Fermer', { duration: 5000 });
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.submitWithAttachments([]);
    }
  }

  private submitWithAttachments(attachmentUrls: string[]): void {
    const v = this.form.value;

    const payload: CreateComplaintRequest = {
      category:    v.category,
      priority:    v.priority,
      subject:     v.subject.trim(),
      description: v.description.trim(),
      ...(v.reportedUserEmail?.trim() && { reportedUserEmail: v.reportedUserEmail.trim() }),
      ...(v.projectName?.trim()       && { projectId: v.projectName.trim() }),
      ...(attachmentUrls.length       && { attachments: attachmentUrls })
    };

    this.complaintSvc.createComplaint(payload).subscribe({
      next: complaint => {
        this.snackBar.open('Réclamation soumise avec succès !', 'Fermer', {
          duration: 4000, panelClass: ['snack-success']
        });
        const base = this.router.url.includes('freelancer')
          ? '/frontoffice/freelancer/my-complaints'
          : '/frontoffice/client/my-complaints';
        this.router.navigate([base, complaint.id]);
      },
      error: err => {
        const msg = err?.error?.message || err?.error?.error || 'Erreur lors de la soumission. Veuillez réessayer.';
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }

  cancel(): void {
    const base = this.router.url.includes('freelancer')
      ? '/frontoffice/freelancer/my-complaints'
      : '/frontoffice/client/my-complaints';
    this.router.navigate([base]);
  }

  // ── Getters pratiques ─────────────────────────────────────

  get isFormInvalid(): boolean {
    return this.form?.invalid ?? true;
  }

  get subjectLength(): number   { return this.ctrl('subject').value?.length ?? 0; }
  get descLength(): number      { return this.ctrl('description').value?.length ?? 0; }
  get descProgressPct(): number { return Math.min((this.ctrl('description').value?.length ?? 0) / 5000 * 100, 100); }
  get selectedCategory(): string { return this.ctrl('category').value; }
  get selectedPriority(): string { return this.ctrl('priority').value; }
  get checklistPct(): number {
    let done = 0;
    if (this.selectedCategory) done++;
    if (this.selectedPriority) done++;
    if (this.subjectLength >= 5) done++;
    if (this.descLength >= 20) done++;
    return Math.round((done / 4) * 100);
  }

  // ── Icônes & utilitaires ──────────────────────────────────

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = {
      PAYMENT_ISSUE:          'payments',
      QUALITY_DISPUTE:        'star_half',
      COMMUNICATION_PROBLEM:  'chat_bubble_outline',
      HARASSMENT:             'report',
      SCAM:                   'warning',
      TECHNICAL_ISSUE:        'build',
      OTHER:                  'help_outline'
    };
    return map[cat] ?? 'help_outline';
  }

}
