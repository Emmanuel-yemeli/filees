# Workflows de test — Module Réclamations (Interface Frontend)

> **URL de base :** `http://localhost:4200`
> **Prérequis :** Frontend (`ng serve`) + Backend démarré (Gateway 8765, complaint-service 8092, user-service, notification-service)
> **Navigateur :** Chrome ou Firefox (outils de développement ouverts recommandés — onglet Console + Network)

---

## Comptes à créer avant de commencer

> ### ⚠️ Emails valides obligatoires — les mails sont envoyés par le backend
>
> Tous les emails de notification (réclamation créée, message reçu, résolution, clôture…)
> sont envoyés **depuis** `support.nexlance@gmail.com` (adresse SMTP configurée dans user-service).
> Les destinataires doivent être des adresses **réelles** que tu contrôles.
>
> **Solution recommandée — Alias Gmail (une seule boîte Gmail, 5 comptes distincts) :**
> Gmail traite `tonprenom+tag@gmail.com` comme la même boîte que `tonprenom@gmail.com`.
> Remplace `tonprenom` par ton adresse Gmail réelle dans tous les JSON ci-dessous.
> Pour lire les emails de chaque compte : Gmail → barre de recherche → `to:tonprenom+client@gmail.com`

---

### Création des comptes via Postman

> **Tous les comptes se créent via le même endpoint :**
> `POST http://localhost:8765/api/auth/register`
> Header : `Content-Type: application/json`
> Le champ `type` accepte : `CLIENT`, `FREELANCE`, `ADMIN`, `SUPPORT_AGENT`

---

#### CLIENT_A

```json
POST http://localhost:8765/api/auth/register
Content-Type: application/json

{
  "firstName": "Alice",
  "lastName": "Martin",
  "email": "tonprenom+client@gmail.com",
  "password": "Test1234!",
  "confirmPassword": "Test1234!",
  "type": "CLIENT"
}
```
**Réponse attendue :** `201 Created` — `{ "token": "...", "user": { "id": "UUID", "type": "CLIENT", ... } }`
→ Sauvegarder `user.id` dans `ID_CLIENT_A`

---

#### FREELANCER_B

```json
POST http://localhost:8765/api/auth/register
Content-Type: application/json

{
  "firstName": "Bob",
  "lastName": "Dupont",
  "email": "tonprenom+freelancer@gmail.com",
  "password": "Test1234!",
  "confirmPassword": "Test1234!",
  "type": "FREELANCE"
}
```
**Réponse attendue :** `201 Created`
→ Sauvegarder `user.id` dans `ID_FREELANCER_B`

---

#### AGENT_C

```json
POST http://localhost:8765/api/auth/register
Content-Type: application/json

{
  "firstName": "Claire",
  "lastName": "Bernard",
  "email": "tonprenom+agent.c@gmail.com",
  "password": "Test1234!",
  "confirmPassword": "Test1234!",
  "type": "SUPPORT_AGENT"
}
```
**Réponse attendue :** `201 Created`
→ Sauvegarder `user.id` dans `ID_AGENT_C`

---

#### AGENT_D

```json
POST http://localhost:8765/api/auth/register
Content-Type: application/json

{
  "firstName": "David",
  "lastName": "Moreau",
  "email": "tonprenom+agent.d@gmail.com",
  "password": "Test1234!",
  "confirmPassword": "Test1234!",
  "type": "SUPPORT_AGENT"
}
```
**Réponse attendue :** `201 Created`
→ Sauvegarder `user.id` dans `ID_AGENT_D`

---

#### ADMIN_E

```json
POST http://localhost:8765/api/auth/register
Content-Type: application/json

{
  "firstName": "Emma",
  "lastName": "Leclerc",
  "email": "tonprenom+admin@gmail.com",
  "password": "Test1234!",
  "confirmPassword": "Test1234!",
  "type": "ADMIN"
}
```
**Réponse attendue :** `201 Created`
→ Sauvegarder `user.id` dans `ID_ADMIN_E`

---

### Connexion (pour obtenir les tokens)

`POST http://localhost:8765/api/auth/login`

```json
{ "email": "tonprenom+client@gmail.com", "password": "Test1234!" }
```
→ Sauvegarder le `token` retourné dans `TOKEN_CLIENT_A` (à utiliser en Bearer token dans Postman)

Répéter pour chaque compte.

---

### Récapitulatif des comptes

| Alias         | type (backend) | Email                              | Mot de passe |
|---------------|----------------|------------------------------------|--------------|
| CLIENT_A      | CLIENT         | `tonprenom+client@gmail.com`       | Test1234!    |
| FREELANCER_B  | FREELANCE      | `tonprenom+freelancer@gmail.com`   | Test1234!    |
| AGENT_C       | SUPPORT_AGENT  | `tonprenom+agent.c@gmail.com`      | Test1234!    |
| AGENT_D       | SUPPORT_AGENT  | `tonprenom+agent.d@gmail.com`      | Test1234!    |
| ADMIN_E       | ADMIN          | `tonprenom+admin@gmail.com`        | Test1234!    |

> **Expéditeur de tous les emails système :** `support.nexlance@gmail.com`
> Les clients et freelancers reçoivent les notifications depuis cette adresse.
> Pour répondre ou contacter le support, ils écrivent à cette même adresse.

---

