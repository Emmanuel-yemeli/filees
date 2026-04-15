import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ComplaintAdvancedService } from '../../../../core/services/complaint-advanced.service';
import {
  UserRiskProfile, UserSanction, SanctionType
} from '../../../../core/models/complaint-advanced.model';

@Component({
  selector: 'app-admin-risk-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatDividerModule, MatTableModule, MatTabsModule
  ],
  templateUrl: './admin-risk-dashboard.component.html'
})
export class AdminRiskDashboardComponent implements OnInit {
  private advService = inject(ComplaintAdvancedService);

  // High-risk list
  highRisk    = signal<UserRiskProfile[]>([]);
  isLoading   = signal(true);

  // User lookup
  lookupId    = signal('');
  lookedUp    = signal<UserRiskProfile | null>(null);
  sanctions   = signal<UserSanction[]>([]);
  lookupLoading = signal(false);

  // Apply sanction form
  sanctionType   = signal<SanctionType>('WARNING');
  sanctionReason = signal('');
  applying       = signal(false);
  applySuccess   = signal(false);
  applyError     = signal<string | null>(null);

  readonly sanctionTypes: SanctionType[] = ['WARNING','TEMPORARY_SUSPENSION','PERMANENT_SUSPENSION'];
  readonly riskCols = ['userId','riskScore','riskLevel','resolvedAgainst','scamCount','actions'];
  readonly sanctionCols = ['type','reason','appliedAt','expiresAt','active','actions'];

  ngOnInit() {
    this.advService.getHighRiskUsers().subscribe({
      next:  list => { this.highRisk.set(list); this.isLoading.set(false); },
      error: ()   => this.isLoading.set(false)
    });
  }

  lookup() {
    if (!this.lookupId().trim()) return;
    this.lookupLoading.set(true);
    this.lookedUp.set(null);
    this.sanctions.set([]);

    this.advService.getUserRiskProfile(this.lookupId()).subscribe({
      next: p => {
        this.lookedUp.set(p);
        this.lookupLoading.set(false);
        this.loadSanctions(p.userId);
      },
      error: () => this.lookupLoading.set(false)
    });
  }

  loadSanctions(userId: string) {
    this.advService.getUserSanctions(userId).subscribe({
      next: list => this.sanctions.set(list)
    });
  }

  selectUser(profile: UserRiskProfile) {
    this.lookupId.set(profile.userId);
    this.lookedUp.set(profile);
    this.loadSanctions(profile.userId);
  }

  recompute(userId: string) {
    this.advService.recomputeRisk(userId).subscribe({
      next: updated => {
        this.highRisk.update(list => list.map(r => r.userId === userId ? updated : r));
        if (this.lookedUp()?.userId === userId) this.lookedUp.set(updated);
      }
    });
  }

  applyManualSanction() {
    const u = this.lookedUp();
    if (!u || !this.sanctionReason().trim()) {
      this.applyError.set('Motif obligatoire.'); return;
    }
    this.applying.set(true);
    this.applyError.set(null);
    this.advService.applySanction(u.userId, {
      type: this.sanctionType(),
      reason: this.sanctionReason()
    }).subscribe({
      next: s => {
        this.sanctions.update(list => [s, ...list]);
        this.applySuccess.set(true);
        this.sanctionReason.set('');
        this.applying.set(false);
        setTimeout(() => this.applySuccess.set(false), 3000);
      },
      error: err => {
        this.applyError.set(err?.error?.message ?? 'Erreur.');
        this.applying.set(false);
      }
    });
  }

  lift(sanctionId: string) {
    if (!confirm('Lever cette sanction ?')) return;
    this.advService.liftSanction(sanctionId).subscribe({
      next: updated => this.sanctions.update(list => list.map(s => s.id === sanctionId ? updated : s))
    });
  }

  riskColor(level: string): string {
    return ({ LOW: '#4caf50', MEDIUM: '#ff9800', HIGH: '#f44336', CRITICAL: '#9c27b0' } as any)[level] ?? '#999';
  }

  sanctionColor(type: string): string {
    return ({ WARNING: '#ff9800', TEMPORARY_SUSPENSION: '#f44336', PERMANENT_SUSPENSION: '#9c27b0' } as any)[type] ?? '#999';
  }
}
