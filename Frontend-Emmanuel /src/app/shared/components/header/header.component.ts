import { Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ComplaintService } from '../../../core/services/complaint.service';
import { User, UserRole } from '../../models/user.model';
import { ComplaintStatus } from '../../../core/models/complaint.model';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    TranslateModule,
    LanguageSwitcherComponent,
    NotificationBellComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private authService     = inject(AuthService);
  private complaintSvc    = inject(ComplaintService);
  private router          = inject(Router);
  private snackBar        = inject(MatSnackBar);
  private destroyRef      = inject(DestroyRef);

  currentUser        = signal<User | null>(null);
  // Nombre de réclamations ouvertes/en-cours (badge rouge)
  openComplaintsCount = signal<number>(0);

  UserRole = UserRole;

  constructor() {
    this.authService.currentUser$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(user => {
      this.currentUser.set(user);
      // Charger le badge uniquement pour CLIENT et FREELANCER
      if (user && (user.role === UserRole.CLIENT || user.role === UserRole.FREELANCER)) {
        this.loadOpenComplaintsCount();
      } else {
        this.openComplaintsCount.set(0);
      }
    });
  }

  ngOnInit(): void {}

  // ── Badge : nombre de réclamations non clôturées ─────────────

  private loadOpenComplaintsCount(): void {
    this.complaintSvc.getMyComplaints().subscribe({
      next: complaints => {
        const active = complaints.filter(c =>
          c.status === ComplaintStatus.OPEN ||
          c.status === ComplaintStatus.IN_PROGRESS ||
          c.status === ComplaintStatus.PENDING_USER
        ).length;
        this.openComplaintsCount.set(active);
      },
      error: () => this.openComplaintsCount.set(0)
    });
  }

  // ── Role helpers ─────────────────────────────────────────────

  get isFreelancer(): boolean {
    return this.currentUser()?.role === UserRole.FREELANCER;
  }

  get isClient(): boolean {
    return this.currentUser()?.role === UserRole.CLIENT;
  }

  get isAdmin(): boolean {
    return this.currentUser()?.role === UserRole.ADMIN;
  }

  get userInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  get userFullName(): string {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  }

  // ── Navigation ───────────────────────────────────────────────

  navigateToDashboard(): void {
    const user = this.currentUser();
    if (!user) return;
    switch (user.role) {
      case UserRole.CLIENT:     this.router.navigate(['/frontoffice/client/dashboard']); break;
      case UserRole.FREELANCER: this.router.navigate(['/frontoffice/freelancer/dashboard']); break;
      case UserRole.ADMIN:      this.router.navigate(['/backoffice/admin/dashboard']); break;
    }
  }

  /** Navigation vers la liste des réclamations selon le rôle */
  navigateToComplaints(): void {
    if (this.isClient) {
      this.router.navigate(['/frontoffice/client/my-complaints']);
    } else if (this.isFreelancer) {
      this.router.navigate(['/frontoffice/freelancer/my-complaints']);
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/frontoffice/profile']);
  }

  navigateToFreelancerProfile(): void {
    this.router.navigate(['/frontoffice/profile/professional']);
  }

  navigateToKyc(): void {
    this.router.navigate(['/frontoffice/kyc']);
  }

  navigateToSecurity(): void {
    this.router.navigate(['/frontoffice/security']);
  }

  logout(): void {
    this.snackBar.open('Déconnexion...', '', {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    setTimeout(() => this.authService.logout(), 500);
  }
}