## Infos à noter au fil des tests

```
EMAIL_CLIENT_A       = tonprenom+client@gmail.com      ← remplacer
EMAIL_FREELANCER_B   = tonprenom+freelancer@gmail.com  ← remplacer
EMAIL_AGENT_C        = tonprenom+agent.c@gmail.com     ← remplacer
EMAIL_AGENT_D        = tonprenom+agent.d@gmail.com     ← remplacer
EMAIL_ADMIN_E        = tonprenom+admin@gmail.com       ← remplacer

TOKEN_CLIENT_A       = (token JWT obtenu à la connexion)
TOKEN_FREELANCER_B   = ...
TOKEN_AGENT_C        = ...
TOKEN_AGENT_D        = ...
TOKEN_ADMIN_E        = ...

ID_CLIENT_A          = (UUID retourné dans user.id à la création du compte)
ID_FREELANCER_B      = ...
ID_AGENT_C           = ...
ID_AGENT_D           = ...
ID_ADMIN_E           = ...

COMPLAINT_ID_1       = (copier depuis l'URL de la page de détail)
COMPLAINT_ID_2       = ...
TICKET_NUMBER_1      = (visible dans la page de détail)
```

---

# SCÉNARIO 0 — Inscription et connexion initiale

## 0.1 — Inscription CLIENT_A

1. Aller sur `http://localhost:4200/register/client`
2. Remplir le formulaire :
   - Prénom : `Alice`
   - Nom : `Martin`
   - Email : `tonprenom+client@gmail.com` ← **remplacer par ton vrai alias**
   - Mot de passe : `Test1234!`
   - Confirmation : `Test1234!`
3. Cliquer **"S'inscrire"**

**Résultat attendu :** Redirection vers `/login` ou vers le dashboard client → toast de succès

> **Email de bienvenue :** Vérifier dans Gmail (chercher `to:tonprenom+client@gmail.com`) qu'un email de confirmation a bien été reçu.

---

## 0.2 — Inscription FREELANCER_B

1. Aller sur `http://localhost:4200/register/freelancer`
2. Remplir le formulaire :
   - Prénom : `Bob`
   - Nom : `Dupont`
   - Email : `tonprenom+freelancer@gmail.com` ← **remplacer par ton vrai alias**
   - Mot de passe : `Test1234!`
3. Cliquer **"S'inscrire"**

**Résultat attendu :** Redirection vers dashboard freelancer → toast de succès

---

## 0.3 — Connexion CLIENT_A

1. Aller sur `http://localhost:4200/login`
2. Saisir :
   - Email : `client.a@test.com`
   - Mot de passe : `Test1234!`
3. Cliquer **"Se connecter"**

**Résultat attendu :** Redirection vers `http://localhost:4200/frontoffice/client/dashboard`
Le header affiche le nom "Alice Martin" et une icône de notification.

---

## 0.4 — Connexion avec mauvais mot de passe

1. Aller sur `http://localhost:4200/login`
2. Saisir un email valide + mauvais mot de passe
3. Cliquer **"Se connecter"**

**Résultat attendu :** Message d'erreur visible sous le formulaire (ex. "Identifiants invalides")
Aucune redirection.

---

# SCÉNARIO 1 — Créer une réclamation simple (sans pièce jointe)

**Connecté en tant que :** CLIENT_A

## 1.1 — Naviguer vers la création

1. Depuis le dashboard, cliquer sur le lien **"Mes réclamations"** dans le header
   → URL : `http://localhost:4200/frontoffice/client/my-complaints`
2. Cliquer le bouton **"Nouvelle réclamation"** (ou "+" flottant)
   → URL : `http://localhost:4200/frontoffice/client/my-complaints/new`

**Résultat attendu :** Formulaire de création affiché

---

## 1.2 — Remplir et soumettre le formulaire

1. **Catégorie** : Sélectionner `Problème de paiement`
2. **Priorité** : Sélectionner `Haute`
3. **Sujet** : `Paiement non reçu pour le projet Alpha`
4. **Description** : `Le freelancer a livré le projet il y a 15 jours mais je n'ai pas reçu le remboursement convenu pour les heures supplémentaires facturées.`
5. **Utilisateur signalé** : Coller l'UUID de FREELANCER_B (ID_FREELANCER_B)
6. **Pièces jointes** : Laisser vide pour l'instant
7. Cliquer **"Soumettre"**

**Résultat attendu :**
- Spinner de chargement pendant la soumission
- Redirection vers la page de détail : `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_1}`
- Badge de statut **"Ouverte"** en vert/bleu
- Ticket number visible (format `NX-202604-XXXXX`)

→ **Sauvegarder** l'ID depuis l'URL et le numéro de ticket affiché.

> **Vérification email :** Ouvrir Gmail et chercher `to:tonprenom+client@gmail.com`
> → Un email "Réclamation créée" avec le numéro de ticket doit être arrivé.
> → FREELANCER_B (`tonprenom+freelancer@gmail.com`) reçoit également un email l'informant qu'une réclamation a été déposée contre lui.

---

## 1.3 — Vérifier l'affichage dans "Mes réclamations"

1. Cliquer **"Retour"** ou naviguer vers `http://localhost:4200/frontoffice/client/my-complaints`

