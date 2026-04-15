import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ActivityPingService } from './core/services/activity-ping.service';

/**
 * AppComponent — racine de l'application.
 *
 * Modification : démarre/arrête ActivityPingService en fonction
 * de l'état d'authentification pour la logique anti-spam email.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {

  private authService  = inject(AuthService);
  private pingService  = inject(ActivityPingService);

  ngOnInit(): void {
    // Démarrer le ping si déjà connecté (reload de page)
    if (this.authService.isAuthenticated()) {
      this.pingService.start();
    }

    // Réagir aux changements d'état d'auth (login / logout)
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.pingService.start();
      } else {
        this.pingService.stop();
      }
    });
  }
}