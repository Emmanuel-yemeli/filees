import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { OrganizationService } from '../../../../core/services/organization.service';
import {
  Organization, OrgDashboardStats, OrgAuditLog,
  AdminVerifyRequest, OrganizationStatus
} from '../../../../core/models/organization.model';

@Component({
  selector: 'app-admin-organizations',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatTabsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatDividerModule, MatChipsModule, MatTableModule
  ],
  templateUrl: './admin-organizations.component.html'
})
export class AdminOrganizationsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private router     = inject(Router);

  // ── Pending tab ───────────────────────────────────────────────────────────
  pending      = signal<Organization[]>([]);
  loadingPending = signal(true);

  // Verify form state per org
  verifyNotes  = signal<Record<string, string>>({});
  verifyLoading = signal<string | null>(null);

  // Suspend form
  suspendOrgId  = signal<string | null>(null);
  suspendReason = signal('');
  suspendLoading = signal(false);

  // ── Stats tab ─────────────────────────────────────────────────────────────
  stats        = signal<OrgDashboardStats | null>(null);
  loadingStats = signal(false);

  // ── Audit tab ─────────────────────────────────────────────────────────────
  auditOrgId   = signal('');
  auditLogs    = signal<OrgAuditLog[]>([]);
  loadingAudit = signal(false);
  auditCols    = ['performedAt', 'action', 'performedByUserId', 'details'];

  ngOnInit() {
    this.loadPending();
  }

  // ── Pending ───────────────────────────────────────────────────────────────

  loadPending() {
    this.loadingPending.set(true);
    this.orgService.getPendingVerification().subscribe({
      next:  list => { this.pending.set(list); this.loadingPending.set(false); },
      error: ()   => this.loadingPending.set(false)
    });
  }

  verify(orgId: string, decision: 'APPROVE' | 'REJECT' | 'AWAITING_INFO') {
    const note = this.verifyNotes()[orgId] ?? '';
    if ((decision === 'REJECT' || decision === 'AWAITING_INFO') && !note.trim()) {
      alert('Une note est requise pour cette décision.'); return;
    }
    const req: AdminVerifyRequest = { decision, note: note || undefined };
    this.verifyLoading.set(orgId);
    this.orgService.verifyOrg(orgId, req).subscribe({
      next: () => {
        this.pending.update(list => list.filter(o => o.id !== orgId));
        this.verifyLoading.set(null);
      },
      error: () => this.verifyLoading.set(null)
    });
  }

  openSuspend(orgId: string) { this.suspendOrgId.set(orgId); this.suspendReason.set(''); }
  closeSuspend()             { this.suspendOrgId.set(null); }

  confirmSuspend() {
    const id = this.suspendOrgId();
    if (!id || !this.suspendReason().trim()) { alert('Le motif est obligatoire.'); return; }
    this.suspendLoading.set(true);
    this.orgService.suspendOrg(id, { reason: this.suspendReason() }).subscribe({
      next: () => {
        this.pending.update(list => list.filter(o => o.id !== id));
        this.suspendOrgId.set(null);
        this.suspendLoading.set(false);
      },
      error: () => this.suspendLoading.set(false)
    });
  }

  forceDissolve(orgId: string) {
    if (!confirm('Dissoudre définitivement cette organisation ?')) return;
    this.orgService.forceDissolveOrg(orgId).subscribe({
      next: () => this.pending.update(list => list.filter(o => o.id !== orgId))
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  loadStats() {
    if (this.stats()) return;
    this.loadingStats.set(true);
    this.orgService.getDashboardStats().subscribe({
      next:  s => { this.stats.set(s); this.loadingStats.set(false); },
      error: () => this.loadingStats.set(false)
    });
  }

  statEntries(map: Record<string, number>): { key: string; value: number }[] {
    return Object.entries(map).map(([key, value]) => ({ key, value }));
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  loadAudit() {
    if (!this.auditOrgId().trim()) return;
    this.loadingAudit.set(true);
    this.orgService.getAuditLog(this.auditOrgId()).subscribe({
      next:  page => { this.auditLogs.set(page.content); this.loadingAudit.set(false); },
      error: ()   => this.loadingAudit.set(false)
    });
  }

  setNote(orgId: string, note: string) {
    this.verifyNotes.update(m => ({ ...m, [orgId]: note }));
  }

  viewPublicProfile(id: string) { this.router.navigate(['/organizations', id]); }

  statusClass(status: OrganizationStatus): string {
    return ({ ACTIVE: 'active', PENDING_VERIFICATION: 'pending', AWAITING_INFO: 'pending',
              SUSPENDED: 'suspended', DISSOLVED: 'dissolved', REJECTED: 'rejected' } as any)[status] ?? 'other';
  }
}
