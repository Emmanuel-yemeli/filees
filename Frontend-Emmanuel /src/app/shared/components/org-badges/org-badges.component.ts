import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrganizationService } from '@core/services/organization.service';
import { OrgBadgeInfo, TrustBadge } from '@core/models/organization.model';

@Component({
  selector: 'app-org-badges',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (info()) {
      <div class="badges-row">
        <span class="level-chip" [class]="'level-' + info()!.trustLevel">
          <mat-icon>verified</mat-icon> Niveau {{ info()!.trustLevel }}
        </span>
        @for (b of info()!.badges; track b) {
          <span class="badge-chip" [matTooltip]="getLabel(b)">
            <mat-icon>{{ getIcon(b) }}</mat-icon>
          </span>
        }
      </div>
    }
  `,
  styles: [`
    .badges-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .level-chip { display: inline-flex; align-items: center; gap: 3px; padding: 3px 10px; border-radius: 14px; font-size: 0.78rem; font-weight: 600; }
    .level-1 { background: #f3f4f6; color: #6b7280; }
    .level-2 { background: #fef9c3; color: #92400e; }
    .level-3 { background: #e0e7ff; color: #3730a3; }
    .level-4 { background: #d1fae5; color: #065f46; }
    .level-5 { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #fff; }
    .badge-chip { display: inline-flex; align-items: center; padding: 3px 8px; background: #f3f4f6; border-radius: 12px; cursor: default; }
    .badge-chip mat-icon { font-size: 16px; height: 16px; width: 16px; }
  `]
})
export class OrgBadgesComponent implements OnInit {
  @Input() orgId!: string;

  info = signal<OrgBadgeInfo | null>(null);

  constructor(private orgService: OrganizationService) {}

  ngOnInit() {
    this.orgService.getBadges(this.orgId).subscribe({
      next: b => this.info.set(b),
      error: () => {}
    });
  }

  getLabel(b: TrustBadge): string {
    const labels: Record<string, string> = {
      VERIFIED: 'Organisation vérifiée',
      TOP_RATED: 'Très bien notée',
      EXPERIENCED: 'Expérimentée (20+ projets)',
      FAST_RESPONDER: 'Réponse rapide',
      PREMIUM: 'Niveau Premium'
    };
    return labels[b] ?? b;
  }

  getIcon(b: TrustBadge): string {
    const icons: Record<string, string> = {
      VERIFIED: 'verified_user',
      TOP_RATED: 'star',
      EXPERIENCED: 'workspace_premium',
      FAST_RESPONDER: 'speed',
      PREMIUM: 'diamond'
    };
    return icons[b] ?? 'badge';
  }
}
