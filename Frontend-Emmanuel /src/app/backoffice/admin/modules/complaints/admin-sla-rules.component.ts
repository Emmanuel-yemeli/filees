import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { ComplaintAdvancedService } from '../../../../core/services/complaint-advanced.service';
import { SlaRule, CreateSlaRuleRequest } from '../../../../core/models/complaint-advanced.model';

@Component({
  selector: 'app-admin-sla-rules',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatDividerModule, MatTableModule
  ],
  templateUrl: './admin-sla-rules.component.html'
})
export class AdminSlaRulesComponent implements OnInit {
  private advService = inject(ComplaintAdvancedService);

  rules      = signal<SlaRule[]>([]);
  isLoading  = signal(true);
  editingId  = signal<string | null>(null);
  saving     = signal(false);
  showForm   = signal(false);

  readonly priorities = ['LOW','MEDIUM','HIGH','CRITICAL'];
  readonly cols = ['priority','maxFirstResponseHours','maxResolutionHours','autoEscalateOnBreach','actions'];

  form: CreateSlaRuleRequest = {
    priority: 'MEDIUM',
    maxFirstResponseHours: 8,
    maxResolutionHours: 48,
    autoEscalateOnBreach: true
  };

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading.set(true);
    this.advService.getSlaRules().subscribe({
      next:  r  => { this.rules.set(r); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { priority: 'MEDIUM', maxFirstResponseHours: 8, maxResolutionHours: 48, autoEscalateOnBreach: true };
    this.showForm.set(true);
  }

  openEdit(rule: SlaRule) {
    this.editingId.set(rule.id);
    this.form = {
      priority: rule.priority,
      maxFirstResponseHours: rule.maxFirstResponseHours,
      maxResolutionHours: rule.maxResolutionHours,
      autoEscalateOnBreach: rule.autoEscalateOnBreach
    };
    this.showForm.set(true);
  }

  save() {
    this.saving.set(true);
    const id = this.editingId();
    const obs = id
      ? this.advService.updateSlaRule(id, this.form)
      : this.advService.createSlaRule(this.form);

    obs.subscribe({
      next: saved => {
        if (id) {
          this.rules.update(list => list.map(r => r.id === id ? saved : r));
        } else {
          this.rules.update(list => [...list, saved]);
        }
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  delete(rule: SlaRule) {
    if (!confirm(`Supprimer la règle SLA pour la priorité ${rule.priority} ?`)) return;
    this.advService.deleteSlaRule(rule.id).subscribe({
      next: () => this.rules.update(list => list.filter(r => r.id !== rule.id))
    });
  }

  cancel() { this.showForm.set(false); }

  priorityColor(p: string): string {
    return ({ LOW: '#4caf50', MEDIUM: '#ff9800', HIGH: '#f44336', CRITICAL: '#9c27b0' } as any)[p] ?? '#999';
  }
}
