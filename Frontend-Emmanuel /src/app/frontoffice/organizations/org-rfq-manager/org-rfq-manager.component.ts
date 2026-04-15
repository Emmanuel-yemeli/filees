import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrganizationService } from '@core/services/organization.service';
import { OrgRfq, RfqStatus, RfqResponseRequest } from '@core/models/organization.model';

@Component({
  selector: 'app-org-rfq-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  templateUrl: './org-rfq-manager.component.html',
  styleUrls: ['./org-rfq-manager.component.scss']
})
export class OrgRfqManagerComponent implements OnInit {
  @Input() orgId!: string;

  rfqs            = signal<OrgRfq[]>([]);
  isLoading       = signal(true);
  total           = signal(0);
  page            = signal(0);
  respondingId    = signal<string | null>(null);
  responseMessage = '';
  RfqStatus       = RfqStatus;

  constructor(private orgService: OrganizationService, private snack: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.orgService.getOrgRfqs(this.orgId, this.page()).subscribe({
      next: p => { this.rfqs.set(p.content); this.total.set(p.totalElements); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openRespond(rfqId: string) { this.respondingId.set(rfqId); this.responseMessage = ''; }
  cancelRespond() { this.respondingId.set(null); }

  submitRespond(rfq: OrgRfq) {
    if (!this.responseMessage.trim()) return;
    const req: RfqResponseRequest = { responseMessage: this.responseMessage };
    this.orgService.respondToRfq(this.orgId, rfq.id, req).subscribe({
      next: updated => {
        this.rfqs.update(list => list.map(r => r.id === rfq.id ? updated : r));
        this.snack.open('Réponse envoyée.', 'OK', { duration: 2500 });
        this.respondingId.set(null);
      },
      error: err => this.snack.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 })
    });
  }

  getStatusLabel(s: RfqStatus): string {
    return { PENDING: 'En attente', RESPONDED: 'Répondu', CLOSED: 'Clôturée' }[s] || s;
  }

  getStatusColor(s: RfqStatus): string {
    return { PENDING: '#f59e0b', RESPONDED: '#10b981', CLOSED: '#9ca3af' }[s] || '#9ca3af';
  }
}
