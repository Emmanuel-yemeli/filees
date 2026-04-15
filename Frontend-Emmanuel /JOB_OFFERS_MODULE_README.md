# Module Job Offers - Documentation

## 📋 Vue d'ensemble

Ce module Angular implémente la gestion complète des offres d'emploi et des candidatures pour la plateforme NexLance. Il supporte trois rôles utilisateurs : **CLIENT**, **FREELANCE**, et **ADMIN**.

## 🏗️ Architecture

### Modèles de données (`src/app/core/models/`)

#### `job-offer.model.ts`
- **JobOffer** : Structure complète d'une offre d'emploi
- **JobCategory** : Enum des catégories (development, design, marketing, writing, other)
- **BudgetType** : Enum des types de budget (fixed, hourly)
- **JobOfferStatus** : Enum des statuts (draft, open, in_progress, completed, cancelled, archived)
- **ExperienceLevel** : Enum des niveaux d'expérience (beginner, intermediate, expert)
- **JobOfferFilters** : Interface pour le filtrage des offres
- **JobOfferStats** : Interface pour les statistiques

#### `application.model.ts`
- **Application** : Structure d'une candidature
- **ApplicationStatus** : Enum des statuts (pending, shortlisted, accepted, rejected, withdrawn)
- **PortfolioItem** : Structure pour les éléments de portfolio
- **ApplicationFilters** : Interface pour le filtrage des candidatures

### Services API (`src/app/core/services/`)

#### `job-offer.service.ts`
Méthodes principales :
- `createJobOffer()` : Créer une offre
- `getAllJobOffers()` : Récupérer toutes les offres avec filtres
- `getJobOfferById()` : Récupérer une offre spécifique
- `updateJobOffer()` : Mettre à jour une offre
- `deleteJobOffer()` : Supprimer (archiver) une offre
- `publishJobOffer()` : Publier une offre
- `getMyJobOffers()` : Récupérer les offres du client connecté
- `getRecommendedJobOffers()` : Récupérer les offres recommandées
- `searchJobOffers()` : Rechercher des offres
- `getJobOfferStats()` : Récupérer les statistiques (admin)

#### `application.service.ts`
Méthodes principales :
- `createApplication()` : Créer une candidature
- `getAllApplications()` : Récupérer toutes les candidatures avec filtres
- `getApplicationById()` : Récupérer une candidature spécifique
- `updateApplication()` : Mettre à jour une candidature
- `getMyApplications()` : Récupérer les candidatures du freelance connecté
- `getApplicationsByJobOffer()` : Récupérer les candidatures d'une offre
- `shortlistApplication()` : Présélectionner une candidature
- `acceptApplication()` : Accepter une candidature
- `rejectApplication()` : Rejeter une candidature
- `withdrawApplication()` : Retirer une candidature

## 🎨 Composants Interface

### CLIENT (`src/app/frontoffice/client/`)

#### 1. CreateJobOfferComponent
**Route** : `/frontoffice/client/create-job`

**Fonctionnalités** :
- Formulaire de création d'offre avec validation
- Sélection de compétences requises
- Upload de pièces jointes
- Sauvegarde en brouillon ou publication directe

**Fichiers** :
- `create-job-offer.component.ts`
- `create-job-offer.component.html`
- `create-job-offer.component.scss`

#### 2. MyJobsComponent
**Route** : `/frontoffice/client/my-jobs`

**Fonctionnalités** :
- Liste des offres publiées par le client
- Filtrage par statut
- Affichage des statistiques (vues, candidatures)
- Actions : Voir / Modifier / Archiver

**Fichiers** :
- `my-jobs.component.ts`
- `my-jobs.component.html`
- `my-jobs.component.scss`

#### 3. JobDetailClientComponent
**Route** : `/frontoffice/client/my-jobs/:id`

**Fonctionnalités** :
- Détails complets de l'offre
- Liste des candidatures reçues
- Onglets de filtrage par statut
- Actions sur candidatures : Présélectionner / Accepter / Rejeter
- Vue du profil des freelances

**Fichiers** :
- `job-detail-client.component.ts`
- `job-detail-client.component.html`
- `job-detail-client.component.scss`

### FREELANCE (`src/app/frontoffice/freelancer/`)

#### 1. BrowseJobsComponent
**Route** : `/frontoffice/freelancer/browse-jobs`

**Fonctionnalités** :
- Barre de recherche d'offres
- Filtres avancés (catégorie, budget, localisation, etc.)
- Section "Recommandées pour vous"
- Liste des offres avec pagination
- Affichage des détails clés de chaque offre

**Fichiers** :
- `browse-jobs.component.ts`
- `browse-jobs.component.html`
- `browse-jobs.component.scss`

#### 2. JobDetailFreelanceComponent
**Route** : `/frontoffice/freelancer/jobs/:id`

**Fonctionnalités** :
- Détails complets de l'offre
- Informations sur le client
- Modal de candidature avec formulaire complet
- Sélection d'éléments de portfolio
- Bouton "Sauvegarder" l'offre

**Fichiers** :
- `job-detail-freelance.component.ts`
- `job-detail-freelance.component.html`
- `job-detail-freelance.component.scss`

#### 3. MyApplicationsComponent
**Route** : `/frontoffice/freelancer/my-applications`

**Fonctionnalités** :
- Liste de toutes les candidatures soumises
- Onglets de filtrage par statut
- Affichage du statut de chaque candidature
- Action : Retirer une candidature (si applicable)
- Badges visuels pour les présélections/acceptations

