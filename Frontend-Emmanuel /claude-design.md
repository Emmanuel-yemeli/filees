# CLAUDE.md — NexLance Design System
# Règles de design à respecter sur TOUS les composants

## IDENTITÉ DE MARQUE

Nexlance est une plateforme de freelance professionnelle.
Ton : professionnel, sobre, efficace. Pas startup flashy, pas corporate froid.
Référence visuelle : Linear.app + Notion + Stripe Dashboard

---

## COULEURS — Tokens officiels (utiliser UNIQUEMENT ces valeurs)

### Palette primaire (cyan)
```
--color-primary-50:  #F0F9FF
--color-primary-100: #E0F2FE
--color-primary-200: #BAE6FD
--color-primary-400: #38BDF8
--color-primary-500: #0EA5E9   ← CTA principal, liens actifs
--color-primary-600: #0284C7   ← hover sur primary
--color-primary-700: #0369A1   ← texte sur fond clair primary
--color-primary-900: #0C4A6E   ← titres foncés
```

### Palette accent (orange) — usage limité aux badges et highlights
```
--color-accent-400:  #FB923C
--color-accent-500:  #F97316   ← badges seulement, max 10% de la surface
--color-accent-600:  #EA580C
```

### Neutres — base de toute l'interface
```
--color-gray-0:   #FFFFFF
--color-gray-50:  #F8FAFC   ← fond de page
--color-gray-100: #F1F5F9   ← fond de section, input bg
--color-gray-200: #E2E8F0   ← bordures légères
--color-gray-300: #CBD5E1   ← bordures séparateurs
--color-gray-400: #94A3B8   ← placeholder, icônes inactives
--color-gray-500: #64748B   ← texte secondaire
--color-gray-600: #475569   ← texte corps
--color-gray-700: #334155   ← texte important
--color-gray-800: #1E293B   ← titres
--color-gray-900: #0F172A   ← titres principaux
```

### Sémantique
```
--color-success:     #10B981
--color-success-bg:  #ECFDF5
--color-warning:     #F59E0B
--color-warning-bg:  #FFFBEB
--color-error:       #EF4444
--color-error-bg:    #FEF2F2
--color-info:        #3B82F6
--color-info-bg:     #EFF6FF
```

### ❌ COULEURS INTERDITES
- NE JAMAIS utiliser `#1E40AF` (bleu indigo) — c'est un vestige incohérent
- NE JAMAIS utiliser des gradients sur les headers et sidebars
- NE JAMAIS mélanger primary-500 et indigo dans le même composant

---

## TYPOGRAPHIE

### Chargement (ajouter dans index.html)
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
```

### Stack
```scss
$font-body:    'Inter', -apple-system, sans-serif;
$font-heading: 'Plus Jakarta Sans', 'Inter', sans-serif;
$font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

### Échelle typographique
```
h1 : Plus Jakarta Sans, 32px, weight 700, color gray-900
h2 : Plus Jakarta Sans, 24px, weight 700, color gray-800
h3 : Plus Jakarta Sans, 18px, weight 600, color gray-800
h4 : Inter, 16px, weight 600, color gray-700
body-lg : Inter, 16px, weight 400, color gray-600, line-height 1.7
body    : Inter, 14px, weight 400, color gray-600, line-height 1.6
caption : Inter, 12px, weight 400, color gray-400, line-height 1.5
label   : Inter, 12px, weight 600, color gray-500, letter-spacing 0.05em, UPPERCASE
```

---

## ESPACEMENTS — Utiliser UNIQUEMENT ces valeurs

```
$space-1:  4px
$space-2:  8px
$space-3:  12px
$space-4:  16px
$space-5:  20px
$space-6:  24px
$space-8:  32px
$space-10: 40px
$space-12: 48px
$space-16: 64px
$space-20: 80px
```

### Règles d'application
- Padding interne des cards : 24px (space-6)
- Gap entre sections : 32px (space-8)
- Padding de page : 32px horizontal, 40px vertical
- Gap entre éléments de formulaire : 20px (space-5)
- Padding interne des inputs : 10px 14px

---

## BORDER RADIUS

```
$radius-xs:   4px   → tags, badges inline
$radius-sm:   6px   → inputs, small buttons
$radius-md:   8px   → buttons, pills
$radius-lg:   12px  → cards, panels, dropdowns
$radius-xl:   16px  → modals, large cards
$radius-2xl:  24px  → hero cards
$radius-full: 9999px → avatars, status dots
```

---

## OMBRES — Utiliser avec parcimonie

```scss
$shadow-none:  none
$shadow-xs:    0 1px 2px rgba(0,0,0,0.04)
$shadow-sm:    0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
$shadow-md:    0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)
$shadow-lg:    0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.03)
$shadow-focus: 0 0 0 3px rgba(14,165,233,0.2)   ← ring de focus primary
```

