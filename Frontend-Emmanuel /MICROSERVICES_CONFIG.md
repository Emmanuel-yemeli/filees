# Configuration Microservices - Job Offers Module

## 📋 Architecture Microservices

Ce projet utilise une architecture microservices avec deux services backend distincts :

### 🔌 Services Backend

| Service | Port | Base URL | Description |
|---------|------|----------|-------------|
| **User Service** | 8080 | `http://localhost:8080/api` | Gestion des utilisateurs, authentification, KYC |
| **Job Offers Service** | 9090 | `http://localhost:9090/api` | Gestion des offres d'emploi et candidatures |

## 🔧 Configuration Angular

### Fichiers d'Environnement

#### `environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',          // User service (backward compatibility)
  userApiUrl: 'http://localhost:8080/api',      // User service
  jobOffersApiUrl: 'http://localhost:9090/api'  // Job offers microservice
};
```

#### `environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api',          // User service (backward compatibility)
  userApiUrl: 'http://localhost:8080/api',      // User service
  jobOffersApiUrl: 'http://localhost:9090/api'  // Job offers microservice
};
```

## 📡 Endpoints Backend - Job Offers Service (Port 9090)

### Job Offers API

#### Base Path: `/api/job-offers`

| Méthode | Endpoint | Description | Retour |
|---------|----------|-------------|--------|
| POST | `/` | Créer une offre | `JobOffer` |
| GET | `/` | Récupérer toutes les offres | `List<JobOffer>` |
| GET | `/{id}` | Récupérer une offre par ID (incrémente viewCount) | `JobOffer` |
| PUT | `/{id}` | Mettre à jour une offre | `JobOffer` |
| DELETE | `/{id}` | Supprimer une offre | `void` |
| PATCH | `/{id}/status?status={status}` | Changer le statut | `JobOffer` |
| PATCH | `/{id}/archive` | Archiver une offre | `JobOffer` |
| GET | `/status/{status}` | Offres par statut | `List<JobOffer>` |
| GET | `/client/{clientId}` | Offres d'un client | `List<JobOffer>` |
| GET | `/active` | Offres actives (status=OPEN) | `List<JobOffer>` |
| GET | `/category/{category}` | Offres par catégorie | `List<JobOffer>` |
| GET | `/remote` | Offres en remote | `List<JobOffer>` |
| GET | `/experience-level/{level}` | Offres par niveau d'expérience | `List<JobOffer>` |

### Applications API

#### Base Path: `/api/applications`

| Méthode | Endpoint | Description | Retour |
|---------|----------|-------------|--------|
| POST | `/` | Créer une candidature | `Application` |
| GET | `/` | Récupérer toutes les candidatures | `List<Application>` |
| GET | `/{id}` | Récupérer une candidature par ID | `Application` |
| PUT | `/{id}` | Mettre à jour une candidature | `Application` |
| DELETE | `/{id}` | Supprimer une candidature | `void` |
| PATCH | `/{id}/status?status={status}` | Changer le statut | `Application` |
| PATCH | `/{id}/read` | Marquer comme lue | `Application` |
| PATCH | `/{id}/withdraw` | Retirer la candidature | `Application` |
| GET | `/job-offer/{jobOfferId}` | Candidatures d'une offre | `List<Application>` |
| GET | `/job-offer/{jobOfferId}/unread` | Candidatures non lues | `List<Application>` |
| GET | `/job-offer/{jobOfferId}/count` | Nombre de candidatures | `Long` |
| GET | `/job-offer/{jobOfferId}/count/{status}` | Nombre par statut | `Long` |
| GET | `/freelance/{freelanceId}` | Candidatures d'un freelance | `List<Application>` |
| GET | `/status/{status}` | Candidatures par statut | `List<Application>` |

## 🔄 Services Angular

### JobOfferService
```typescript
@Injectable({ providedIn: 'root' })
export class JobOfferService {
  private apiUrl = `${environment.jobOffersApiUrl}/job-offers`; // Port 9090
  
