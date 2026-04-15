import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OrganizationService } from '@core/services/organization.service';
import { OrgRfq, RfqStatus } from '@core/models/organization.model';

@Component({
  selector: 'app-my-org-rfqs',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './my-org-rfqs.component.html',
  styleUrls: ['./my-org-rfqs.component.scss']
})
export class MyOrgRfqsComponent implements OnInit {
  rfqs      = signal<OrgRfq[]>([]);
  isLoading = signal(true);
  RfqStatus = RfqStatus;

  constructor(private orgService: OrganizationService, private router: Router) {}

  ngOnInit() {
    this.orgService.getMyRfqs().subscribe({
      next: list => { this.rfqs.set(list); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  viewOrg(orgId: string) { this.router.navigate(['/organizations', orgId]); }

  getStatusLabel(s: RfqStatus): string {
    return { PENDING: 'En attente', RESPONDED: 'Réponse reçue', CLOSED: 'Clôturée' }[s] || s;
  }

  getStatusColor(s: RfqStatus): string {
    return { PENDING: '#f59e0b', RESPONDED: '#10b981', CLOSED: '#9ca3af' }[s] || '#9ca3af';
  }
}
