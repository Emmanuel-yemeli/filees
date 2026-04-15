import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrganizationService } from '@core/services/organization.service';
import { OrgApplication, ApplicationStatus, RespondApplicationRequest } from '@core/models/organization.model';

@Component({
  selector: 'app-org-applications-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule
  ],
  templateUrl: './org-applications-manager.component.html',
  styleUrls: ['./org-applications-manager.component.scss']
})
export class OrgApplicationsManagerComponent implements OnInit {
  @Input() orgId!: string;

  apps         = signal<OrgApplication[]>([]);
  isLoading    = signal(true);
  total        = signal(0);
  page         = signal(0);
  respondingId = signal<string | null>(null);
  respondForm  = { status: 'ACCEPTED' as 'ACCEPTED' | 'REJECTED', rejectionReason: '' };

  ApplicationStatus = ApplicationStatus;

  constructor(private orgService: OrganizationService, private snack: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.orgService.getOrgApplications(this.orgId, this.page()).subscribe({
      next: p => { this.apps.set(p.content); this.total.set(p.totalElements); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openRespond(appId: string) {
    this.respondingId.set(appId);
    this.respondForm = { status: 'ACCEPTED', rejectionReason: '' };
  }

  cancelRespond() { this.respondingId.set(null); }

  submitRespond(app: OrgApplication) {
    const req: RespondApplicationRequest = {
      status: this.respondForm.status,
      rejectionReason: this.respondForm.rejectionReason || undefined
    };
    this.orgService.respondToApplication(this.orgId, app.id, req).subscribe({
      next: updated => {
        this.apps.update(list => list.map(a => a.id === app.id ? updated : a));
        this.snack.open('Réponse envoyée.', 'OK', { duration: 2500 });
        this.respondingId.set(null);
      },
      error: err => this.snack.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 })
    });
  }

  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }

  getStatusLabel(s: ApplicationStatus): string {
    return { PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée', WITHDRAWN: 'Retirée' }[s] || s;
  }

  getStatusColor(s: ApplicationStatus): string {
    return { PENDING: '#f59e0b', ACCEPTED: '#10b981', REJECTED: '#ef4444', WITHDRAWN: '#9ca3af' }[s] || '#9ca3af';
  }
}
