import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Organization, OrgMember, OrgInvitation,
  UpdateOrganizationRequest, InviteMemberRequest,
  MemberRole, OrganizationVisibility, OrganizationSize
} from '../../../core/models/organization.model';
import { OrgPortfolioComponent } from '../org-portfolio/org-portfolio.component';
import { OrgApplicationsManagerComponent } from '../org-applications-manager/org-applications-manager.component';
import { OrgRfqManagerComponent } from '../org-rfq-manager/org-rfq-manager.component';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatSlideToggleModule, MatDialogModule, MatDividerModule,
    OrgPortfolioComponent, OrgApplicationsManagerComponent, OrgRfqManagerComponent
  ],
  templateUrl: './organization-settings.component.html'
})
export class OrganizationSettingsComponent implements OnInit {
  private orgService  = inject(OrganizationService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private authService = inject(AuthService);

  readonly separators   = [ENTER, COMMA];
  readonly sizes        = Object.values(OrganizationSize);
  readonly roles        = [MemberRole.MEMBER, MemberRole.MANAGER];
  readonly visibilities = Object.values(OrganizationVisibility);

  org         = signal<Organization | null>(null);
  members     = signal<OrgMember[]>([]);
  invitations = signal<OrgInvitation[]>([]);
  isLoading   = signal(true);

  editForm: UpdateOrganizationRequest = {};
  editSpecialties = signal<string[]>([]);
  saveLoading  = signal(false);
  saveSuccess  = signal(false);
  saveError    = signal<string | null>(null);

  inviteForm: InviteMemberRequest = { invitedEmail: '', proposedRole: MemberRole.MEMBER };
  inviteLoading = signal(false);
  inviteError   = signal<string | null>(null);
  inviteSuccess = signal(false);

  dissolveConfirmName = signal('');
  dissolveLoading     = signal(false);
  dissolveError       = signal<string | null>(null);

  get orgId(): string { return this.route.snapshot.paramMap.get('id')!; }
  get currentUserId(): string { return this.authService.getCurrentUser()?.id ?? ''; }

  isOwner   = signal(false);
  isManager = signal(false);

  ngOnInit() {
    this.orgService.getById(this.orgId).subscribe({
      next: o => {
        this.org.set(o);
        this.editForm = {
          name: o.name, description: o.description ?? '',
          logoUrl: o.logoUrl ?? '', website: o.website ?? '',
          location: o.location ?? '', size: o.size
        };
        this.editSpecialties.set([...(o.specialties ?? [])]);
        this.isLoading.set(false);
      }
    });
    this.orgService.getMembers(this.orgId).subscribe({
      next: list => {
        this.members.set(list);
        const me = list.find(m => m.userId === this.currentUserId);
        this.isOwner.set(me?.role === MemberRole.OWNER);
        this.isManager.set(me?.role === MemberRole.MANAGER || me?.role === MemberRole.OWNER);
      }
    });
    this.orgService.getPendingInvitationsForOrg(this.orgId).subscribe({
      next: list => this.invitations.set(list)
    });
  }

  addSpecialty(event: MatChipInputEvent) {
    const v = (event.value || '').trim();
    if (v) this.editSpecialties.update(s => [...s, v]);
    event.chipInput!.clear();
  }

  removeSpecialty(s: string) {
    this.editSpecialties.update(list => list.filter(x => x !== s));
  }

  saveInfo() {
    this.saveLoading.set(true); this.saveError.set(null); this.saveSuccess.set(false);
    const payload: UpdateOrganizationRequest = { ...this.editForm, specialties: this.editSpecialties() };
    this.orgService.update(this.orgId, payload).subscribe({
      next: updated => {
        this.org.set(updated);
        this.saveSuccess.set(true);
        this.saveLoading.set(false);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: err => {
        this.saveError.set(err?.error?.message ?? 'Erreur lors de la mise à jour.');
        this.saveLoading.set(false);
      }
    });
  }

  setVisibility(v: OrganizationVisibility) {
    this.orgService.setVisibility(this.orgId, v).subscribe({ next: updated => this.org.set(updated) });
  }

  promote(memberId: string) {
    this.orgService.promoteToManager(this.orgId, memberId).subscribe({
      next: updated => this.members.update(list => list.map(m => m.id === memberId ? updated : m))
    });
  }

  remove(memberId: string) {
    if (!confirm('Retirer ce membre de l\'organisation ?')) return;
    this.orgService.removeMember(this.orgId, memberId).subscribe({
      next: () => this.members.update(list => list.filter(m => m.id !== memberId))
    });
  }

  sendInvite() {
    if (!this.inviteForm.invitedEmail && !this.inviteForm.invitedUserId) {
      this.inviteError.set('Email ou ID utilisateur requis.'); return;
    }
    this.inviteLoading.set(true); this.inviteError.set(null);
    this.orgService.invite(this.orgId, this.inviteForm).subscribe({
      next: inv => {
        this.invitations.update(list => [inv, ...list]);
        this.inviteSuccess.set(true);
        this.inviteForm = { invitedEmail: '', proposedRole: MemberRole.MEMBER };
        this.inviteLoading.set(false);
        setTimeout(() => this.inviteSuccess.set(false), 3000);
      },
      error: err => {
        this.inviteError.set(err?.error?.message ?? 'Erreur lors de l\'envoi.');
        this.inviteLoading.set(false);
      }
    });
  }

  cancelInvitation(invId: string) {
    this.orgService.cancelInvitation(this.orgId, invId).subscribe({
      next: () => this.invitations.update(list => list.filter(i => i.id !== invId))
    });
  }

  dissolve() {
    if (this.dissolveConfirmName() !== this.org()?.name) {
      this.dissolveError.set('Le nom saisi ne correspond pas.'); return;
    }
    this.dissolveLoading.set(true);
    this.orgService.dissolve(this.orgId).subscribe({
      next: () => this.router.navigate(['/frontoffice/my-organizations']),
      error: err => {
        this.dissolveError.set(err?.error?.message ?? 'Erreur lors de la dissolution.');
        this.dissolveLoading.set(false);
      }
    });
  }

  goToProfile() { this.router.navigate(['/organizations', this.orgId]); }

  roleLabel(role: MemberRole): string {
    return { OWNER: 'Propriétaire', MANAGER: 'Gestionnaire', MEMBER: 'Membre' }[role] ?? role;
  }
}
