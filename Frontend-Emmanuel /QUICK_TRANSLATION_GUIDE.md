# 🌐 Guide Rapide - Ajouter une Traduction

## 3 Étapes Simples

### 1️⃣ Ajouter les clés dans les fichiers JSON

**Fichier:** `src/assets/i18n/fr.json`
```json
{
  "maSection": {
    "monTexte": "Mon texte en français"
  }
}
```

**Fichier:** `src/assets/i18n/en.json`
```json
{
  "maSection": {
    "monTexte": "My text in English"
  }
}
```

### 2️⃣ Importer TranslateModule dans votre composant

**Fichier:** `mon-composant.component.ts`
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [
    CommonModule,
    TranslateModule  // ← Ajoutez ça
  ]
})
```

### 3️⃣ Utiliser la traduction dans le template

**Fichier:** `mon-composant.component.html`
```html
<!-- Texte simple -->
<h1>{{ 'maSection.monTexte' | translate }}</h1>

<!-- Dans un placeholder -->
<input [placeholder]="'maSection.monTexte' | translate">

<!-- Dans un bouton -->
<button>{{ 'maSection.monTexte' | translate }}</button>
```

## ✅ C'est tout!

Votre texte changera automatiquement quand l'utilisateur change de langue! 🎉

---

## 📚 Besoin de plus de détails?

Consultez le guide complet: [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md)

## 💡 Exemples concrets

Regardez ces composants déjà traduits:
- `browse-jobs.component` (recherche d'offres)
- `my-applications.component` (candidatures)
- `freelancer-dashboard.component` (tableau de bord)
