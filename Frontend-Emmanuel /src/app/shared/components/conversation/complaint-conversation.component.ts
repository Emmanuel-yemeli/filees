import {
  Component, Input, OnInit, OnDestroy, OnChanges,
  SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { interval, Subscription } from 'rxjs';
import { ComplaintService } from '../../../core/services/complaint.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Complaint, SupportMessage, ConversationType,
  MessageType, SenderType, InvolveReportedRequest
} from '../../../core/models/complaint.model';
import { UserRole } from '../../models/user.model';

/**
 * Composant de messagerie pour une réclamation.
 *
 * Affiche jusqu'à deux fils de conversation selon le rôle :
 *
 * FREELANCE / CLIENT (plaignant) :
 *   → Onglet unique : sa conversation avec le support
 *
 * FREELANCE / CLIENT (partie mise en cause) :
 *   → Onglet unique : sa conversation avec le support (fil REPORTED)
 *
 * SUPPORT_AGENT / ADMIN :
 *   → Onglet A : fil COMPLAINANT (plaignant ↔ support)
 *   → Onglet B : fil REPORTED (partie mise en cause ↔ support)
 *                + bouton "Impliquer la partie" si pas encore activé
 */
@Component({
  selector: 'app-complaint-conversation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTabsModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDialogModule, MatChipsModule, MatSelectModule
  ],
  template: `
    <div class="conversation-wrap">

      <!-- ── Support/Admin : deux onglets ──────────────────── -->
      @if (isPrivileged) {
        <mat-tab-group animationDuration="200ms" (selectedIndexChange)="onTabChange($event)">

          <!-- Onglet A — Plaignant ↔ Support -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon complainant-icon">person</mat-icon>
              Plaignant
              @if (unreadComplainant > 0) {
                <span class="tab-badge">{{ unreadComplainant }}</span>
              }
            </ng-template>
            <ng-template matTabContent>
              <div class="conversation-hint complainant-hint">
                <mat-icon>lock</mat-icon>
                Conversation confidentielle — visible uniquement par le plaignant et le support
              </div>
              <ng-container *ngTemplateOutlet="messageThread; context: {
                messages: complainantMessages,
                loading: loadingComplainant,
                conv: 'COMPLAINANT'
              }"></ng-container>
            </ng-template>
          </mat-tab>

          <!-- Onglet B — Partie mise en cause ↔ Support -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon reported-icon">gavel</mat-icon>
              Partie mise en cause
              @if (unreadReported > 0) {
                <span class="tab-badge reported">{{ unreadReported }}</span>
              }
            </ng-template>
            <ng-template matTabContent>
              @if (!reportedConvExists) {
                <!-- Pas encore impliqué -->
                <div class="involve-panel">
                  <mat-icon class="involve-icon">person_add</mat-icon>
                  <h3>Impliquer la partie mise en cause</h3>
                  <p class="involve-desc">
                    La partie mise en cause n'a pas encore été impliquée dans cette réclamation.
                    Elle ne voit pas les échanges actuels. Vous pouvez l'impliquer en lui envoyant
                    un message d'invitation.
                  </p>
                  @if (complaint.reportedUserId) {
                    <div class="involve-form">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Message d'invitation</mat-label>
                        <textarea matInput [(ngModel)]="invitationMessage" rows="4"
                                  placeholder="Expliquez à la partie mise en cause pourquoi elle est impliquée…">
                        </textarea>
                      </mat-form-field>
                      <button mat-flat-button color="primary"
                              [disabled]="!invitationMessage.trim() || involvingReported"
                              (click)="involveReportedUser()">
                        @if (involvingReported) {
                          <mat-spinner diameter="18"></mat-spinner>
                        } @else {
                          <ng-container>
                          <mat-icon>person_add</mat-icon>
                          Impliquer la partie
                          </ng-container>
                        }
                      </button>
                    </div>
                  } @else {
                    <p class="no-reported">
                      <mat-icon>info</mat-icon>
                      Aucune partie mise en cause n'a été désignée dans cette réclamation.
                    </p>
                  }
                </div>
              } @else {
                <div class="conversation-hint reported-hint">
                  <mat-icon>gavel</mat-icon>
                  Conversation confidentielle — visible uniquement par la partie mise en cause et le support
                </div>
                <ng-container *ngTemplateOutlet="messageThread; context: {
                  messages: reportedMessages,
                  loading: loadingReported,
                  conv: 'REPORTED'
                }"></ng-container>
              }
            </ng-template>
          </mat-tab>
        </mat-tab-group>

      } @else {
        <!-- ── Utilisateur : fil unique ──────────────────── -->
        <div class="single-conv">
          <div class="conversation-hint user-hint">
            <mat-icon>chat_bubble</mat-icon>
            Échangez directement avec notre équipe support
          </div>
          <ng-container *ngTemplateOutlet="messageThread; context: {
            messages: userMessages,
            loading: loadingUser,
            conv: userConvType
          }"></ng-container>
        </div>
      }

      <!-- ── Template : fil de messages ────────────────────── -->
      <ng-template #messageThread let-messages="messages" let-loading="loading" let-conv="conv">
        <div class="thread-wrap">

          <!-- Messages -->
          <div class="messages-area" #messagesContainer>
            @if (loading) {
              <div class="loading-wrap">
                <mat-spinner diameter="32"></mat-spinner>
              </div>
            } @else if (messages.length === 0) {
              <div class="empty-conv">
                <mat-icon>chat_bubble_outline</mat-icon>
                <p>Aucun message pour l'instant</p>
              </div>
            } @else {
              @for (msg of messages; track msg.id) {
                <div class="message-bubble"
                     [class.outgoing]="msg.senderId === currentUserId"
                     [class.incoming]="msg.senderId !== currentUserId"
                     [class.note-interne]="msg.messageType === 'NOTE_INTERNE'"
                     [class.auto]="msg.messageType === 'AUTO_RESPONSE'">

                  <!-- Badge type -->
                  @if (msg.messageType === 'NOTE_INTERNE') {
                    <div class="msg-badge note"><mat-icon>visibility_off</mat-icon> Note interne</div>
                  }
                  @if (msg.messageType === 'AUTO_RESPONSE') {
                    <div class="msg-badge auto"><mat-icon>smart_toy</mat-icon> Automatique</div>
                  }

                  <div class="bubble-content">
                    <span class="sender-label">
                      {{ msg.senderId === currentUserId ? 'Vous' :
                         msg.senderType === 'SUPPORT' ? 'Support NexLance' : 'Utilisateur' }}
                    </span>
                    <p class="msg-text">{{ msg.content }}</p>
                    <div class="msg-meta">
                      <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
                      @if (msg.senderId === currentUserId) {
                        <mat-icon class="read-icon" [class.read]="msg.isRead">
                          {{ msg.isRead ? 'done_all' : 'done' }}
                        </mat-icon>
                      }
                    </div>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Zone de saisie / message de blocage -->
          @if (!isConversationLocked) {
            <div class="input-area">
              @if (isPrivileged) {
                <mat-form-field appearance="outline" class="type-select">
                  <mat-select [(ngModel)]="selectedMessageType" [disabled]="sending">
                    <mat-option value="TEXT">Message</mat-option>
                    <mat-option value="NOTE_INTERNE">Note interne</mat-option>
                  </mat-select>
                </mat-form-field>
              }

              <mat-form-field appearance="outline" class="msg-input">
                <textarea matInput
                          [(ngModel)]="newMessage"
                          [placeholder]="getInputPlaceholder(conv)"
                          rows="2"
                          (keydown.enter)="onEnterKey($event, conv)">
                </textarea>
              </mat-form-field>

              <button mat-icon-button color="primary"
                      [disabled]="!newMessage.trim() || sending"
                      (click)="sendMessage(conv)"
                      matTooltip="Envoyer (Entrée)">
                @if (sending) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>send</mat-icon>
                }
              </button>
            </div>
          } @else {
            <div class="conversation-locked">
              <mat-icon>lock</mat-icon>
              <span>{{ lockMessage }}</span>
            </div>
          }
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .conversation-wrap { display: flex; flex-direction: column; height: 100%; }

    /* ── Onglets ──────────────────────────────────────────── */
    .tab-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; vertical-align: middle; }
    .complainant-icon { color: #1565C0; }
    .reported-icon    { color: #6A1B9A; }
    .tab-badge {
      background: #1565C0; color: #fff; border-radius: 10px;
      padding: 0 6px; font-size: 10px; font-weight: 700;
      margin-left: 4px; line-height: 16px;
      &.reported { background: #6A1B9A; }
    }

    /* ── Hints de confidentialité ─────────────────────────── */
    .conversation-hint {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; font-size: 11.5px; font-weight: 500;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .complainant-hint { background: #E3F2FD; color: #1565C0; }
    .reported-hint    { background: #EDE7F6; color: #6A1B9A; }
    .user-hint        { background: #E8F5E9; color: #2E7D32; }

    /* ── Panel "Impliquer" ────────────────────────────────── */
    .involve-panel {
      display: flex; flex-direction: column; align-items: center;
      padding: 32px 24px; text-align: center; gap: 12px;
    }
    .involve-icon { font-size: 48px; width: 48px; height: 48px; color: #6A1B9A; opacity: 0.7; }
    .involve-panel h3 { margin: 0; font-size: 16px; font-weight: 700; color: #1a1a1a; }
    .involve-desc { font-size: 13px; color: #666; line-height: 1.6; max-width: 420px; margin: 0; }
    .involve-form { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 12px; }
    .full-width { width: 100%; }
    .no-reported {
      display: flex; align-items: center; gap: 6px; color: #999; font-size: 13px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* ── Fil de messages ──────────────────────────────────── */
    .thread-wrap { display: flex; flex-direction: column; height: 480px; }
    .messages-area {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      scrollbar-width: thin; scrollbar-color: #ccc transparent;
    }
    .loading-wrap { display: flex; justify-content: center; align-items: center; height: 100%; }
    .empty-conv {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; color: #bbb; gap: 8px;
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
      p { font-size: 13px; margin: 0; }
    }

    /* ── Bulles ───────────────────────────────────────────── */
    .message-bubble { display: flex; flex-direction: column; max-width: 75%; }
    .message-bubble.outgoing { align-self: flex-end; align-items: flex-end; }
    .message-bubble.incoming { align-self: flex-start; align-items: flex-start; }
    .message-bubble.note-interne { max-width: 90%; align-self: center; }
    .message-bubble.auto         { max-width: 90%; align-self: center; }

    .msg-badge {
      display: flex; align-items: center; gap: 4px;
      font-size: 10px; font-weight: 600; padding: 2px 8px;
      border-radius: 10px; margin-bottom: 2px;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
      &.note { background: #FFF3E0; color: #E65100; }
      &.auto  { background: #E3F2FD; color: #1565C0; }
    }

    .bubble-content {
      padding: 8px 12px; border-radius: 12px; position: relative;
      .outgoing > & { background: #1565C0; color: #fff; border-bottom-right-radius: 2px; }
      .incoming > & { background: #F5F5F5; color: #1a1a1a; border-bottom-left-radius: 2px; }
      .note-interne > & { background: #FFF8E1; color: #5D4037;
                          border: 1px dashed #FFB74D; border-radius: 8px; }
      .auto > & { background: #E3F2FD; color: #1565C0;
                  border: 1px solid #BBDEFB; border-radius: 8px; }
    }
    .sender-label { font-size: 10px; font-weight: 700; opacity: 0.7; display: block; margin-bottom: 2px; }
    .msg-text { margin: 0; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .msg-meta { display: flex; align-items: center; gap: 4px; margin-top: 4px; justify-content: flex-end; }
    .msg-time { font-size: 10px; opacity: 0.65; }
    .read-icon { font-size: 14px; width: 14px; height: 14px; opacity: 0.6;
                 &.read { opacity: 1; color: #4FC3F7; } }

    /* ── Zone de saisie ───────────────────────────────────── */
    .input-area {
      display: flex; align-items: flex-end; gap: 8px;
      padding: 8px 12px; border-top: 1px solid #eee;
      background: #fafafa;
    }
    .conversation-locked {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-top: 1px solid #eee;
      background: #f5f5f5; color: #757575; font-size: 13px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    }
    .type-select { width: 140px; flex-shrink: 0; }
    .msg-input { flex: 1; }
    ::ng-deep .msg-input .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .type-select .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class ComplaintConversationComponent implements OnInit, OnDestroy, OnChanges {

  @Input() complaint!: Complaint;

  // Messages par fil
  complainantMessages: SupportMessage[] = [];
  reportedMessages:    SupportMessage[] = [];
  userMessages:        SupportMessage[] = [];

  // États
  loadingComplainant = true;
  loadingReported    = true;
  loadingUser        = true;

  reportedConvExists = false;
  unreadComplainant  = 0;
  unreadReported     = 0;

  // Formulaire
  newMessage          = '';
  selectedMessageType = 'TEXT';
  sending             = false;
  invitationMessage   = '';
  involvingReported   = false;

  // Rôle
  isPrivileged = false;
  currentUserId = '';
  userConvType: string = 'COMPLAINANT';

  private pollSub: Subscription | null = null;
  private subs: Subscription[] = [];

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.isPrivileged  = user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT_AGENT;

      // Déterminer le fil de l'utilisateur
      if (!this.isPrivileged && this.complaint) {
        this.userConvType = user.id === this.complaint.reportedUserId
          ? 'REPORTED'
          : 'COMPLAINANT';
      }
    }

    this.loadMessages();
    this.startPolling();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['complaint'] && !changes['complaint'].firstChange) {
      this.loadMessages();
    }
  }

  // ── Chargement ─────────────────────────────────────────────

  loadMessages(): void {
    if (!this.complaint?.id) return;

    if (this.isPrivileged) {
      this.loadComplainantThread();
      this.loadReportedThread();
    } else {
      this.loadUserThread();
    }
  }

  private loadComplainantThread(): void {
    this.loadingComplainant = true;
    this.complaintService.getMessages(this.complaint.id, ConversationType.COMPLAINANT)
      .subscribe({
        next: msgs => {
          this.complainantMessages  = msgs;
          this.unreadComplainant    = msgs.filter(m => !m.isRead).length;
          this.loadingComplainant   = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loadingComplainant = false; this.cdr.markForCheck(); }
      });
  }

  private loadReportedThread(): void {
    this.loadingReported = true;
    this.complaintService.getMessages(this.complaint.id, ConversationType.REPORTED)
      .subscribe({
        next: msgs => {
          this.reportedMessages    = msgs;
          this.reportedConvExists  = msgs.length > 0;
          this.unreadReported      = msgs.filter(m => !m.isRead).length;
          this.loadingReported     = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loadingReported = false; this.cdr.markForCheck(); }
      });
  }

  private loadUserThread(): void {
    this.loadingUser = true;
    const convType = this.userConvType === 'REPORTED'
      ? ConversationType.REPORTED
      : ConversationType.COMPLAINANT;

    this.complaintService.getMessages(this.complaint.id, convType)
      .subscribe({
        next: msgs => {
          this.userMessages = msgs;
          this.loadingUser  = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loadingUser = false; this.cdr.markForCheck(); }
      });
  }

  // ── Polling (rafraîchissement toutes les 15s) ───────────────

  private startPolling(): void {
    this.pollSub = interval(15000).subscribe(() => this.loadMessages());
  }

  // ── Envoi ──────────────────────────────────────────────────

  sendMessage(conv: string): void {
    if (!this.newMessage.trim() || this.sending) return;

    this.sending = true;
    const convType = conv === 'REPORTED'
      ? ConversationType.REPORTED
      : ConversationType.COMPLAINANT;

    const msgType = this.isPrivileged && this.selectedMessageType === 'NOTE_INTERNE'
      ? MessageType.NOTE_INTERNE
      : MessageType.TEXT;

    this.complaintService.sendMessage({
      complaintId:      this.complaint.id,
      content:          this.newMessage.trim(),
      messageType:      msgType,
      conversationType: convType
    }).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending    = false;
        this.loadMessages();
        this.cdr.markForCheck();
      },
      error: () => { this.sending = false; this.cdr.markForCheck(); }
    });
  }

  onEnterKey(event: Event, conv: string): void {
  const ke = event as KeyboardEvent;
  if (!ke.shiftKey) {
    event.preventDefault();
    this.sendMessage(conv);
    }
  }

  // ── Impliquer la partie mise en cause ──────────────────────

  involveReportedUser(): void {
    if (!this.invitationMessage.trim() || this.involvingReported) return;

    this.involvingReported = true;
    const req: InvolveReportedRequest = { invitationMessage: this.invitationMessage.trim() };

    this.complaintService.involveReportedUser(this.complaint.id, req).subscribe({
      next: () => {
        this.involvingReported = false;
        this.invitationMessage = '';
        this.reportedConvExists = true;
        this.loadReportedThread();
        this.cdr.markForCheck();
      },
      error: () => { this.involvingReported = false; this.cdr.markForCheck(); }
    });
  }

  // ── Navigation onglets ─────────────────────────────────────

  onTabChange(index: number): void {
    if (index === 0) this.loadComplainantThread();
    else             this.loadReportedThread();
  }

  // ── Helpers ────────────────────────────────────────────────

  get isConversationLocked(): boolean {
    const status = this.complaint?.status as string;
    if (!status) return false;
    if (status === 'CLOSED') return true;
    if (status === 'RESOLVED' && !this.isPrivileged) return true;
    return false;
  }

  get lockMessage(): string {
    const status = this.complaint?.status as string;
    if (status === 'CLOSED') {
      return 'Cette réclamation est clôturée. La conversation est archivée.';
    }
    if (status === 'RESOLVED' && !this.isPrivileged) {
      return "Cette réclamation est résolue. Elle sera clôturée prochainement par l'administrateur.";
    }
    return '';
  }

  getInputPlaceholder(conv: string): string {
    if (this.isPrivileged) {
      return conv === 'REPORTED'
        ? 'Répondre à la partie mise en cause…'
        : 'Répondre au plaignant…';
    }
    return 'Votre message…';
  }

  formatTime(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.subs.forEach(s => s.unsubscribe());
  }
}