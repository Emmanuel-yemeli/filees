# 🚀 Guide de Démarrage Rapide - Job Offers Module

## Configuration Microservices Actuelle

```
🔵 User Service      → http://localhost:8080/api
🟢 Job Offers Service → http://localhost:9090/api
🔴 Angular Frontend  → http://localhost:4200
```

## ⚡ Démarrage en 3 Étapes

### 1️⃣ Démarrer le Backend Job Offers (Port 9090)

```bash
cd "c:\Users\Cyrine\Downloads\PI DEV 4 EME\module_job_offers\NexLance_joboffer\NexLance"
mvn clean install
mvn spring-boot:run
```

**Vérification** : Accéder à `http://localhost:9090/api/job-offers` - Doit retourner `[]` (liste vide)

### 2️⃣ Démarrer le Backend User (Port 8080)

```bash
cd "c:\Users\Cyrine\Downloads\PI DEV 4 EME\module_job_offers\Back_user"
mvn spring-boot:run
```

**Vérification** : Le service User doit être accessible sur le port 8080

### 3️⃣ Démarrer le Frontend Angular

```bash
cd "c:\Users\Cyrine\Downloads\PI DEV 4 EME\module_job_offers\nexlance-unified"
npm start
# ou
ng serve
```

**Accès** : Ouvrir `http://localhost:4200` dans le navigateur

## 🗄️ Configuration Base de Données

### Créer la base de données MySQL

```sql
CREATE DATABASE nexlance_job_offers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Configuration dans `application.properties`

```properties
# Port du microservice
server.port=9090

# Configuration MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/nexlance_job_offers?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=votre_mot_de_passe

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# CORS
spring.web.cors.allowed-origins=http://localhost:4200
```

## 🔗 Ports Utilisés

| Service | Port | Status |
|---------|------|--------|
| User Service | 8080 | ✅ Configuré |
| Job Offers Service | 9090 | ✅ Configuré |
| Angular Frontend | 4200 | ✅ Configuré |
| MySQL Database | 3306 | ⚠️ À configurer |

## 📋 Navigation dans le Frontend

### 👨‍💼 Pour les Clients (CLIENT)
- **Créer une offre** : `/frontoffice/client/create-job`
- **Mes offres** : `/frontoffice/client/my-jobs`
- **Voir les candidatures** : `/frontoffice/client/my-jobs/:id`

### 👨‍💻 Pour les Freelancers (FREELANCER)
- **Parcourir les offres** : `/frontoffice/freelancer/browse-jobs`
- **Détail d'une offre** : `/frontoffice/freelancer/jobs/:id`
- **Mes candidatures** : `/frontoffice/freelancer/my-applications`

### 👮‍♂️ Pour les Admins (ADMIN)
- **Gestion des offres** : `/backoffice/admin/jobs`
- **Analytiques** : `/backoffice/admin/analytics/jobs`

## 🧪 Tester l'API avec Postman

### 1. Importer la collection
Fichier : `NexLance_JobOffers.postman_collection.json`

### 2. Configurer les variables
```json
{
  "base_url": "http://localhost:9090/api"
}
```

### 3. Exemples de requêtes

#### Créer une offre d'emploi
```http
POST http://localhost:9090/api/job-offers
Content-Type: application/json

{
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Développeur Full Stack",
  "description": "Nous recherchons un développeur Full Stack expérimenté",
  "category": "DEVELOPMENT",
  "budget": 5000,
  "budgetType": "FIXED",
  "status": "DRAFT",
  "requiredSkills": ["Angular", "Spring Boot", "MySQL"],
  "experienceLevel": "INTERMEDIATE",
  "location": "Tunis",
  "isRemote": true
}
```

#### Récupérer toutes les offres
```http
GET http://localhost:9090/api/job-offers
```

#### Récupérer les offres actives
```http
GET http://localhost:9090/api/job-offers/active
```

## ❌ Dépannage

### Problème : Port déjà utilisé

```bash
# Windows - Libérer le port 9090
netstat -ano | findstr :9090
taskkill /PID <PID> /F

# Windows - Libérer le port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Problème : CORS Errors

Vérifier que `@CrossOrigin(origins = "*")` est présent sur les contrôleurs :
```java
@RestController
@RequestMapping("/api/job-offers")
@CrossOrigin(origins = "*")
public class JobOfferController { ... }
```

### Problème : Connexion à la base de données

1. Vérifier que MySQL est démarré
2. Vérifier les credentials dans `application.properties`
3. Créer la base de données si elle n'existe pas :
   ```sql
   CREATE DATABASE nexlance_job_offers;
   ```

### Problème : Frontend ne peut pas contacter le backend

1. Vérifier que les deux backends sont démarrés
2. Vérifier les URLs dans `environment.ts` :
   ```typescript
   userApiUrl: 'http://localhost:8080/api'
   jobOffersApiUrl: 'http://localhost:9090/api'
   ```

## 📊 Vérification du Bon Fonctionnement

### ✅ Checklist de démarrage

- [ ] MySQL est démarré (port 3306)
- [ ] Backend User démarre sans erreur (port 8080)
- [ ] Backend Job Offers démarre sans erreur (port 9090)
- [ ] `http://localhost:9090/api/job-offers` retourne une réponse JSON
- [ ] `http://localhost:8080/api/users` retourne une réponse JSON (si endpoint existe)
- [ ] Frontend Angular compile sans erreur
- [ ] `http://localhost:4200` affiche l'application
- [ ] Console navigateur ne montre pas d'erreurs CORS

## 📞 Support

Pour plus de détails, consulter [MICROSERVICES_CONFIG.md](./MICROSERVICES_CONFIG.md)

---
**Date de configuration** : 23 février 2026
**Architecture** : Microservices (User 8080 + Job Offers 9090)