**Fichiers** :
- `my-applications.component.ts`
- `my-applications.component.html`
- `my-applications.component.scss`

### ADMIN (`src/app/backoffice/admin/modules/`)

#### 1. AdminJobsComponent
**Route** : `/backoffice/admin/jobs`

**Fonctionnalités** :
- Tableau de toutes les offres
- Recherche et filtres
- Statistiques rapides (cartes KPI)
- Export CSV
- Pagination
- Accès à la modération

**Fichiers** :
- `admin-jobs/admin-jobs.component.ts`
- `admin-jobs/admin-jobs.component.html`
- `admin-jobs/admin-jobs.component.scss`

#### 2. JobAnalyticsComponent
**Route** : `/backoffice/admin/analytics/jobs`

**Fonctionnalités** :
- KPIs principaux (offres, candidatures, taux de conversion)
- Graphique : Offres par catégorie
- Graphique : Distribution des budgets
- Graphique : Taux d'acceptation par niveau
- Liste des top clients
- Évolution mensuelle (offres et candidatures)

**Fichiers** :
- `job-analytics/job-analytics.component.ts`
- `job-analytics/job-analytics.component.html`
- `job-analytics/job-analytics.component.scss`

## 🚀 Routes configurées

### Routes Client
```typescript
/frontoffice/client/create-job              // Créer une offre
/frontoffice/client/edit-job/:id            // Modifier une offre
/frontoffice/client/my-jobs                 // Mes offres
/frontoffice/client/my-jobs/:id             // Détails + candidatures
/frontoffice/client/my-jobs/:jobId/applications/:applicationId  // Détail candidature
```

### Routes Freelance
```typescript
/frontoffice/freelancer/browse-jobs         // Rechercher des offres
/frontoffice/freelancer/jobs/:id            // Détails d'une offre
/frontoffice/freelancer/my-applications     // Mes candidatures
```

### Routes Admin
```typescript
/backoffice/admin/jobs                      // Gestion des offres
/backoffice/admin/jobs/:id/moderate         // Modération d'une offre
/backoffice/admin/analytics/jobs            // Statistiques
```

## 🔧 Configuration Backend

### URL de l'API
Configurée dans `src/environments/environment.ts` :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### Endpoints attendus du backend

#### Job Offers
- `POST /api/job-offers` - Créer une offre
- `GET /api/job-offers` - Liste des offres (avec filtres)
- `GET /api/job-offers/{id}` - Détails d'une offre
- `PUT /api/job-offers/{id}` - Mettre à jour
- `DELETE /api/job-offers/{id}` - Supprimer (soft delete)
- `POST /api/job-offers/{id}/publish` - Publier
- `POST /api/job-offers/{id}/archive` - Archiver
- `GET /api/job-offers/my-jobs` - Mes offres (client)
- `GET /api/job-offers/recommended/{userId}` - Recommandations
- `GET /api/job-offers/search` - Recherche
- `GET /api/job-offers/stats` - Statistiques (admin)

#### Applications
- `POST /api/applications` - Créer une candidature
- `GET /api/applications` - Liste des candidatures
- `GET /api/applications/{id}` - Détails d'une candidature
- `PUT /api/applications/{id}` - Mettre à jour
- `DELETE /api/applications/{id}` - Supprimer
- `GET /api/applications/my-applications` - Mes candidatures (freelance)
- `GET /api/applications/job-offer/{jobOfferId}` - Candidatures d'une offre
- `POST /api/applications/{id}/shortlist` - Présélectionner
- `POST /api/applications/{id}/accept` - Accepter
- `POST /api/applications/{id}/reject` - Rejeter
- `POST /api/applications/{id}/withdraw` - Retirer
- `GET /api/applications/job-offer/{jobOfferId}/counts` - Compteurs par statut

## 📦 Dépendances

Les composants utilisent :
- `@angular/common` - CommonModule
- `@angular/forms` - FormsModule, ReactiveFormsModule
- `@angular/router` - RouterModule
- `@angular/common/http` - HttpClient

## 🎯 Prochaines étapes

1. **Tests** : Ajouter des tests unitaires et e2e
2. **Optimisations** : Implémenter le lazy loading pour les images
3. **Notifications** : Ajouter des notifications temps réel pour les changements de statut
4. **Messagerie** : Intégrer un système de messagerie entre client et freelance
5. **Paiements** : Intégrer un système de paiement sécurisé
6. **Reviews** : Système d'évaluation après achèvement du projet

## 🐛 Debugging

### Vérifications communes
1. Assurez-vous que le backend est démarré sur `http://localhost:8080`
2. Vérifiez les headers CORS sur le backend
3. Vérifiez que l'utilisateur est authentifié et a le bon rôle
4. Consultez la console du navigateur pour les erreurs

### Logs utiles
```typescript
// Dans les services, décommentez pour debug :
console.log('Response:', response);
console.error('Error:', error);
```

## 📝 Notes importantes

- Tous les composants sont **standalone** (Angular 15+)
- Les guards `authGuard`, `clientGuard`, `freelancerGuard`, `adminGuard` protègent les routes
- Les formulaires utilisent la validation Angular Forms
- Les styles utilisent SCSS avec une architecture modulaire
- L'interface est responsive et optimisée mobile

## 👥 Contribution

Pour ajouter de nouvelles fonctionnalités :
1. Créer les modèles nécessaires dans `core/models/`
2. Ajouter les méthodes dans les services correspondants
3. Créer les composants dans le dossier approprié (client/freelance/admin)
4. Ajouter les routes dans `app.routes.ts`
5. Tester avec le backend

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.
