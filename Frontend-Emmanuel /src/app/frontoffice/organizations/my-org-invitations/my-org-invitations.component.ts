import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrgInvitation } from '../../../core/models/organization.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-org-invitations',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule
  ],
  templateUrl: './my-org-invitations.component.html'
})
export class MyOrgInvitationsComponent implements OnInit {
  private orgService  = inject(OrganizationService);
  private authService = inject(AuthService);
  private router      = inject(Router);

  invitations  = signal<OrgInvitation[]>([]);
  isLoading    = signal(true);
  responding   = signal<string | null>(null); // id of the inv being responded to

  ngOnInit() {
    this.orgService.getMyPendingInvitations().subscribe({
      next:  list => { this.invitations.set(list); this.isLoading.set(false); },
      error: ()   => this.isLoading.set(false)
    });
  }

  respond(inv: OrgInvitation, accept: boolean) {
    this.responding.set(inv.id);
    this.orgService.respondByToken(inv.token, accept).subscribe({
      next: updated => {
        this.invitations.update(list => list.filter(i => i.id !== inv.id));
        this.responding.set(null);
        if (accept && inv.organizationId) {
          this.router.navigate(['/organizations', inv.organizationId]);
        }
      },
      error: () => this.responding.set(null)
    });
  }

  roleLabel(role: string): string {
    return { OWNER: 'Propriétaire', MANAGER: 'Gestionnaire', MEMBER: 'Membre' }[role] ?? role;
  }
}