**Résultat attendu :**
- La réclamation apparaît dans l'onglet **"Mes réclamations"**
- Affiche : sujet, catégorie, priorité, statut "Ouverte", date de création
- Badge rouge sur le compteur "Ouverte" dans les filtres

---

## 1.4 — Validation des champs obligatoires

1. Aller sur `http://localhost:4200/frontoffice/client/my-complaints/new`
2. Cliquer **"Soumettre"** sans remplir aucun champ

**Résultat attendu :**
- Les champs obligatoires (Catégorie, Sujet, Description) sont mis en évidence en rouge
- Message d'erreur sous chaque champ manquant
- Aucune soumission ne part au backend

---

# SCÉNARIO 2 — Créer une réclamation avec pièces jointes

**Connecté en tant que :** CLIENT_A

## 2.1 — Ouvrir le formulaire de création

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/new`

---

## 2.2 — Ajouter des fichiers

1. Dans la zone **"Pièces jointes"**, faire un **drag & drop** d'un fichier PDF
   OU cliquer sur la zone et sélectionner un fichier via l'explorateur
2. Vérifier l'aperçu du fichier dans la liste (miniature PDF ou image)
3. Ajouter un second fichier (PNG ou JPEG)

**Résultat attendu :**
- Les fichiers apparaissent dans la liste avec nom, taille, icône de type
- Barre de progression visible lors de l'upload
- Miniature de l'image ou icône PDF affichée

---

## 2.3 — Tenter d'ajouter un 6ème fichier (doit échouer)

1. Avec déjà 5 fichiers ajoutés, tenter d'en ajouter un 6ème

**Résultat attendu :**
- Message d'erreur rouge : "Maximum 5 fichiers autorisés"
- Le 6ème fichier n'est pas accepté

---

## 2.4 — Supprimer un fichier

1. Cliquer l'icône **"Supprimer"** (croix) sur l'un des fichiers ajoutés

**Résultat attendu :** Le fichier disparaît de la liste

---

## 2.5 — Prévisualiser un fichier

1. Cliquer l'icône **"Aperçu"** (zoom ou œil) sur un fichier image ou PDF

**Résultat attendu :**
- Modal d'aperçu s'ouvre
- Image affichée en plein format OU PDF dans un iframe
- Bouton de fermeture fonctionnel

---

## 2.6 — Soumettre avec pièces jointes

1. Remplir le reste du formulaire (Catégorie, Sujet, Description, Utilisateur signalé)
2. Cliquer **"Soumettre"**

**Résultat attendu :**
- Indicateur "Envoi des fichiers... (N/N)" visible pendant l'upload
- Redirection vers la page de détail
- Section pièces jointes visible avec les fichiers uploadés

→ Sauvegarder `COMPLAINT_ID_2`

---

# SCÉNARIO 3 — Tentative d'auto-signalement

**Connecté en tant que :** CLIENT_A

## 3.1 — Signaler sa propre adresse

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/new`
2. Dans **"Utilisateur signalé"**, saisir l'UUID de CLIENT_A (son propre ID)
3. Remplir les autres champs obligatoires
4. Cliquer **"Soumettre"**

**Résultat attendu :**
- Toast d'erreur rouge : "Vous ne pouvez pas vous signaler vous-même"
- Aucune redirection — on reste sur le formulaire

---

# SCÉNARIO 4 — Admin assigne la réclamation

**Se déconnecter de CLIENT_A — Se connecter en tant que ADMIN_E**

## 4.1 — Accéder à la liste des réclamations

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints`

**Résultat attendu :**
- Liste de toutes les réclamations de la plateforme
- Filtre de statut, priorité, catégorie disponibles
- `COMPLAINT_ID_1` apparaît avec statut **"Ouverte"** et non assignée

---

## 4.2 — Filtrer par statut

1. Dans le filtre **"Statut"**, sélectionner `Ouverte`

**Résultat attendu :** Seules les réclamations avec statut "Ouverte" sont affichées

---

## 4.3 — Ouvrir le détail de COMPLAINT_ID_1

1. Cliquer sur la ligne de `COMPLAINT_ID_1`
   → URL : `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_1}`

**Résultat attendu :** Page de détail complète avec informations du plaignant, sujet, statut, priorité

---

## 4.4 — Assigner à AGENT_C

1. Dans le panneau latéral ou section "Assignation", cliquer **"Assigner un agent"**
2. Dans le sélecteur, choisir `agent.c@test.com` (AGENT_C)
3. Confirmer l'action

**Résultat attendu :**
- Toast de succès "Réclamation assignée"
- Le champ "Agent assigné" affiche le nom de AGENT_C
- Badge de statut passe à **"En cours"**

> **Vérification email :** AGENT_C (`tonprenom+agent.c@gmail.com`) reçoit un email "Réclamation assignée"
> contenant le numéro de ticket et un lien direct vers la réclamation.

---

## 4.5 — Vérifier les statistiques

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/stats`

**Résultat attendu :**
- Graphiques/compteurs par statut : au moins 1 "En cours"
- Graphiques par priorité et catégorie visibles

---

# SCÉNARIO 5 — Agent voit la file d'attente

**Se déconnecter — Se connecter en tant que AGENT_D**

## 5.1 — Voir les réclamations disponibles

1. Naviguer vers `http://localhost:4200/backoffice/agent/queue`
2. Vérifier l'onglet **"Non assignées"**