### Règles
- Cards au repos : `$shadow-sm`
- Cards au hover : `$shadow-md` (PAS de translateY, juste l'ombre change)
- Dropdowns, popovers : `$shadow-lg`
- ❌ JAMAIS `$shadow-xl` ou `$shadow-2xl` dans les listes

---

## COMPOSANTS — Règles visuelles

### Cards
```scss
.card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
  transition: box-shadow 150ms ease, border-color 150ms ease;
  
  &:hover {
    box-shadow: $shadow-md;
    border-color: var(--color-gray-300);
    // ❌ PAS de transform translateY — trop agité
  }
}
```

### Boutons
```scss
// PRIMARY
.btn-primary {
  background: var(--color-primary-500);
  color: white;
  border: none;
  border-radius: $radius-md;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 14px;
  transition: background 150ms ease;
  
  &:hover { background: var(--color-primary-600); }
  // ❌ PAS de transform, PAS de box-shadow au hover
}

// SECONDARY (outlined)
.btn-secondary {
  background: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: $radius-md;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
  
  &:hover {
    background: var(--color-gray-50);
    border-color: var(--color-gray-400);
  }
}

// GHOST
.btn-ghost {
  background: transparent;
  color: var(--color-gray-600);
  border: none;
  padding: 8px 12px;
  
  &:hover {
    background: var(--color-gray-100);
    color: var(--color-gray-800);
  }
}
```

### Inputs
```scss
.input {
  width: 100%;
  padding: 10px 14px;
  background: white;
  border: 1px solid var(--color-gray-300);
  border-radius: $radius-sm;
  font-size: 14px;
  color: var(--color-gray-800);
  transition: border-color 150ms ease, box-shadow 150ms ease;
  
  &:hover { border-color: var(--color-gray-400); }
  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: $shadow-focus;
  }
  &::placeholder { color: var(--color-gray-400); }
}
```

### Badges / Status pills
```scss
// Structure : background légère + texte foncé de la même teinte
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: $radius-full;
  font-size: 12px;
  font-weight: 600;
  
  &.success { background: var(--color-success-bg); color: #065F46; }
  &.warning { background: var(--color-warning-bg); color: #92400E; }
  &.error   { background: var(--color-error-bg);   color: #991B1B; }
  &.info    { background: var(--color-info-bg);     color: #1E40AF; }
  &.neutral { background: var(--color-gray-100);    color: var(--color-gray-600); }
}
```

---

## LAYOUT

### Header (frontoffice)
```
Fond : white
Bordure bas : 1px solid var(--color-gray-200)
Hauteur : 64px
Shadow : $shadow-xs
❌ PAS de gradient bleu
```

### Sidebar (backoffice)
```
Fond : var(--color-gray-900)   ← sombre, professionnel
Texte nav : var(--color-gray-400) → white sur hover/active
Accent actif : var(--color-primary-500) barre gauche 3px
❌ PAS de gradient cyan
```

### Page background
```
Frontoffice : var(--color-gray-50)  ← gris très clair uniforme
Backoffice  : var(--color-gray-50)
❌ PAS de gradient sur le fond de page
```

### Largeurs maximales
```
Page standard : 1200px
Page large (admin tables) : 1400px
Formulaire (create/edit) : 720px
Modal : 560px
```

---

## ANIMATIONS — Règles strictes

```
Durée transitions : 150ms (fast) / 250ms (standard)
Easing : ease / ease-in-out
```

### ✅ AUTORISÉ
- `transition: background 150ms ease` — changement de couleur bouton
- `transition: box-shadow 150ms ease` — hover de card
- `transition: border-color 150ms ease` — focus d'input
- Skeleton loading shimmer
- Spinner de chargement

### ❌ INTERDIT
- `transform: translateY(-2px)` sur les cards
- `transform: translateY(-1px)` sur tous les boutons
- Animations d'entrée page complexes
- Gradients animés
- Micro-interactions sur chaque élément (tout qui bouge = rien qui bouge)

---

## PATTERNS RÉCURRENTS À ÉVITER

1. **Headers avec dégradé bleu** → blanc avec bordure grise
2. **Sidebar cyan gradient** → sidebar sombre #0F172A
3. **Box-shadow XXL sur cartes normales** → shadow-sm au repos uniquement
4. **translateY sur hover** → ne pas bouger les éléments
5. **3 bleus différents** → uniquement primary-500 (#0EA5E9) comme couleur primaire
6. **Font stack système** → Inter + Plus Jakarta Sans chargées depuis Google Fonts
7. **Font-weight 700 sur le body** → 400 pour le corps, 600/700 pour les titres seulement
8. **Gradients sur le background de page** → couleur plate gray-50

---

## RÉFÉRENCE VISUELLE

Design targets :
- Linear.app : sidebar sombre, typographie propre, spacing généreux
- Stripe Dashboard : cards avec bordures fines, état neutre > état hover
- Notion : hiérarchie typographique claire, peu de couleur