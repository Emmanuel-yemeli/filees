import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// ─────────────────────────────────────────────────────────────────────────────
// AUCUN CHANGEMENT NÉCESSAIRE ICI.
//
// provideAnimations() est déjà présent → couvre MatTabsModule et toutes les
// animations Angular Material (dont @angular/animations requis par le
// complaint-conversation.component et la notification-bell).
//
// MatTabsModule et BrowserAnimationsModule sont des imports de composants
// standalone — ils se déclarent dans le tableau `imports: []` de chaque
// composant, pas dans appConfig. Ce fichier reste identique à l'original.
// ─────────────────────────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),          
    provideNativeDateAdapter(),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'en'
      })
    ),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    })
  ]
};