**Résultat attendu :**
- `COMPLAINT_ID_2` apparaît dans la liste (non assignée, statut OPEN)
- Colonnes : Ticket, Sujet, Catégorie, Priorité, Date

---

## 5.2 — Prendre en charge COMPLAINT_ID_2

1. Sur la ligne de `COMPLAINT_ID_2`, cliquer **"Prendre en charge"**
2. Une dialog de confirmation apparaît → cliquer **"Confirmer"**

**Résultat attendu :**
- Toast de succès "Réclamation prise en charge"
- `COMPLAINT_ID_2` disparaît de l'onglet "Non assignées"
- `COMPLAINT_ID_2` apparaît dans l'onglet **"Mes assignées"**
- Statut passe à **"En cours"**

---

## 5.3 — Tenter de prendre une réclamation déjà assignée

**Se connecter en tant que AGENT_C**

1. Naviguer vers `http://localhost:4200/backoffice/agent/queue`
2. Vérifier que `COMPLAINT_ID_2` n'est plus dans "Non assignées" (déjà prise par AGENT_D)

**Résultat attendu :** `COMPLAINT_ID_2` absente de la liste "Non assignées"

---

## 5.4 — AGENT_C voit ses réclamations assignées

1. Vérifier l'onglet **"Mes assignées"** sur la page `/backoffice/agent/queue`

**Résultat attendu :**
- `COMPLAINT_ID_1` apparaît (assignée à AGENT_C par l'admin au scénario 4)

---

# SCÉNARIO 6 — Changement de statut par l'agent

**Connecté en tant que AGENT_C**

## 6.1 — Ouvrir le détail de COMPLAINT_ID_1

1. Depuis l'onglet "Mes assignées", cliquer sur `COMPLAINT_ID_1`
   → URL : `http://localhost:4200/backoffice/agent/complaints/{COMPLAINT_ID_1}`

---

## 6.2 — Changer le statut en "En attente"

1. Dans la section "Statut", cliquer le bouton **"Changer le statut"** (ou sélecteur de statut)
2. Sélectionner **"En attente"** (PENDING_USER)
3. Confirmer

**Résultat attendu :**
- Badge de statut change en **"En attente"**
- Toast de succès

---

## 6.3 — Tenter de clôturer directement (doit échouer)

1. Dans le sélecteur de statut, tenter de sélectionner **"Clôturée"**

**Résultat attendu :**
- L'option "Clôturée" est grisée ou absente du sélecteur
- OU toast d'erreur si on tente quand même : "Utilisez l'action dédiée"

---

## 6.4 — Repasser en "En cours"

1. Dans le sélecteur de statut, sélectionner **"En cours"** (IN_PROGRESS)
2. Confirmer

**Résultat attendu :** Badge revient à **"En cours"**

---

# SCÉNARIO 7 — Changement de priorité

## 7.1 — Agent monte la priorité

**Connecté en tant que AGENT_C, sur la page de détail de COMPLAINT_ID_1 :**

1. Cliquer le bouton **"Changer la priorité"**
2. Sélectionner **"Critique"** (CRITICAL)
3. Confirmer

**Résultat attendu :**
- Badge priorité change en **"Critique"** (couleur bordeaux foncé)
- Toast de succès

---

## 7.2 — Admin baisse la priorité

**Se déconnecter — Se connecter en tant que ADMIN_E**

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_1}`
2. Changer la priorité à **"Moyenne"** (MEDIUM)
3. Confirmer

**Résultat attendu :** Badge priorité change en **"Moyenne"** (orange)

---

# SCÉNARIO 8 — Conversation Fil Plaignant ↔ Support

## 8.1 — CLIENT_A envoie un message

**Se connecter en tant que CLIENT_A**

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_1}`
2. Faire défiler vers le bas jusqu'à la section **"Conversation"**
3. Dans la zone de saisie, taper :
   `Bonjour, j'ai ajouté des preuves supplémentaires. Pouvez-vous les examiner ?`
4. Cliquer **"Envoyer"** (ou appuyer Entrée)

**Résultat attendu :**
- Message apparaît immédiatement dans la conversation (bulle à droite)
- Timestamp affiché
- Champ de saisie vidé après envoi

---

## 8.2 — AGENT_C répond

**Se connecter en tant que AGENT_C**

1. Naviguer vers `http://localhost:4200/backoffice/agent/complaints/{COMPLAINT_ID_1}`
2. Onglet **"Fil Plaignant"** actif par défaut
3. Lire le message de CLIENT_A
4. Taper : `Bonjour, nous avons bien reçu vos preuves. Nous examinons le dossier sous 24h.`
5. Cliquer **"Envoyer"**

**Résultat attendu :**
- Message AGENT_C apparaît dans la conversation
- Badge de messages non lus mis à jour

---

## 8.3 — AGENT_C ajoute une note interne

1. Dans la zone de saisie, cliquer le sélecteur **"Type de message"**
2. Sélectionner **"Note interne"**
3. Taper : `Vérifier avec le service comptable. Référence VIR-20260401.`
4. Cliquer **"Envoyer"**

**Résultat attendu :**
- Message affiché avec fond différent (jaune ou gris) et label **"Note interne"**
- Visible uniquement pour AGENT_C et ADMIN

---

## 8.4 — CLIENT_A ne voit pas la note interne

