import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrganizationSummary, OrganizationStatus } from '../../../core/models/organization.model';

@Component({
  selector: 'app-my-organizations',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatMenuModule
  ],
  templateUrl: './my-organizations.component.html'
})
export class MyOrganizationsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private router     = inject(Router);

  orgs      = signal<OrganizationSummary[]>([]);
  isLoading = signal(true);
  error     = signal<string | null>(null);

  ngOnInit() {
    this.orgService.getMyOrganizations().subscribe({
      next:  list => { this.orgs.set(list); this.isLoading.set(false); },
      error: ()   => { this.error.set('Impossible de charger vos organisations.'); this.isLoading.set(false); }
    });
  }

  create()                  { this.router.navigate(['/frontoffice/my-organizations/create']); }
  view(id: string)          { this.router.navigate(['/organizations', id]); }
  settings(id: string)      { this.router.navigate(['/frontoffice/my-organizations', id, 'settings']); }

  statusClass(status: OrganizationStatus): string {
    const map: Record<string, string> = {
      ACTIVE: 'active', PENDING_VERIFICATION: 'pending',
      SUSPENDED: 'suspended', DISSOLVED: 'dissolved',
      REJECTED: 'rejected', AWAITING_INFO: 'pending'
    };
    return map[status] ?? 'other';
  }

  statusLabel(status: OrganizationStatus): string {
    const map: Record<string, string> = {
      ACTIVE: 'Active', PENDING_VERIFICATION: 'En vérification',
      AWAITING_INFO: 'Infos requises', SUSPENDED: 'Suspendue',
      DISSOLVED: 'Dissoute', REJECTED: 'Rejetée'
    };
    return map[status] ?? status;
  }
}
