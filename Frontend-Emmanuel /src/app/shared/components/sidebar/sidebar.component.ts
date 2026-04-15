import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../models/user.model';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  currentUser = signal<User | null>(null);
  isCollapsed = signal(false);

  // Track which module groups are expanded
  expandedGroups = signal<Record<string, boolean>>({
    users: false,
    jobs: false,
    projects: false,
    recommendations: false
  });

  constructor() {
    this.authService.currentUser$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(user => {
      this.currentUser.set(user);
    });
  }

  toggleGroup(group: string): void {
    if (this.isCollapsed()) return;
    this.expandedGroups.update(groups => ({
      ...groups,
      [group]: !groups[group]
    }));
  }

  isGroupExpanded(group: string): boolean {
    return this.expandedGroups()[group] ?? false;
  }

  get userInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  get userFullName(): string {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  }

  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);
  }

  logout(): void {
    this.authService.logout();
  }
}