  // Méthodes principales :
  - createJobOffer(jobOffer: CreateJobOfferDto): Observable<JobOffer>
  - getAllJobOffers(filters?: JobOfferFilters): Observable<JobOffer[]>
  - getJobOfferById(id: string): Observable<JobOffer>
  - updateJobOffer(id: string, jobOffer: UpdateJobOfferDto): Observable<JobOffer>
  - changeStatus(id: string, status: string): Observable<JobOffer>
  - archiveJobOffer(id: string): Observable<JobOffer>
  - getActiveJobOffers(): Observable<JobOffer[]>
  - getJobOffersByCategory(category: string): Observable<JobOffer[]>
}
```

### ApplicationService
```typescript
@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private apiUrl = `${environment.jobOffersApiUrl}/applications`; // Port 9090
  
  // Méthodes principales :
  - createApplication(application: CreateApplicationDto): Observable<Application>
  - getAllApplications(filters?: ApplicationFilters): Observable<Application[]>
  - getApplicationsByJobOffer(jobOfferId: string): Observable<Application[]>
  - shortlistApplication(id: string): Observable<Application>
  - acceptApplication(id: string): Observable<Application>
  - rejectApplication(id: string): Observable<Application>
  - withdrawApplication(id: string): Observable<Application>
  - markAsRead(id: string): Observable<Application>
}
```

## 🚀 Démarrage des Services

### 1. Démarrer le microservice Job Offers (Backend)
```bash
cd NexLance_joboffer/NexLance
mvn spring-boot:run
```
Le service démarre sur `http://localhost:9090`

### 2. Démarrer le microservice User (Backend)
```bash
cd Back_user
mvn spring-boot:run
```
Le service démarre sur `http://localhost:8080`

### 3. Démarrer le frontend Angular
```bash
cd nexlance-unified
npm start
# ou
ng serve
```
Le frontend démarre sur `http://localhost:4200`

## 🗄️ Base de Données

### Configuration dans `application.properties`

```properties
# Port du microservice
server.port=9090

# Configuration de la base de données
spring.datasource.url=jdbc:mysql://localhost:3306/nexlance_job_offers
spring.datasource.username=root
spring.datasource.password=your_password

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

## 🔐 CORS Configuration

Le backend Spring Boot est configuré avec `@CrossOrigin(origins = "*")` pour permettre les requêtes depuis le frontend Angular.

Pour la production, limitez les origines autorisées :
```java
@CrossOrigin(origins = "https://your-production-domain.com")
```

## 📝 Entités Backend

### JobOffer
```java
@Entity
@Table(name = "job_offers")
public class JobOffer {
    private UUID id;
    private UUID clientId;
    private String title;
    private String description;
    private JobCategory category;
    private BigDecimal budget;
    private BudgetType budgetType;
    private JobOfferStatus status; // DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED, ARCHIVED
    private List<String> requiredSkills;
    private ExperienceLevel experienceLevel;
    private String location;
    private Boolean isRemote;
    private Integer viewCount;
    private Integer applicantCount;
    // ... timestamps
}
```

### Application
```java
@Entity
@Table(name = "applications")
public class Application {
    private UUID id;
    private UUID jobOfferId;
    private UUID freelanceId;
    private String coverLetter;
    private BigDecimal proposedRate;
    private ApplicationStatus status; // PENDING, SHORTLISTED, ACCEPTED, REJECTED, WITHDRAWN
    private List<String> portfolioItems;
    private LocalDateTime estimatedDelivery;
    private Boolean isRead;
    // ... timestamps
}
```

## 🎯 TODO - Endpoints à Implémenter

Ces endpoints sont utilisés par le frontend mais ne sont pas encore implémentés dans le backend :

1. **GET** `/api/job-offers/my-jobs` - Récupérer les offres du client authentifié
2. **GET** `/api/job-offers/search?q={query}` - Recherche textuelle d'offres
3. **GET** `/api/job-offers/stats` - Statistiques pour l'admin
4. **POST** `/api/job-offers/upload` - Upload de fichiers
5. **GET** `/api/applications/my-applications` - Candidatures du freelance authentifié
6. **GET** `/api/applications/job-offer/{jobOfferId}/counts` - Compteurs groupés par statut

## 🧪 Tests avec Postman

Une collection Postman est disponible : `NexLance_JobOffers.postman_collection.json`

Configuration des variables :
```
base_url: http://localhost:9090/api
```

## 📚 Références

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Angular HttpClient](https://angular.io/guide/http)
- [Architecture Microservices](https://microservices.io/)
