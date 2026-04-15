# 🌐 Guide de Traduction (i18n) - NexLance

## 📚 Table des matières
1. [Introduction](#introduction)
2. [Architecture de traduction](#architecture-de-traduction)
3. [Comment ajouter des traductions](#comment-ajouter-des-traductions)
4. [Exemples pratiques](#exemples-pratiques)
5. [Bonnes pratiques](#bonnes-pratiques)
6. [Déboguer les traductions](#déboguer-les-traductions)

---

## 🎯 Introduction

NexLance utilise **@ngx-translate/core** pour gérer l'internationalisation (i18n). L'application supporte actuellement **Français (FR)** et **Anglais (EN)** avec possibilité d'ajouter d'autres langues facilement.

### Langues supportées:
- 🇫🇷 **Français** (langue par défaut)
- 🇬🇧 **Anglais**

---

## 🏗️ Architecture de traduction

### Structure des fichiers

```
nexlance-unified/
├── src/
│   ├── assets/
│   │   └── i18n/
│   │       ├── fr.json    ← Traductions françaises
│   │       └── en.json    ← Traductions anglaises
│   ├── app/
│   │   ├── app.config.ts  ← Configuration i18n
│   │   └── shared/
│   │       └── components/
│   │           └── language-switcher/  ← Sélecteur de langue
```

### Configuration de base

Le système de traduction est configuré dans `app.config.ts`:

```typescript
// Configuration du TranslateModule
provideHttpClient(),
importProvidersFrom(
  TranslateModule.forRoot({
    defaultLanguage: 'fr',  // Langue par défaut
    loader: {
      provide: TranslateLoader,
      useFactory: HttpLoaderFactory,
      deps: [HttpClient]
    }
  })
)
```

---

## 📝 Comment ajouter des traductions

### Étape 1: Ajouter les clés de traduction dans les fichiers JSON

#### Structure des clés
Les clés sont organisées hiérarchiquement par section:

```json
{
  "section": {
    "subsection": {
      "key": "Valeur traduite"
    }
  }
}
```

#### Exemple: Ajouter une nouvelle section

**Dans `fr.json`:**
```json
{
  "maNouvellePage": {
    "titre": "Bienvenue sur ma page",
    "sousTitre": "Ceci est un sous-titre",
    "boutons": {
      "enregistrer": "Enregistrer",
      "annuler": "Annuler"
    },
    "messages": {
      "success": "Opération réussie!",
      "error": "Une erreur est survenue"
    }
  }
}
```

**Dans `en.json`:**
```json
{
  "maNouvellePage": {
    "titre": "Welcome to my page",
    "sousTitre": "This is a subtitle",
    "boutons": {
      "enregistrer": "Save",
      "annuler": "Cancel"
    },
    "messages": {
      "success": "Operation successful!",
      "error": "An error occurred"
    }
  }
}
```

### Étape 2: Importer TranslateModule dans votre composant

**Dans votre fichier `.ts`:**

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';  // ← Importez TranslateModule

@Component({
  selector: 'app-mon-composant',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule  // ← Ajoutez-le dans imports
  ],
  templateUrl: './mon-composant.component.html',
  styleUrls: ['./mon-composant.component.scss']
})
export class MonComposantComponent {
  // Votre code ici
}
```

### Étape 3: Utiliser les traductions dans vos templates

#### Méthode 1: Le pipe `translate` (Recommandé)

```html
<!-- Traduction simple -->
<h1>{{ 'maNouvellePage.titre' | translate }}</h1>

<!-- Traduction avec sous-section -->
<p>{{ 'maNouvellePage.sousTitre' | translate }}</p>

<!-- Dans les boutons -->
<button>{{ 'maNouvellePage.boutons.enregistrer' | translate }}</button>

<!-- Dans les placeholders -->
<input [placeholder]="'common.search' | translate">

<!-- Dans les attributs -->
<img [alt]="'common.logo' | translate">
```

#### Méthode 2: Utiliser TranslateService (Pour le code TypeScript)

```typescript
import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export class MonComposantComponent {
  private translate = inject(TranslateService);

  afficherMessage() {
    // Obtenir une traduction instantanée
    const message = this.translate.instant('maNouvellePage.messages.success');
    console.log(message);

    // Obtenir une traduction avec Observable
    this.translate.get('maNouvellePage.titre').subscribe((texte: string) => {
      console.log(texte);
    });
  }

  // Exemple: Traduire dynamiquement selon une variable
  getStatusLabel(status: string): string {
    return this.translate.instant(`jobs.${status}`);
  }
}
```

---

## 💡 Exemples pratiques

### Exemple 1: Traduire une page complète

**Template HTML:**
```html
<div class="ma-page">
  <!-- En-tête -->
  <h1>{{ 'page.titre' | translate }}</h1>
  <p>{{ 'page.description' | translate }}</p>

  <!-- Formulaire -->
  <form>
    <label>{{ 'page.form.nom' | translate }}</label>
    <input type="text" [placeholder]="'page.form.nomPlaceholder' | translate">

    <button type="submit">{{ 'page.form.soumettre' | translate }}</button>
  </form>

  <!-- Liste dynamique -->
  <ul>
    <li *ngFor="let item of items">
      {{ item.name }} - {{ 'page.statut.' + item.status | translate }}
    </li>
  </ul>
</div>
```

**Fichiers de traduction:**
```json
// fr.json
{
  "page": {
    "titre": "Mon Titre",
    "description": "Ma description",
    "form": {
      "nom": "Nom",
      "nomPlaceholder": "Entrez votre nom",
      "soumettre": "Envoyer"
    },
    "statut": {
      "actif": "Actif",
      "inactif": "Inactif"
    }
  }
}

// en.json
{
  "page": {
    "titre": "My Title",
    "description": "My description",
    "form": {
      "nom": "Name",
      "nomPlaceholder": "Enter your name",
      "soumettre": "Submit"
    },
    "statut": {
      "actif": "Active",
      "inactif": "Inactive"
    }
  }
}
```

### Exemple 2: Menu déroulant traduit

**Template HTML:**
```html
<mat-menu #menu="matMenu">
  <button mat-menu-item *ngFor="let option of statusOptions">
    {{ ('jobs.' + option.value) | translate }}
  </button>
</mat-menu>
```

**Composant TypeScript:**
```typescript
statusOptions = [
  { value: 'all' },
  { value: 'OPEN' },
  { value: 'CLOSED' },
  { value: 'DRAFT' }
];
```

**Traductions:**
```json
{
  "jobs": {
    "all": "Toutes",
    "OPEN": "Ouvertes",
    "CLOSED": "Fermées",
    "DRAFT": "Brouillons"
  }
}
```

### Exemple 3: Traduction conditionnelle

**Template HTML:**
```html
<!-- Avec ternaire -->
<span>{{ job.type === 'FIXED' ? ('jobs.fixed' | translate) : ('jobs.hourly' | translate) }}</span>

<!-- Avec ngIf -->
<div *ngIf="isLoading">{{ 'common.loading' | translate }}</div>
<div *ngIf="!isLoading && items.length === 0">{{ 'common.noData' | translate }}</div>
```

---

## ✅ Bonnes pratiques

### 1. Organisation des clés

✅ **Bon:** Organisé hiérarchiquement
```json
{
  "jobs": {
    "stats": {
      "total": "Total",
      "active": "Actifs"
    }
  }
}
```

❌ **Mauvais:** Clés plates
```json
{
  "jobsStatsTotal": "Total",
  "jobsStatsActive": "Actifs"
}
```

### 2. Nommage des clés

✅ **Bon:** Descriptif et cohérent
```json
{
  "dashboard": {
    "welcome": "Bienvenue",
    "stats": {
      "totalProjects": "Projets Total"
    }
  }
}
```

❌ **Mauvais:** Vague et incohérent
```json
{
  "db": {
    "w": "Bienvenue",
    "tp": "Projets Total"
  }
}
```

### 3. Réutilisation

Créez une section `common` pour les traductions réutilisables:

```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "loading": "Chargement...",
    "error": "Erreur",
    "success": "Succès"
  }
}
```

Utilisez-les partout:
```html
<button>{{ 'common.save' | translate }}</button>
<button>{{ 'common.cancel' | translate }}</button>
```

### 4. N'oubliez pas les deux langues

Chaque fois que vous ajoutez une clé dans `fr.json`, ajoutez la même dans `en.json`:

```json
// fr.json
"nouveauMessage": "Nouveau message"

// en.json
"nouveauMessage": "New message"
```

---

## 🐛 Déboguer les traductions

### Problème 1: Traduction non affichée

**Symptôme:** Vous voyez la clé au lieu du texte traduit (ex: `dashboard.welcome`)

**Solutions:**
1. ✅ Vérifiez que `TranslateModule` est importé dans votre composant
2. ✅ Vérifiez l'orthographe de la clé dans le JSON
3. ✅ Vérifiez que la clé existe dans les deux fichiers (`fr.json` et `en.json`)
4. ✅ Rechargez la page complètement (Ctrl+F5)

### Problème 2: Traduction ne change pas

**Symptôme:** Le changement de langue ne fonctionne pas

**Solutions:**
1. ✅ Vérifiez que le LanguageSwitcher fonctionne correctement
2. ✅ Ouvrez la console (F12) et vérifiez les erreurs
3. ✅ Vérifiez le localStorage: `localStorage.getItem('language')`

### Problème 3: Erreur de compilation

**Symptôme:** Erreur TypeScript dans le fichier `.ts`

**Solution:**
```typescript
// ❌ Mauvais
import { TranslateModule } from '@ngx-translate';

// ✅ Bon
import { TranslateModule } from '@ngx-translate/core';
```

---

## 🚀 Checklist pour ajouter une traduction

- [ ] Ajouter la clé de traduction dans `fr.json`
- [ ] Ajouter la même clé dans `en.json`
- [ ] Importer `TranslateModule` dans le composant `.ts`
- [ ] Utiliser le pipe `| translate` dans le template `.html`
- [ ] Tester avec les deux langues (FR/EN)
- [ ] Vérifier qu'il n'y a pas d'erreurs dans la console

---

## 📖 Exemples de composants traduits

✅ **Composants déjà traduits:**
- ✅ Header navigation
- ✅ Browse Jobs (Freelancer)
- ✅ My Applications (Freelancer)
- ✅ My Jobs (Client)
- ✅ Freelancer Dashboard
- ✅ Client Dashboard

Vous pouvez consulter ces composants pour voir des exemples de traductions en action!

---

## 🆘 Besoin d'aide?

1. Consultez la documentation officielle: [ngx-translate](https://github.com/ngx-translate/core)
2. Regardez les composants existants pour des exemples
3. Vérifiez les fichiers `fr.json` et `en.json` pour voir toutes les clés disponibles

---

**Fait avec ❤️ par l'équipe NexLance**