**Se connecter en tant que CLIENT_A**

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_1}`
2. Faire défiler la conversation

**Résultat attendu :**
- La note interne n'est PAS visible pour CLIENT_A
- Seuls les 2 messages TEXT apparaissent

---

## 8.5 — CLIENT_A tente d'envoyer une note interne

1. Vérifier si le sélecteur "Type de message" est présent dans l'interface CLIENT_A

**Résultat attendu :**
- Le sélecteur "Note interne" n'existe pas dans l'UI du client
- Le client ne voit que le type "Message"

---

# SCÉNARIO 9 — Impliquer la partie signalée (FREELANCER_B)

**Connecté en tant que AGENT_C**

## 9.1 — FREELANCER_B n'a pas encore accès

**Se connecter en tant que FREELANCER_B**

1. Naviguer vers `http://localhost:4200/frontoffice/freelancer/my-complaints`
2. Vérifier l'onglet **"Impliqué dans"**

**Résultat attendu :** Liste vide — `COMPLAINT_ID_1` n'y apparaît pas encore

---

## 9.2 — AGENT_C implique FREELANCER_B

**Se connecter en tant que AGENT_C**

1. Naviguer vers `http://localhost:4200/backoffice/agent/complaints/{COMPLAINT_ID_1}`
2. Chercher le bouton **"Impliquer la partie signalée"** (dans la section messagerie, onglet "Fil Mis en cause")
3. Cliquer ce bouton
4. Dans la dialog, saisir le message d'invitation :
   `Bonjour, vous faites l'objet d'une réclamation. Nous vous invitons à présenter votre version des faits sous 48h.`
5. Confirmer

**Résultat attendu :**
- Toast de succès "Partie mise en cause impliquée"
- Le bouton "Impliquer" disparaît ou se grise
- L'onglet "Fil Mis en cause" est actif et affiche le message d'invitation

> **Vérification email :** FREELANCER_B (`tonprenom+freelancer@gmail.com`) reçoit un email
> l'invitant à répondre, avec un lien direct vers la réclamation.
> Cliquer ce lien → doit rediriger vers la bonne page de détail (scénario 21 — redirect par rôle).

---

## 9.3 — Tenter d'impliquer une deuxième fois

1. Tenter de cliquer à nouveau le bouton "Impliquer la partie signalée"

**Résultat attendu :**
- Le bouton est absent ou grisé (action déjà effectuée)
- OU toast d'erreur si on réessaie

---

## 9.4 — FREELANCER_B voit et répond

**Se connecter en tant que FREELANCER_B**

1. Naviguer vers `http://localhost:4200/frontoffice/freelancer/my-complaints`
2. Cliquer l'onglet **"Impliqué dans"**

**Résultat attendu :** `COMPLAINT_ID_1` apparaît dans la liste

3. Cliquer sur `COMPLAINT_ID_1` pour accéder au détail
4. Lire le message d'invitation dans la conversation
5. Taper une réponse : `Bonjour, il y a eu un malentendu. Je peux fournir le contrat original.`
6. Envoyer

**Résultat attendu :**
- FREELANCER_B peut envoyer des messages
- Le message apparaît dans la conversation

---

## 9.5 — FREELANCER_B ne voit PAS le fil Plaignant

1. Sur la page de détail de `COMPLAINT_ID_1` (connecté en tant que FREELANCER_B)
2. Vérifier s'il y a des onglets de conversation

**Résultat attendu :**
- Un seul fil visible (le fil REPORTED)
- Les messages échangés entre CLIENT_A et AGENT_C ne sont pas visibles

---

## 9.6 — ADMIN voit les deux fils

**Se connecter en tant que ADMIN_E**

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_1}`
2. Observer la section messagerie

**Résultat attendu :**
- Deux onglets : **"Fil Plaignant"** et **"Fil Mis en cause"**
- Les deux contiennent leurs messages respectifs

---

# SCÉNARIO 10 — Réassignation par l'agent (CRITICAL uniquement)

## 10.1 — ADMIN passe COMPLAINT_ID_1 en priorité CRITIQUE

**Connecté en tant que ADMIN_E sur la page de détail de COMPLAINT_ID_1 :**

1. Changer la priorité à **"Critique"**

---

## 10.2 — AGENT_C réassigne à AGENT_D

**Connecté en tant que AGENT_C sur la page de détail de COMPLAINT_ID_1 :**

1. Chercher le bouton **"Réassigner"** (visible uniquement si priorité CRITIQUE)
2. Sélectionner `AGENT_D` dans le sélecteur
3. Confirmer

**Résultat attendu :**
- Toast de succès "Réclamation réassignée"
- Champ "Agent assigné" affiche AGENT_D

---

## 10.3 — Remettre à AGENT_C et baisser la priorité

**Connecté en tant que ADMIN_E :**

1. Réassigner à AGENT_C via le sélecteur d'agent
2. Changer la priorité à **"Haute"**

---

## 10.4 — AGENT_C tente de réassigner (priorité non CRITIQUE)

**Connecté en tant que AGENT_C sur la page de détail de COMPLAINT_ID_1 :**

1. Chercher le bouton "Réassigner"

**Résultat attendu :**
- Le bouton "Réassigner" est absent ou grisé (priorité non CRITICAL)
- OU toast d'erreur si on tente quand même

---

# SCÉNARIO 11 — Escalade (Admin)

**Connecté en tant que ADMIN_E**

## 11.1 — Escalader COMPLAINT_ID_2

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_2}`
2. Changer le statut à **"Escaladée"** (ESCALATED)
   OU utiliser la fonction "Réassigner à l'admin" qui déclenche automatiquement ESCALATED
