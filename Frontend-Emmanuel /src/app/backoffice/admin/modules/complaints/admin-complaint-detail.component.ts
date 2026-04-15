import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ComplaintService } from '@core/services/complaint.service';
import { ComplaintPdfService } from '@core/services/complaint-pdf.service';
import { UserService } from '@core/services/user.service';
import {
  Complaint, SupportMessage, ComplaintStatus, ComplaintPriority,
  MessageType, ResolutionType, ConversationType,
  STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS
} from '@core/models/complaint.model';

// ─── IMPORT CLEF ─────────────────────────────────────────────────────────────
// ComplaintConversationComponent affiche automatiquement DEUX onglets pour
// l'admin : fil Plaignant ↔ Support + fil Partie mise en cause ↔ Support.
// Il expose aussi le bouton "Impliquer la partie" si celle-ci n'est pas
// encore impliquée.
//
// On conserve FormsModule ici car l'admin a d'autres formulaires (resolve,
// assign, status…). On supprime uniquement : ViewChild messagesEnd,
// signal messages, newMessage, isSending, loadMessages(), sendMessage(),
// scrollBottom() et isNoteInterne() — tout cela est géré par le composant.
// ─────────────────────────────────────────────────────────────────────────────
import { ComplaintConversationComponent } from '../../../../shared/components/conversation/complaint-conversation.component';

@Component({
  selector: 'app-admin-complaint-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    // ↓ Nouveau composant de conversation (deux onglets pour admin)
    ComplaintConversationComponent,
  ],
  templateUrl: './admin-complaint-detail.component.html',
  styleUrls: ['./admin-complaint-detail.component.scss']
})
export class AdminComplaintDetailComponent implements OnInit {

  complaint    = signal<Complaint | null>(null);
  agents       = signal<any[]>([]);
  messages     = signal<SupportMessage[]>([]);
  reporterInfo = signal<any>(null);
  reportedInfo = signal<any>(null);
  isLoading    = signal(true);
  isDeleting   = signal(false);
  isExporting  = signal(false);

  showStatusPanel   = signal(false);
  showPriorityPanel = signal(false);
  showAssignModal   = signal(false);
  showDeleteConfirm = signal(false);
  showCloseConfirm  = signal(false);

  statuses   = Object.values(ComplaintStatus);
  priorities = Object.values(ComplaintPriority);

  // CLOSED → bouton Clôturer dédié | OPEN → irréversible
  // RESOLVED → bouton Résoudre (agent) | ESCALATED → via réassignation
  readonly changeableStatuses = Object.values(ComplaintStatus).filter(s =>
    s !== ComplaintStatus.CLOSED    &&
    s !== ComplaintStatus.OPEN      &&
    s !== ComplaintStatus.RESOLVED  &&
    s !== ComplaintStatus.ESCALATED
  );

  ComplaintStatus = ComplaintStatus;

  constructor(
    private route:            ActivatedRoute,
    private router:           Router,
    private complaintService: ComplaintService,
    private pdfService:       ComplaintPdfService,
    private userService:      UserService,
    private snackBar:         MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadComplaint(id);
    this.loadAgents();
  }

  loadComplaint(id: string): void {
    this.complaintService.getComplaintById(id).subscribe({
      next: c  => {
        this.complaint.set(c);
        this.isLoading.set(false);
        this.loadMessages(id);
        this.loadUserInfos(c);
      },
      error: () => {
        this.snackBar.open('Réclamation introuvable', 'Fermer', { duration: 3000 });
        this.goBack();
      }
    });
  }

  private loadMessages(complaintId: string): void {
    forkJoin({
      complainant: this.complaintService.getMessages(complaintId, ConversationType.COMPLAINANT),
      reported:    this.complaintService.getMessages(complaintId, ConversationType.REPORTED)
    }).subscribe({
      next: ({ complainant, reported }) => {
        this.messages.set([...complainant, ...reported]);
      },
      error: () => {}
    });
  }

  private loadUserInfos(c: Complaint): void {
    if (c.reporterId) {
      this.userService.getUserById(c.reporterId).subscribe({
        next: u => this.reporterInfo.set(u),
        error: () => {}
      });
    }
    if (c.reportedUserId) {
      this.userService.getUserById(c.reportedUserId).subscribe({
        next: u => this.reportedInfo.set(u),
        error: () => {}
      });
    }
  }

