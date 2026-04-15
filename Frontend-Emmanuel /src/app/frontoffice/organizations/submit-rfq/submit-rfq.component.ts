import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrganizationService } from '@core/services/organization.service';
import { CreateRfqRequest } from '@core/models/organization.model';

@Component({
  selector: 'app-submit-rfq',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  template: `
    @if (sent()) {
      <div class="success-msg"><mat-icon>check_circle</mat-icon> Demande de devis envoyée !</div>
    } @else if (!showForm()) {
      <button mat-stroked-button color="primary" (click)="showForm.set(true)">
        <mat-icon>request_quote</mat-icon> Demander un devis
      </button>
    } @else {
      <div class="rfq-form">
        <h4><mat-icon>request_quote</mat-icon> Demande de devis</h4>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Titre du projet *</mat-label>
          <input matInput [(ngModel)]="form.title" placeholder="Ex : Développement application mobile">
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Description du besoin *</mat-label>
          <textarea matInput rows="4" [(ngModel)]="form.description"
                    placeholder="Décrivez vos besoins en détail..."></textarea>
        </mat-form-field>
        <div class="budget-row">
          <mat-form-field appearance="outline">
            <mat-label>Budget min (€)</mat-label>
            <input matInput type="number" [(ngModel)]="form.budgetMin" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Budget max (€)</mat-label>
            <input matInput type="number" [(ngModel)]="form.budgetMax" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Délai souhaité</mat-label>
            <input matInput type="date" [(ngModel)]="form.deadline">
          </mat-form-field>
        </div>
        <div class="actions">
          <button mat-button (click)="showForm.set(false)">Annuler</button>
          <button mat-raised-button color="primary"
                  [disabled]="sending() || !form.title?.trim() || !form.description?.trim()"
                  (click)="submit()">
            <mat-icon>send</mat-icon> {{ sending() ? 'Envoi...' : 'Envoyer la demande' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .rfq-form { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-top: 8px; }
    .rfq-form h4 { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 0.95rem; }
    .budget-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .budget-row mat-form-field { flex: 1; min-width: 130px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
    .success-msg { display: flex; align-items: center; gap: 6px; color: #059669; font-weight: 500; padding: 8px 0; }
  `]
})
export class SubmitRfqComponent {
  @Input() orgId!: string;

  showForm = signal(false);
  sending  = signal(false);
  sent     = signal(false);
  form: CreateRfqRequest = { title: '', description: '' };

  constructor(private orgService: OrganizationService, private snack: MatSnackBar) {}

  submit() {
    this.sending.set(true);
    this.orgService.createRfq(this.orgId, this.form).subscribe({
      next: () => {
        this.sent.set(true);
        this.sending.set(false);
        this.showForm.set(false);
        this.form = { title: '', description: '' };
      },
      error: err => {
        this.snack.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 });
        this.sending.set(false);
      }
    });
  }
}