3. Confirmer

**Résultat attendu :**
- Badge statut affiche **"Escaladée"** (couleur distincte)
- Toast de succès

---

# SCÉNARIO 12 — Résolution d'une réclamation

**Connecté en tant que AGENT_C**

## 12.1 — Résoudre COMPLAINT_ID_1

1. Naviguer vers `http://localhost:4200/backoffice/agent/complaints/{COMPLAINT_ID_1}`
2. Cliquer le bouton **"Résoudre"**
3. Dans la dialog :
   - **Résumé de résolution** : `Après vérification, le virement de 250€ a bien été effectué le 05/04/2026. Référence VIR-20260405.`
   - **Type de résolution** : `Remboursement` (REFUND)
4. Confirmer

**Résultat attendu :**
- Toast de succès "Réclamation résolue"
- Badge statut change en **"Résolue"**
- Section "Résolution" visible dans la page de détail avec le texte saisi
- Date de résolution affichée

> **Vérification email :** CLIENT_A (`tonprenom+client@gmail.com`) reçoit un email "Réclamation résolue"
> avec le résumé de la résolution et un lien pour accéder à la page de détail (et noter le service).

---

## 12.2 — CLIENT_A ne peut plus envoyer de message

**Se connecter en tant que CLIENT_A**

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_1}`
2. Observer la section conversation

**Résultat attendu :**
- Zone de saisie **désactivée ou absente**
- Message indiquant "Cette réclamation est résolue. La conversation est verrouillée."
- Les messages existants sont toujours lisibles

---

# SCÉNARIO 13 — Clôture d'une réclamation

**Connecté en tant que ADMIN_E**

## 13.1 — Tenter de clôturer COMPLAINT_ID_2 (non résolue)

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_2}`
2. Chercher le bouton **"Clôturer"**

**Résultat attendu :**
- Le bouton "Clôturer" est absent ou grisé (réclamation non résolue)
- OU toast d'erreur si on tente : "La réclamation doit être résolue avant d'être clôturée"

---

## 13.2 — Clôturer COMPLAINT_ID_1 (résolue)

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_1}`
2. Cliquer le bouton **"Clôturer"**
3. Confirmer dans la dialog

**Résultat attendu :**
- Toast de succès "Réclamation clôturée"
- Badge statut change en **"Clôturée"**
- Date de clôture affichée

> **Vérification email :** CLIENT_A (`tonprenom+client@gmail.com`) reçoit un email "Réclamation clôturée"
> avec une invitation à noter le service support (lien direct vers la page de notation).

---

## 13.3 — Vérifier que l'AGENT_C ne peut pas clôturer

**Se connecter en tant que AGENT_C**

1. Naviguer vers `http://localhost:4200/backoffice/agent/complaints/{COMPLAINT_ID_1}`

**Résultat attendu :** Le bouton "Clôturer" n'est pas présent dans l'interface agent

---

# SCÉNARIO 14 — Notation de satisfaction

**Connecté en tant que CLIENT_A**

## 14.1 — Tenter de noter avant clôture

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_2}` (statut IN_PROGRESS)

**Résultat attendu :** Pas de widget de notation affiché (ou widget grisé)

---

## 14.2 — Noter COMPLAINT_ID_1 (clôturée)

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_1}`
2. Observer le widget de notation étoiles (1 à 5)
3. Cliquer sur **4 étoiles**
4. Cliquer **"Valider"** (si bouton de confirmation)

**Résultat attendu :**
- Toast de succès "Évaluation enregistrée"
- Les 4 étoiles restent colorées (remplies)
- Widget passe en lecture seule (ne peut plus voter)

---

## 14.3 — Tenter de noter hors limites

1. Vérifier que le widget n'autorise que 1 à 5 étoiles (pas de 0 ou 6)

**Résultat attendu :** Le widget ne permet de cliquer que sur 1-5 étoiles

---

## 14.4 — FREELANCER_B tente de noter

**Se connecter en tant que FREELANCER_B**

1. Naviguer vers `http://localhost:4200/frontoffice/freelancer/my-complaints/{COMPLAINT_ID_1}` (via onglet "Impliqué dans")

**Résultat attendu :** Pas de widget de notation visible pour FREELANCER_B (uniquement pour le plaignant)

---

# SCÉNARIO 15 — Vue "Impliqué dans" du Freelancer

**Connecté en tant que FREELANCER_B**

## 15.1 — Vérifier l'onglet "Impliqué dans"

1. Naviguer vers `http://localhost:4200/frontoffice/freelancer/my-complaints`
2. Cliquer l'onglet **"Impliqué dans"**

**Résultat attendu :**
- `COMPLAINT_ID_1` apparaît dans la liste avec badge "Clôturée"
- `COMPLAINT_ID_2` n'apparaît pas (FREELANCER_B pas impliqué dans sa conv REPORTED)

---

# SCÉNARIO 16 — Suppression d'une réclamation

## 16.1 — CLIENT_A tente de supprimer

