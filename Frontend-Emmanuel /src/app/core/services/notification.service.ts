import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AppNotification, isComplaintNotification } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  // REST → via Gateway (8765) ; WebSocket → direct 9090 (STOMP ne passe pas par HTTP Gateway)
  private apiUrl = `${environment.notificationsApiUrl}/notifications`;
  private wsUrl  = environment.notificationsWsUrl;

  private stompClient: Client | null = null;
  private connected = false;
  private currentUserId: string | null = null;

  // ── Streams publics ──────────────────────────────────────
  private notificationsSubject  = new BehaviorSubject<AppNotification[]>([]);
  private unreadCountSubject    = new BehaviorSubject<number>(0);

  /** Émis à chaque nouvelle notification temps-réel → déclenche le toast */
  private newNotificationSubject = new Subject<AppNotification>();

  notifications$      = this.notificationsSubject.asObservable();
  unreadCount$        = this.unreadCountSubject.asObservable();
  newNotification$    = this.newNotificationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // =========================================================
  // CONNEXION WEBSOCKET
  // =========================================================

  connect(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id) return;

    this.currentUserId = user.id;
    this.loadNotifications(user.id);
    this.loadUnreadCount(user.id);

    if (this.connected && this.stompClient?.active) return;
    this.disconnectWs();

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: str => { if (!environment.production) console.log('[WS]', str); }
    });

    this.stompClient.onConnect = () => {
      this.connected = true;
      if (!environment.production) console.log('[WS] Connecté au service de notifications');

      this.stompClient?.subscribe(
        `/topic/notifications/${user.id}`,
        (msg: IMessage) => {
          const notif: AppNotification = JSON.parse(msg.body);
          this.onNewNotification(notif);
        }
      );
    };

    this.stompClient.onStompError = (frame) => {
      this.connected = false;
      console.warn('[WS] Erreur STOMP :', frame.headers['message']);
    };

    this.stompClient.onWebSocketClose = () => {
      this.connected = false;
      // Le client STOMP gère la reconnexion via reconnectDelay
    };

    try { this.stompClient.activate(); } catch (err) {
      console.warn('[WS] Impossible d\'activer le client STOMP :', err);
    }
  }

  private onNewNotification(notif: AppNotification): void {
    // Ajouter en tête de liste
    const current = this.notificationsSubject.getValue();
    this.notificationsSubject.next([notif, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);

    // Émettre pour le toast
    this.newNotificationSubject.next(notif);
  }

  // =========================================================
  // REST
  // =========================================================

  loadNotifications(userId: string): void {
    // Le backend retourne une Page<T> — on extrait le tableau .content
    this.http.get<{ content: AppNotification[] }>(`${this.apiUrl}/user/${userId}?page=0&size=20`).subscribe({
      next: page => this.notificationsSubject.next(page.content ?? []),
      error: err => console.error('[Notifications] load error:', err)
    });
  }

  loadUnreadCount(userId: string): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/user/${userId}/unread-count`).subscribe({
      next: r => this.unreadCountSubject.next(r.count),
      error: () => {}
    });
  }

  getNotifications(userId: string): Observable<AppNotification[]> {
    return this.http.get<{ content: AppNotification[] }>(`${this.apiUrl}/user/${userId}?page=0&size=20`)
      .pipe(map(page => page.content ?? []));
  }

  getUnreadNotifications(userId: string): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/user/${userId}/unread`);
  }

  markAsRead(notificationId: string): Observable<AppNotification> {
    return this.http.put<AppNotification>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(userId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/user/${userId}/read-all`, {});
  }

  markAsReadAndUpdate(notif: AppNotification): void {
    if (notif.read || !notif.id) return;
    this.markAsRead(notif.id).subscribe({
      next: updated => {
        const list = this.notificationsSubject.getValue()
          .map(n => n.id === updated.id ? { ...n, read: true } : n);
        this.notificationsSubject.next(list);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.getValue() - 1));
      }
    });
  }

  markAllReadAndUpdate(userId: string): void {
    this.markAllAsRead(userId).subscribe({
      next: () => {
        const updated = this.notificationsSubject.getValue().map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(updated);
        this.unreadCountSubject.next(0);
      }
    });
  }

  createNotification(
    recipientId: string, type: string, title: string,
    message: string, referenceId?: string, referenceType?: string
  ): void {
    this.http.post<AppNotification>(this.apiUrl, {
      recipientId, type, title, message,
      referenceId: referenceId || '',
      referenceType: referenceType || ''
    }).subscribe({ error: err => console.warn('[Notifications] create error:', err) });
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private disconnectWs(): void {
    try { this.stompClient?.deactivate(); } catch {}
    this.stompClient = null;
    this.connected = false;
  }

  disconnect(): void {
    this.disconnectWs();
    this.currentUserId = null;
  }

  ngOnDestroy(): void { this.disconnect(); }
}