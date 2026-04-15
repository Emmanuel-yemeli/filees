import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ComplaintService } from '@core/services/complaint.service';
import { ComplaintPdfService } from '@core/services/complaint-pdf.service';
import { UserService } from '@core/services/user.service';
import {
  Complaint, SupportMessage, ComplaintStatus, ComplaintPriority,
  ResolutionType, MessageType, ConversationType,
  STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS
} from '@core/models/complaint.model';

// ─── IMPORT CLEF ─────────────────────────────────────────────────────────────
// ComplaintConversationComponent affiche automatiquement DEUX onglets pour
// l'agent : fil Plaignant ↔ Support + fil Partie mise en cause ↔ Support.
// L'agent peut aussi accéder au bouton "Impliquer la partie" depuis l'onglet
// "Partie mise en cause" si elle n'est pas encore impliquée.
//
// On conserve FormsModule car l'agent a encore ses formulaires (résolution,
// changement de statut/priorité, réassignation).
// On supprime : ViewChild messagesEnd, signal messages, newMessage,
// noteContent, isSending, loadMessages(), sendMessage(), sendNote(),
// scrollToBottom() et isNoteInterne() — tout géré par le composant.
// ─────────────────────────────────────────────────────────────────────────────
import { ComplaintConversationComponent } from '../../shared/components/conversation/complaint-conversation.component';

@Component({
  selector: 'app-agent-complaint-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    TranslateModule,
    // ↓ Nouveau composant de conversation (deux onglets pour agent)
    ComplaintConversationComponent,
  ],
  templateUrl: './agent-complaint-detail.component.html',
  styleUrls: ['./agent-complaint-detail.component.scss']
})
export class AgentComplaintDetailComponent implements OnInit {

  complaint        = signal<Complaint | null>(null);
  agents           = signal<any[]>([]);
  messages         = signal<SupportMessage[]>([]);
  reporterInfo     = signal<any>(null);
  reportedInfo     = signal<any>(null);
  isLoading        = signal(true);
  isExporting      = signal(false);
  showResolveModal = signal(false);
  showAssignModal  = signal(false);

  selectedAgentId = '';

  resolution: { text: string; type: ResolutionType } = {
    text: '', type: ResolutionType.NO_ACTION
  };

  currentUserId = '';

  ComplaintStatus   = ComplaintStatus;
  ComplaintPriority = ComplaintPriority;
  ResolutionType    = ResolutionType;

  priorityOptions = Object.values(ComplaintPriority).map(v => ({ value: v, label: PRIORITY_LABELS[v] }));
  resolutionTypes = [
    { value: ResolutionType.REFUND,             label: 'Remboursement' },
    { value: ResolutionType.WARNING,            label: 'Avertissement' },
    { value: ResolutionType.ACCOUNT_SUSPENSION, label: 'Suspension du compte' },
    { value: ResolutionType.NO_ACTION,          label: 'Aucune action' },
    { value: ResolutionType.MEDIATION,          label: 'Médiation' }
  ];

  constructor(
    private route:            ActivatedRoute,
    private router:           Router,
    private complaintService: ComplaintService,
    private authService:      AuthService,
    private pdfService:       ComplaintPdfService,
    private userService:      UserService,
    private snackBar:         MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id || '';
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
    this.complaintService.getAgents().subscribe({
      next: agents => this.agents.set(agents.filter((a: any) => a.userId !== this.currentUserId))
    });
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

  // ── Actions agent ─────────────────────────────────────────────

  changeStatus(status: ComplaintStatus): void {
    if (!this.complaint()) return;
    this.complaintService.updateStatus(this.complaint()!.id, status).subscribe({
      next: updated => {
        this.complaint.set(updated);
        this.snackBar.open('Statut mis à jour', 'Fermer', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  changePriority(priority: ComplaintPriority): void {
    if (!this.complaint()) return;
    this.complaintService.updatePriority(this.complaint()!.id, priority).subscribe({
      next: updated => {
        this.complaint.set(updated);
        this.snackBar.open('Priorité mise à jour', 'Fermer', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  confirmResolve(): void {
    if (!this.resolution.text.trim() || !this.complaint()) return;
    this.complaintService.resolveComplaint(this.complaint()!.id, {
      resolution:     this.resolution.text,
      resolutionType: this.resolution.type
    }).subscribe({
      next: updated => {
        this.complaint.set(updated);
        this.showResolveModal.set(false);
        this.snackBar.open('Réclamation résolue !', 'Fermer', {
          duration: 3000, panelClass: ['snack-success']
        });
      },
      error: () => this.snackBar.open('Erreur lors de la résolution', 'Fermer', { duration: 3000 })
    });
  }

  confirmAssign(): void {
    if (!this.selectedAgentId || !this.complaint()) return;
    this.complaintService.assignComplaint(this.complaint()!.id, this.selectedAgentId).subscribe({
      next: updated => {
        this.complaint.set(updated);
        this.showAssignModal.set(false);
        this.snackBar.open('Réclamation réassignée/escaladée', 'Fermer', {
          duration: 3000, panelClass: ['snack-success']
        });
      },
      error: err => {
        const error      = err.error?.error      || 'Erreur';
        const detail     = err.error?.detail     || '';
        const suggestion = err.error?.suggestion || '';
        const fullMsg = [error, detail, suggestion].filter(Boolean).join(' ');
        this.snackBar.open(fullMsg, 'Fermer', { duration: 7000 });
      }
    });
  }

  // ── Guards affichage ─────────────────────────────────────────

  goBack    = () => this.router.navigate(['/backoffice/agent/queue']);
  canResolve = () => {
    const s = this.complaint()?.status;
    return s === ComplaintStatus.IN_PROGRESS || s === ComplaintStatus.PENDING_USER;
  };
  canReassign = () => this.complaint()?.priority === ComplaintPriority.CRITICAL;

  // Statuts modifiables par l'agent :
  // CLOSED → bouton Clôturer (admin only) | OPEN → irréversible
  // RESOLVED → bouton Résoudre dédié      | ESCALATED → bouton Réassigner
  readonly changeableStatuses = Object.values(ComplaintStatus)
    .filter(s =>
      s !== ComplaintStatus.CLOSED    &&
      s !== ComplaintStatus.OPEN      &&
      s !== ComplaintStatus.RESOLVED  &&
      s !== ComplaintStatus.ESCALATED
    )
    .map(v => ({ value: v, label: STATUS_LABELS[v] }));

  // ── Labels ───────────────────────────────────────────────────

  getStatusLabel   = (s: ComplaintStatus) => (STATUS_LABELS   as Record<string, string>)[s] || s;
  getStatusColor   = (s: ComplaintStatus) => (STATUS_COLORS   as Record<string, string>)[s] || '#999';
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