**Se connecter en tant que CLIENT_A**

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_2}`

**Résultat attendu :** Pas de bouton "Supprimer" visible dans l'interface client

---

## 16.2 — ADMIN_E supprime COMPLAINT_ID_2

**Se connecter en tant que ADMIN_E**

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_2}`
2. Cliquer le bouton **"Supprimer"** (rouge, avec icône corbeille)
3. Confirmer dans la dialog "Êtes-vous sûr ?"

**Résultat attendu :**
- Toast de succès "Réclamation supprimée"
- Redirection vers la liste `/backoffice/admin/complaints`
- `COMPLAINT_ID_2` n'apparaît plus dans la liste

---

## 16.3 — Vérifier la suppression

1. Tenter d'accéder à `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_2}`

**Résultat attendu :**
- Page "Not Found" ou redirection vers la liste
- Toast d'erreur "Réclamation introuvable"

---

# SCÉNARIO 17 — Recherche et filtres (Admin)

**Connecté en tant que ADMIN_E**

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints`

## 17.1 — Filtrer par statut "Clôturée"

1. Dans le filtre **"Statut"**, sélectionner `Clôturée`

**Résultat attendu :** Seules les réclamations clôturées sont affichées (dont COMPLAINT_ID_1)

---

## 17.2 — Filtrer par priorité "Haute"

1. Dans le filtre **"Priorité"**, sélectionner `Haute`

**Résultat attendu :** Seules les réclamations avec priorité Haute sont affichées

---

## 17.3 — Rechercher par numéro de ticket

1. Dans la barre de recherche, saisir `TICKET_NUMBER_1` (ex. `NX-202604-00001`)

**Résultat attendu :**
- Résultats filtrés en temps réel (debounce ~300ms)
- `COMPLAINT_ID_1` apparaît avec le numéro surligné

---

## 17.4 — Réinitialiser les filtres

1. Cliquer **"Réinitialiser"** ou effacer les filtres

**Résultat attendu :** Toutes les réclamations sont à nouveau affichées

---

# SCÉNARIO 18 — Export PDF

**Connecté en tant que AGENT_C**

## 18.1 — Exporter une réclamation en PDF

1. Naviguer vers `http://localhost:4200/backoffice/agent/complaints/{COMPLAINT_ID_1}`
2. Cliquer le bouton **"Exporter PDF"** (icône téléchargement ou imprimante)

