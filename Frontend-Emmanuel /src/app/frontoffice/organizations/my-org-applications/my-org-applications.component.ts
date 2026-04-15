import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { OrganizationService } from '@core/services/organization.service';
import { OrgApplication, ApplicationStatus } from '@core/models/organization.model';

@Component({
  selector: 'app-my-org-applications',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './my-org-applications.component.html',
  styleUrls: ['./my-org-applications.component.scss']
})
export class MyOrgApplicationsComponent implements OnInit {
  apps      = signal<OrgApplication[]>([]);
  isLoading = signal(true);
  ApplicationStatus = ApplicationStatus;

  constructor(private orgService: OrganizationService, private router: Router) {}

  ngOnInit() {
    this.orgService.getMyOrgApplications().subscribe({
      next: list => { this.apps.set(list); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  viewOrg(orgId: string) { this.router.navigate(['/organizations', orgId]); }

  getStatusLabel(s: ApplicationStatus): string {
    return { PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée', WITHDRAWN: 'Retirée' }[s] || s;
  }

  getStatusColor(s: ApplicationStatus): string {
    return { PENDING: '#f59e0b', ACCEPTED: '#10b981', REJECTED: '#ef4444', WITHDRAWN: '#9ca3af' }[s] || '#9ca3af';
  }
}
