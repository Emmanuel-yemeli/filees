import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ComplaintAdvancedService } from '../../../../core/services/complaint-advanced.service';
import { NpsStats } from '../../../../core/models/complaint-advanced.model';

@Component({
  selector: 'app-admin-nps-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule],
  templateUrl: './admin-nps-stats.component.html'
})
export class AdminNpsStatsComponent implements OnInit {
  private advService = inject(ComplaintAdvancedService);

  stats     = signal<NpsStats | null>(null);
  isLoading = signal(true);

  readonly scoreRange = [0,1,2,3,4,5,6,7,8,9,10];

  ngOnInit() {
    this.advService.getNpsStats().subscribe({
      next:  s  => { this.stats.set(s); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  npsColor(score: number): string {
    if (score >= 50) return '#2e7d32';
    if (score >= 0)  return '#f57f17';
    return '#c62828';
  }

  npsLabel(score: number): string {
    if (score >= 50) return 'Excellent';
    if (score >= 0)  return 'À améliorer';
    return 'Critique';
  }

  barWidth(count: number): number {
    const s = this.stats();
    if (!s || s.totalResponded === 0) return 0;
    return Math.round((count / s.totalResponded) * 100);
  }

  scoreColor(s: number): string {
    if (s <= 6) return '#c62828';
    if (s <= 8) return '#f57f17';
    return '#2e7d32';
  }

  countForScore(score: number): number {
    return this.stats()?.scoreDistribution?.[score.toString()] ?? 0;
  }
}