**Résultat attendu :**
- Spinner / indicateur de génération visible
- Fichier PDF téléchargé automatiquement (ou onglet de prévisualisation s'ouvre)
- Le PDF contient : numéro de ticket, sujet, description, statut, priorité, résolution, messages de la conversation

---

## 18.2 — Export PDF Admin

**Se connecter en tant que ADMIN_E**

1. Naviguer vers `http://localhost:4200/backoffice/admin/complaints/{COMPLAINT_ID_1}`
2. Cliquer **"Exporter PDF"**

**Résultat attendu :**
- PDF généré avec les deux fils de conversation (Plaignant + Mis en cause)
- Informations des deux parties (reporter et reported) affichées

---

# SCÉNARIO 19 — Contrôles d'accès dans l'UI

## 19.1 — CLIENT tente d'accéder au backoffice

**Connecté en tant que CLIENT_A**

1. Naviguer directement vers `http://localhost:4200/backoffice/admin/complaints`

**Résultat attendu :**
- Redirection vers `/login` ou vers `/frontoffice/client/dashboard`
- OU page "Accès refusé"

---

## 19.2 — FREELANCER tente d'accéder au backoffice agent

**Connecté en tant que FREELANCER_B**

1. Naviguer directement vers `http://localhost:4200/backoffice/agent/queue`

**Résultat attendu :** Redirection vers le dashboard freelancer ou page d'erreur

---

## 19.3 — AGENT tente d'accéder à la page admin

**Connecté en tant que AGENT_C**

1. Naviguer directement vers `http://localhost:4200/backoffice/admin/complaints`

**Résultat attendu :** Redirection ou page "Accès refusé" (route protégée par `adminGuard`)

---

## 19.4 — Utilisateur non connecté accède à une page protégée

1. Se déconnecter complètement (ou ouvrir une fenêtre privée)
2. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints`

**Résultat attendu :** Redirection vers `http://localhost:4200/login`

---

# SCÉNARIO 20 — Réclamation sans "reported user"

**Connecté en tant que CLIENT_A**

## 20.1 — Créer une réclamation sans désigner de coupable

1. Naviguer vers `http://localhost:4200/frontoffice/client/my-complaints/new`
2. Remplir :
   - Catégorie : `Problème technique`
   - Priorité : `Faible`
   - Sujet : `Bug mineur sur l'interface mobile`
   - Description : `L'interface de soumission des livrables bug parfois sur mobile.`
   - **Laisser vide** le champ "Utilisateur signalé"
3. Soumettre

**Résultat attendu :**
- Création réussie → redirection vers la page de détail
- Champ "Partie signalée" affiché comme vide ou "Non spécifié"
- Le bouton "Impliquer la partie signalée" est absent ou grisé côté agent

---

# SCÉNARIO 21 — Lien email de notification (redirect)

## 21.1 — Tester le lien neutre (pour emails)

**Connecté en tant que CLIENT_A**

1. Naviguer vers `http://localhost:4200/frontoffice/my-complaints/{COMPLAINT_ID_1}`
   (URL utilisée dans les emails de notification — route neutre `ComplaintRedirectComponent`)

**Résultat attendu :**
- Redirection automatique vers `http://localhost:4200/frontoffice/client/my-complaints/{COMPLAINT_ID_1}`
  (selon le rôle détecté : CLIENT → route client)

**Tester avec AGENT_C connecté :**

1. Naviguer vers `http://localhost:4200/frontoffice/my-complaints/{COMPLAINT_ID_1}`

**Résultat attendu :**
- Redirection vers `http://localhost:4200/backoffice/agent/complaints/{COMPLAINT_ID_1}`

---

# SCÉNARIO 22 — Ping d'activité (vérification indirecte)

> Ce test est passif — le ping se déclenche automatiquement en arrière-plan.

## 22.1 — Vérifier l'absence de boucle d'erreur

**Connecté en tant que AGENT_C, sur n'importe quelle page :**

1. Ouvrir **F12 → onglet Network** dans le navigateur
2. Filtrer par `ping`
3. Attendre 2 minutes

**Résultat attendu :**
- Une requête `PUT /complaints/activity/ping` part toutes les ~2 minutes
- Réponse : `200 OK`
- Aucune requête répétée en boucle rapide (pas de spam)

---

## 22.2 — Vérifier l'arrêt du ping après déconnexion

1. Se déconnecter (bouton Logout)
2. Observer l'onglet Network

**Résultat attendu :** Plus aucune requête `/activity/ping` n'est envoyée après la déconnexion

---

# Récapitulatif des scénarios frontend

| # | Scénario | Acteur principal | Résultat clé attendu |
|---|----------|------------------|----------------------|
| 0 | Inscription + Connexion | CLIENT_A, FREELANCER_B | Dashboard accessible |
| 1 | Créer réclamation simple | CLIENT_A | Statut "Ouverte", visible dans liste |
| 2 | Créer avec pièces jointes | CLIENT_A | Fichiers uploadés, aperçu fonctionnel |
| 3 | Auto-signalement bloqué | CLIENT_A | Toast d'erreur, formulaire intact |
| 4 | Admin assigne la réclamation | ADMIN_E | Statut "En cours", agent affiché |
| 5 | Agent prend en charge | AGENT_D | Réclamation dans "Mes assignées" |
| 6 | Changement de statut | AGENT_C | Badge statut mis à jour |
| 7 | Changement de priorité | AGENT_C + ADMIN_E | Badge priorité mis à jour |
| 8 | Conversation Plaignant ↔ Support | CLIENT_A + AGENT_C | Notes internes invisibles côté client |
| 9 | Impliquer partie signalée | AGENT_C + FREELANCER_B | FREELANCER voit l'onglet "Impliqué dans" |
| 10 | Réassignation (CRITICAL) | AGENT_C | Bouton visible si CRITIQUE, bloqué sinon |
| 11 | Escalade | ADMIN_E | Statut "Escaladée" |
| 12 | Résolution | AGENT_C | Statut "Résolue", conversation verrouillée |
| 13 | Clôture | ADMIN_E | Statut "Clôturée", client ne peut plus écrire |
| 14 | Notation satisfaction | CLIENT_A | Étoiles enregistrées, lecture seule ensuite |
| 15 | Vue "Impliqué dans" | FREELANCER_B | Réclamation visible côté Freelancer |
| 16 | Suppression | ADMIN_E | 404 après suppression |
| 17 | Filtres et recherche | ADMIN_E | Résultats filtrés en temps réel |
| 18 | Export PDF | AGENT_C + ADMIN_E | PDF téléchargé avec messages + infos |
| 19 | Contrôles d'accès UI | Tous | Guards actifs, redirections correctes |
| 20 | Réclamation sans partie signalée | CLIENT_A | Champ "Partie signalée" vide accepté |
| 21 | Lien email (redirect) | CLIENT_A + AGENT_C | Redirigé selon le rôle |
| 22 | Ping activité | AGENT_C | 1 ping/2 min, arrêt au logout |

---

# Transitions de statut dans l'interface

```
[Ouverte]
    │
    └─(Assigner / Prendre en charge)──→ [En cours]
                                              │
                          ┌───────────────────┼──────────────────┐
                          ▼                   ▼                  ▼
                    [En attente]          [Escaladée]         (Résoudre)
                          │                   │                  │
                          └───────────────────┘                  │
                                    │                            ▼
                              [En cours]◄───────────────── [Résolue]
                                                                 │
                                                            (Clôturer)
                                                                 │
                                                                 ▼
                                                           [Clôturée]
```

**Règles UI clés :**
- Le bouton **"Résoudre"** n'est visible que pour l'agent assigné (statut IN_PROGRESS ou PENDING_USER)
- Le bouton **"Clôturer"** n'est visible que pour l'admin (statut RESOLVED uniquement)
- Le bouton **"Réassigner"** n'est visible pour l'agent que si la priorité est CRITIQUE
- Le widget **"Notation"** n'apparaît que pour le plaignant sur une réclamation CLÔTURÉE
- La zone de saisie de message est **désactivée** si statut = CLOSED (pour tous) ou RESOLVED (pour client/freelancer)

---

*Fichier généré le 2026-04-06 — NexLance Unified / Module Réclamations — Tests Frontend*