  loadAgents(): void {
    this.complaintService.getAgents().subscribe({ next: list => this.agents.set(list) });
  }

  // ── Export PDF ────────────────────────────────────────────────

  exportPdf(): void {
    const c = this.complaint();
    if (!c) return;
    this.isExporting.set(true);
    try {
      const reporter = this.reporterInfo();
      const reported = this.reportedInfo();
      this.pdfService.generate({
        complaint:     c,
        messages:      this.messages(),
        agents:        this.agents(),
        reporterName:  reporter ? `${reporter.firstName} ${reporter.lastName}` : undefined,
        reporterEmail: reporter?.email,
        reportedName:  reported ? `${reported.firstName} ${reported.lastName}` : undefined,
        reportedEmail: reported?.email
      });
      this.snackBar.open('✅ PDF exporté avec succès !', 'Fermer', {
        duration: 3000, panelClass: ['snack-success']
      });
    } catch (err) {
      console.error('Erreur export PDF', err);
      this.snackBar.open('Erreur lors de la génération du PDF', 'Fermer', { duration: 4000 });
    } finally {
      this.isExporting.set(false);
    }
  }

  // ── Actions admin ─────────────────────────────────────────────

  changeStatus(status: ComplaintStatus): void {
    this.complaintService.updateStatus(this.complaint()!.id, status).subscribe({
      next: c => {
        this.complaint.set(c);
        this.showStatusPanel.set(false);
        this.snackBar.open('Statut mis à jour', 'Fermer', { duration: 2000, panelClass: ['snack-success'] });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  changePriority(priority: ComplaintPriority): void {
    this.complaintService.updatePriority(this.complaint()!.id, priority).subscribe({
      next: c => {
        this.complaint.set(c);
        this.showPriorityPanel.set(false);
        this.snackBar.open('Priorité mise à jour', 'Fermer', { duration: 2000, panelClass: ['snack-success'] });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  closeComplaint(): void {
    this.complaintService.closeComplaint(this.complaint()!.id).subscribe({
      next: c => {
        this.complaint.set(c);
        this.showCloseConfirm.set(false);
        this.snackBar.open('Réclamation clôturée', 'Fermer', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: () => this.snackBar.open('Erreur lors de la clôture', 'Fermer', { duration: 3000 })
    });
  }

  deleteComplaint(): void {
    this.isDeleting.set(true);
    this.complaintService.deleteComplaint(this.complaint()!.id).subscribe({
      next: () => {
        this.snackBar.open('Réclamation supprimée', 'Fermer', { duration: 3000 });
        this.goBack();
      },
      error: () => {
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        this.isDeleting.set(false);
      }
    });
  }

  assignTo(agentId: string): void {
    this.complaintService.assignComplaint(this.complaint()!.id, agentId).subscribe({
      next: c => {
        this.complaint.set(c);
        this.showAssignModal.set(false);
        this.snackBar.open('Réclamation réassignée', 'Fermer', { duration: 2000, panelClass: ['snack-success'] });
      },
      error: () => this.snackBar.open('Erreur lors de la réassignation', 'Fermer', { duration: 3000 })
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  goBack(): void { this.router.navigate(['/backoffice/admin/complaints']); }
  canClose(): boolean { return this.complaint()?.status === ComplaintStatus.RESOLVED; }

  getAgentName(id: string): string {
    const a = this.agents().find(ag => ag.userId === id);
    return a ? `${a.firstName} ${a.lastName}` : id.substring(0, 8) + '…';
  }

  getStatusLabel   = (s: any) => (STATUS_LABELS   as Record<string, string>)[s] || s;
  getStatusColor   = (s: any) => (STATUS_COLORS   as Record<string, string>)[s] || '#999';
  getPriorityLabel = (p: any) => (PRIORITY_LABELS as Record<string, string>)[p] || p;
  getPriorityColor = (p: any) => (PRIORITY_COLORS as Record<string, string>)[p] || '#999';
  getCategoryLabel = (c: any) => (CATEGORY_LABELS as Record<string, string>)[c] || c;

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}