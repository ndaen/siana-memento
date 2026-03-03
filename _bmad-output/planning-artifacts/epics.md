---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflowCompleted: true
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Siana Memento (poster-generator) - Epic Breakdown

## Overview

Ce document fournit la décomposition complète en Epics et Stories pour **Siana Memento** (poster-generator), décomposant les requirements du PRD, du Document d'Architecture et des Spécifications UX Design en stories implémentables avec critères d'acceptation complets.

---

## Requirements Inventory

### Functional Requirements

#### User Management (FR1-FR8)

- FR1: Utilisateurs anonymes peuvent créer un compte avec email et mot de passe
- FR2: Utilisateurs enregistrés peuvent se connecter avec leurs identifiants email/password
- FR3: Utilisateurs anonymes peuvent créer un compte en se connectant avec Google OAuth
- FR4: Utilisateurs peuvent se connecter avec leur compte Google OAuth
- FR5: Utilisateurs connectés peuvent se déconnecter
- FR6: Utilisateurs connectés peuvent consulter leur historique de commandes
- FR7: Utilisateurs connectés peuvent re-télécharger leurs designs achetés dans les 7 jours
- FR8: Système maintient des sessions sécurisées pour utilisateurs connectés (expiration 7 jours d'inactivité)

#### Design Generation (FR9-FR18)

- FR9: Utilisateurs peuvent uploader jusqu'à 2 photos au format JPG ou PNG
- FR10: Utilisateurs peuvent voir une galerie de 5 templates pré-définis (Bohème, Moderne, Classique, Vintage, Minimaliste)
- FR11: Utilisateurs peuvent sélectionner un template depuis la galerie
- FR12: Utilisateurs peuvent déclencher la génération d'un design personnalisé avec leurs photos et le template choisi
- FR13: Système génère un design haute résolution (minimum 3000x3000px) en utilisant un service de génération d'images par IA
- FR14: Utilisateurs peuvent prévisualiser le design généré avant achat
- FR15: Utilisateurs peuvent zoomer et voir les détails du design généré
- FR16: Utilisateurs peuvent voir le nombre d'itérations utilisées et restantes (max 3 incluses)
- FR17: Utilisateurs peuvent déclencher une nouvelle génération (itération) si le design ne satisfait pas
- FR18: Utilisateurs peuvent remplacer leurs photos entre les itérations

#### Iteration & Feedback (FR19-FR23) — GROWTH PHASE sauf FR23 MVP simplifié

- FR19: [GROWTH] Utilisateurs peuvent donner un feedback structuré après chaque génération via checkboxes guidées
- FR20: [GROWTH] Utilisateurs peuvent spécifier des problèmes précis (texte trop grand/petit, photos pas assez visibles, couleurs inadaptées, style insuffisant)
- FR21: [GROWTH] Utilisateurs peuvent ajouter un feedback libre en texte pour des ajustements spécifiques
- FR22: [GROWTH] Système enrichit automatiquement le prompt de génération avec le feedback utilisateur pour l'itération suivante
- FR23: [MVP simplifié] Utilisateurs peuvent voir des conseils contextuels via la mascotte pour améliorer la qualité (photos bien éclairées, composition centrée)

#### Payment & Commerce (FR24-FR27)

- FR24: Utilisateurs peuvent acheter un design généré pour 19.90€
- FR25: Utilisateurs peuvent effectuer le paiement via un processeur de paiement sécurisé (Stripe PCI-DSS Level 1)
- FR26: Système confirme la transaction après paiement réussi
- FR27: Système affiche le pricing de manière transparente (19.90€, itérations incluses)

#### Content Delivery (FR28-FR32)

- FR28: Système envoie automatiquement le design haute résolution par email après paiement
- FR29: Utilisateurs reçoivent un email de confirmation avec le fichier attaché
- FR30: Utilisateurs peuvent télécharger leur design haute résolution depuis l'email
- FR31: Système supprime automatiquement les photos utilisateur après 7 jours (conformité RGPD)
- FR32: Système affiche la politique de confidentialité et RGPD clairement

#### Admin & Monitoring (FR33-FR39)

- FR33: Admin peut consulter un dashboard avec métriques essentielles (revenus, commandes, coûts API, marges, taux conversion)
- FR34: Admin peut voir les logs de toutes les générations (succès, échec, durée, coût)
- FR35: Admin peut voir l'historique des erreurs du service de génération d'images par IA
- FR36: Système envoie des alertes email automatiques si le taux d'erreur dépasse 5%
- FR37: Système envoie des alertes email si les coûts API dépassent le seuil défini (0.70€/commande)
- FR38: Système envoie des alertes email si les rate limits du service IA sont proches
- FR39: Admin peut exporter les métriques vers un format standard (CSV, Excel)

#### System Reliability (FR40-FR47)

- FR40: Système valide le format et la taille des photos uploadées (max 10MB, JPG/PNG — autres formats rejetés avec message d'erreur explicite)
- FR41: Système affiche des messages d'erreur clairs avec solutions si upload échoue
- FR42: Système valide le format des emails (trim espaces, format correct)
- FR43: Système gère les erreurs du service IA avec retry logic (3 tentatives, backoff exponentiel 2s→4s→8s)
- FR44: Système affiche des indicateurs de progression pendant la génération (progress bar 0-100%, messages rotatifs toutes les 5s, temps estimé restant)
- FR45: Système fournit un healthcheck endpoint (/api/health) pour monitoring uptime
- FR46: Système effectue des backups automatiques de la base de données
- FR47: Système permet à l'admin de renvoyer manuellement un design par email si delivery échoue

#### User Feedback & Support (FR48-FR50)

- FR48: Système envoie automatiquement un survey de satisfaction par email 24h après achat (3 questions: satisfaction globale, qualité design, recommandation)
- FR49: Landing page affiche l'adresse email de support (support@[domain]) visible dans le footer et sur la page de contact
- FR50: Admin peut gérer les testimonials affichés sur la landing page (ajouter, modifier, supprimer, activer/désactiver)

#### Analytics & Business Intelligence (FR51)

- FR51: Admin peut consulter le coût d'acquisition client (CAC) par canal marketing dans le dashboard

---

### NonFunctional Requirements

#### Performance (NFR-P1 à P7)

- NFR-P1: Génération design complète en moins de 30 secondes dans 95% des cas
- NFR-P2: Pages web LCP moins de 2.5s (Core Web Vitals)
- NFR-P3: Actions utilisateur feedback visuel en moins de 100ms (FID moins de 100ms)
- NFR-P4: Support 5-10 générations simultanées sans dégradation (architecture sync MVP)
- NFR-P5: Progrès de génération communiqués via polling 3s (MVP) — SSE reporté en Growth
- NFR-P6: Images uploadées (max 10MB) traitées et validées en moins de 5 secondes
- NFR-P7: Score Lighthouse Performance ≥90 (mobile), ≥95 (desktop)

#### Security (NFR-S1 à S10)

- NFR-S1: Toutes communications via HTTPS/TLS 1.3 minimum
- NFR-S2: Mots de passe hashés avec algorithme adaptatif sécurisé (cost factor ≥12)
- NFR-S3: Sessions utilisateur expirent après 7 jours d'inactivité
- NFR-S4: Paiements via Stripe PCI-DSS Level 1 compliant (aucune donnée bancaire stockée)
- NFR-S5: Photos utilisateur supprimées automatiquement après 7 jours (RGPD)
- NFR-S6: Données personnelles (email, nom) chiffrées au repos dans la base de données
- NFR-S7: Tokens OAuth Google stockés de manière sécurisée, jamais exposés côté client
- NFR-S8: Politique de confidentialité RGPD-compliant affichée avant toute collecte de données
- NFR-S9: Uploads validés (format, taille, type MIME) pour prévenir injection de malware
- NFR-S10: Endpoints API admin protégés par authentification forte (pas d'accès public)

#### Scalability (NFR-SC1 à SC6)

- NFR-SC1: Architecture MVP sync supporte 10 utilisateurs simultanés sans dégradation
- NFR-SC2: Architecture migreable vers async (BullMQ+Redis) pour 50-100 générations simultanées
- NFR-SC3: Base de données relationnelle supporte croissance jusqu'à 10K commandes sans refactoring schema
- NFR-SC4: Gestion des pics de trafic saisonniers (+300% juillet-septembre) via auto-scaling Vercel/Railway
- NFR-SC5: Service de stockage cloud supporte 100GB de photos (avec rotation suppression 7 jours)
- NFR-SC6: Service IA configuré avec retry logic exponentiel (3 tentatives, backoff 2s→4s→8s)

#### Accessibility (NFR-A1 à A7)

- NFR-A1: Conformité WCAG 2.1 Level AA stricte
- NFR-A2: Tous éléments interactifs accessibles via navigation clavier (Tab, Enter, Esc)
- NFR-A3: Contrastes couleurs ratio ≥4.5:1 (texte normal), ≥3:1 (texte large)
- NFR-A4: Toutes images ont attributs alt descriptifs (vides pour décoratives)
- NFR-A5: Formulaires ont labels explicites associés à chaque input
- NFR-A6: Messages d'erreur annoncés via aria-live pour lecteurs d'écran
- NFR-A7: Score Lighthouse Accessibility ≥90

#### Integration (NFR-I1 à I7)

- NFR-I1: Service IA taux de succès ≥95% (moins de 5% d'échecs techniques)
- NFR-I2: Processeur paiement supporte webhooks pour confirmation paiement asynchrone
- NFR-I3: Service email transactionnel délivrabilité ≥98%
- NFR-I4: Erreurs API externes loggées avec contexte complet (timestamp, user ID, request payload)
- NFR-I5: Mode dégradé si service IA down (message user + retry automatique)
- NFR-I6: OAuth Google suit standards OAuth 2.0 avec gestion refresh tokens
- NFR-I7: Toutes intégrations API ont timeout configuré (30s max)

#### Reliability (NFR-R1 à R8)

- NFR-R1: Uptime ≥99% mensuel (~7h downtime/mois acceptable)
- NFR-R2: Backups database automatiques quotidiens (rétention 30 jours)
- NFR-R3: Zero data loss pour commandes payées (transactions ACID)
- NFR-R4: Erreurs critiques déclenchent alertes email admin en moins de 5 minutes
- NFR-R5: Healthcheck endpoint (/api/health) pour monitoring uptime externe
- NFR-R6: Échecs génération IA récupérables (retry auto 3×, puis message user)
- NFR-R7: Échecs d'envoi email permettent re-send manuel admin via dashboard
- NFR-R8: Logging complet de toutes les transactions (générations, paiements, erreurs)

---

### Additional Requirements

#### Depuis l'Architecture (Starter Templates — Impact Epic 1 Story 1)

- Starter Frontend : `npx create-next-app@latest poster-generator-web --yes` (Next.js 16.1.6) + `npx shadcn@latest init` + composants de base (button, card, form, input, dialog, toast, select, checkbox, label, textarea, alert, progress, skeleton)
- Starter Backend : AdonisJS 6 avec `npm init adonisjs@latest poster-generator-api`, PostgreSQL via Railway
- Architecture sync + polling 3s (pas de job queue ni SSE pour MVP)
- 4 Services backend propres : AuthService, GenerationService, OrderService, EmailService
- Form enrichi avec preview texte AVANT génération (validation inline, noms auto-caps, date picker, lieu structuré) — économise 52% coûts API
- Cloudinary (gratuit 25GB) pour stockage temporaire photos
- Resend (gratuit 3K emails/mois) pour emails transactionnels
- Pino (JSON structuré) pour logging backend
- UptimeRobot (gratuit) pour monitoring healthcheck
- Déploiement : Vercel (frontend, gratuit) + Railway (backend + DB, $5/mois)
- Infrastructure totale : ~$5/mois (sous budget 200€)
- Cron job RGPD : suppression automatique photos après 7 jours
- Stripe webhooks pour confirmation paiement asynchrone (NFR-I2)
- Migration path documentée dans code : `// TODO Growth` pour async/SSE/feedback IA

#### Depuis l'UX Design (Siana Memento)

- Mobile-first obligatoire (moins de 768px priorité, 60-70% trafic attendu), sticky CTA en bas mobile
- Design system : shadcn/ui customisé, composants dans `/components/siana/`
- Palette : Blanc Glace (#FAFAFA) fond + Vert Sauge Botanique (#2D4A3E) accent + Noir Profond (#09090B)
- Typographies : Clash Display (titres) + Satoshi (interface/corps)
- IA Mascot Messenger : messages pré-écrits rotatifs (10-15 messages/étape), animations légères
- Focus Card System : contenu centralisé, max 450px desktop, expérience "galerie d'art"
- Style Universe Selector : galerie 5 templates avec effet zoom Luxe
- Reveal Canvas : fade-in 2s + confettis 3s (canvas-confetti 3KB) à la révélation du design
- Auth Juste à Temps : OAuth Google demandé APRÈS la révélation (valeur prouvée avant friction)
- Touch targets ≥44px × 44px sur mobile
- Navigation linéaire sans menus latéraux (tunnel de conversion)
- Fil d'Ariane narratif (mascotte + progress bar discrète en haut)
- Validation inline immédiate pour upload photos (format, taille)
- Form conversationnel : labels-questions (ex: "Comment s'appellent les futurs mariés ?")
- Feedback simple via mascotte : bouton "Ajuster" + reformulation pré-écrite chaleureuse avant re-génération
- Responsive breakpoints : mobile moins de 768px, tablet 768-1024px, desktop plus de 1024px (max 450px width)
- Sémantique HTML stricte : nav, main, h1-h2, footer, aria-labels pour mascotte

---

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1-FR5, FR8 | Epic 2 | Auth (register, login, OAuth Google, logout, sessions sécurisées) |
| FR6-FR7 | Epic 4 | Historique commandes + re-téléchargement 7j (nécessite Epic 2) |
| FR9-FR18 | Epic 3 | Upload, templates, form enrichi + preview texte, génération IA, itérations |
| FR19-FR22 | **Growth** | Feedback guidé IA-powered (post-MVP — documenté `// TODO Growth`) |
| FR23 | Epic 3 | Conseils mascotte ✨ (version simplifiée MVP) |
| FR24-FR26, FR28-FR30 | Epic 4 | Achat Stripe, confirmation, delivery email HR, re-téléchargement |
| FR27 | Epic 5 | Pricing transparent (landing page) |
| FR31 | Epic 3 | Cron RGPD — suppression automatique photos 7j (cycle de vie photos) |
| FR32 | Epic 5 | Politique de confidentialité RGPD visible (landing page) |
| FR33-FR39 | Epic 6 | Dashboard admin, logs générations, historique erreurs, alertes, export CSV |
| FR40-FR41, FR43-FR44 | Epic 3 | Validation upload, messages erreur, retry IA 3×, progress bar mascotte |
| FR42 | Epic 4 | Validation format email (checkout) |
| FR45-FR48, FR51 | Epic 6 | Healthcheck, backups, alertes <5min, survey satisfaction, CAC |
| FR49 | Epic 5 | Email support visible (footer + page contact) |
| FR50 | Epic 5 + 6 | Affichage testimonials visiteur (5) / Gestion admin CRUD (6) |

**Couverture totale : 51/51 FRs ✅** (FR19-FR22 documentés comme Growth phase)

---

## Epic List

### Epic 1 : Fondation Projet & Infrastructure

Les équipes peuvent initialiser, configurer et déployer l'application complète avec la stack technique validée (Next.js 16.1.6 + AdonisJS 6), le Design System Siana Memento, et une smoke page statique déployée pour validation marché précoce.

FRs couverts : Aucun FR direct — fondation technique habilitante pour tous les FRs
NFRs adressés : NFR-S1, NFR-R1, NFR-R2, NFR-SC4

---

### Story 1.1 : Initialisation des Repositories avec les Starters Officiels

En tant que développeur,
je veux initialiser les repositories frontend et backend via les starters officiels validés,
afin que le projet dispose d'une fondation technique correcte et prête pour le développement dès le premier jour.

**Acceptance Criteria:**

**Given** un environnement avec Node.js installé
**When** j'exécute `npx create-next-app@latest poster-generator-web --yes`
**Then** le projet Next.js 16.1.6 est créé avec App Router, TypeScript strict, Tailwind CSS et ESLint configurés

**Given** le projet frontend initialisé
**When** j'exécute `npx shadcn@latest init` et ajoute les composants de base (button, card, form, input, dialog, toast, select, checkbox, label, textarea, alert, progress, skeleton)
**Then** tous les composants shadcn/ui sont disponibles dans le projet sous `/components/ui/`

**Given** un environnement Node.js
**When** j'initialise le backend avec `npm init adonisjs@latest poster-generator-api` et configure PostgreSQL (Lucid ORM) + module Auth
**Then** le projet AdonisJS 6 est créé et démarre sans erreur avec `node ace serve`

**Given** les deux repositories créés
**When** je pousse sur GitHub et vérifie le lint/build initial
**Then** les deux projets passent le check CI initial sans erreurs

---

### Story 1.2 : Configuration de l'Infrastructure de Déploiement

En tant que développeur,
je veux configurer tous les services d'hébergement et intégrations externes,
afin que l'application soit déployable en production avec toutes ses dépendances connectées.

**Acceptance Criteria:**

**Given** un compte Vercel lié au repo GitHub frontend
**When** je configure les variables d'environnement (`NEXT_PUBLIC_API_URL`, etc.) et merge sur `main`
**Then** le frontend se déploie automatiquement et est accessible via HTTPS (NFR-S1)

**Given** un compte Railway
**When** je déploie le backend avec PostgreSQL et configure les variables d'environnement (DATABASE_URL, clé API service IA, Stripe secret, Resend API key, Cloudinary credentials)
**Then** le backend est accessible à `api.[domain]` avec HTTPS et la DB est provisionnée

**Given** le backend déployé
**When** j'appelle `GET /api/health`
**Then** la réponse est `{"status": "ok", "timestamp": "..."}` avec HTTP 200 (FR45)

**Given** un compte Cloudinary (Free, 25GB)
**When** je configure le bucket avec les origines CORS autorisées (domaine Vercel + localhost)
**Then** un test d'upload depuis le frontend réussit sans erreur CORS

**Given** un compte Resend (Free, 3K emails/mois)
**When** j'envoie un email de test via l'API key
**Then** l'email est délivré dans la boîte de réception de test (validation NFR-I3)

---

### Story 1.3 : Design System Siana Memento

En tant que développeur,
je veux implémenter les tokens de design, typographies et composants de base Siana Memento,
afin que tous les développements UI ultérieurs utilisent une identité visuelle cohérente et accessible.

**Acceptance Criteria:**

**Given** le projet Next.js
**When** je configure `tailwind.config.ts` avec les tokens Siana Memento (Vert Sauge Botanique `#2D4A3E`, Blanc Glace `#FAFAFA`, Noir Profond `#09090B`)
**Then** les classes Tailwind custom sont disponibles et les composants shadcn/ui utilisent la palette correcte

**Given** les polices à configurer
**When** j'ajoute Clash Display (titres) et Satoshi (interface/corps) via `next/font`
**Then** les deux polices se chargent sans layout shift (CLS < 0.1) et s'affichent correctement sur mobile et desktop

**Given** les tokens définis
**When** je crée le répertoire `/components/siana/` avec le composant `FocusCard` (conteneur centré, max-width 450px desktop, 100% mobile)
**Then** le composant est utilisable comme base de toutes les pages du tunnel de conversion

**Given** le design system implémenté
**When** j'audite avec axe DevTools le texte Vert Sauge sur Blanc Glace
**Then** le ratio de contraste est ≥4.5:1 (NFR-A3) et Lighthouse Accessibility ≥90 (NFR-A7)

---

### Story 1.4 : Smoke Page Statique — Signal Marché Précoce

En tant que visiteur potentiel arrivant sur le site,
je veux voir une page qui présente clairement la promesse produit et le pricing,
afin qu'Aldo puisse valider l'intérêt du marché avant de terminer le produit complet.

**Acceptance Criteria:**

**Given** un visiteur arrivant sur l'URL racine
**When** la page se charge
**Then** il voit le nom Siana Memento, le sous-titre "Générez votre Save the Date unique avec vos photos en 15 minutes", le pricing "19.90€", et un formulaire d'email waitlist

**Given** un visiteur sur la smoke page
**When** il soumet son email au formulaire waitlist
**Then** l'email est enregistré (liste de contacts Resend) et un message de confirmation s'affiche

**Given** la smoke page déployée
**When** j'exécute Lighthouse dessus
**Then** Performance ≥90 (mobile), SEO ≥95, Accessibility ≥90 (NFR-P7, NFR-A7)

**Given** la page HTML
**When** j'inspecte le `<head>`
**Then** les meta tags sont présents : title, description, og:title, og:description, og:image pour le partage social

---

### Epic 2 : Authentification & Gestion de Compte

Les utilisateurs peuvent créer un compte (email/password ou Google OAuth), se connecter, se déconnecter, et bénéficier de sessions sécurisées 7 jours. L'auth est proposée Juste à Temps — uniquement après la révélation du design, jamais comme login wall bloquant.

FRs couverts : FR1, FR2, FR3, FR4, FR5, FR8
NFRs clés : NFR-S2, NFR-S3, NFR-S6, NFR-S7, NFR-S8, NFR-I6

Note UX critique : Les stories de cet epic implémentent l'auth comme un modal/overlay surgissant du flow de génération (Epic 3), non comme une page bloquante en entrée de site.

---

### Story 2.1 : Inscription par Email et Mot de Passe

En tant que visiteur,
je veux créer un compte avec mon email et un mot de passe,
afin d'accéder aux fonctionnalités réservées aux utilisateurs connectés.

**Acceptance Criteria:**

**Given** un visiteur sur le formulaire d'inscription
**When** il saisit un email valide et un mot de passe (≥8 caractères) et soumet
**Then** un compte est créé, le mot de passe est hashé avec bcrypt (cost factor ≥12) et l'utilisateur est connecté automatiquement (NFR-S2)

**Given** un email déjà enregistré
**When** le visiteur tente de s'inscrire avec ce même email
**Then** un message d'erreur clair s'affiche : "Un compte existe déjà avec cet email"

**Given** un compte créé
**When** j'inspecte la base de données
**Then** le mot de passe est hashé (non lisible en clair) et l'email est chiffré au repos (NFR-S6)

---

### Story 2.2 : Connexion par Email et Mot de Passe

En tant qu'utilisateur enregistré,
je veux me connecter avec mon email et mon mot de passe,
afin d'accéder à mon compte et mon historique.

**Acceptance Criteria:**

**Given** un utilisateur avec un compte existant
**When** il saisit ses identifiants corrects et soumet
**Then** il est connecté et une session sécurisée est créée (cookie httpOnly, expiration 7 jours d'inactivité — NFR-S3)

**Given** des identifiants incorrects
**When** l'utilisateur soumet le formulaire
**Then** un message d'erreur générique s'affiche ("Email ou mot de passe incorrect") sans révéler lequel est faux

**Given** un utilisateur connecté inactif depuis 7 jours
**When** il tente d'effectuer une action authentifiée
**Then** sa session est expirée et il est redirigé vers la connexion (NFR-S3)

---

### Story 2.3 : Connexion et Inscription via Google OAuth

En tant que visiteur,
je veux me connecter ou créer un compte en un clic avec Google,
afin de réduire la friction et accéder rapidement au service.

**Acceptance Criteria:**

**Given** un visiteur cliquant sur "Continuer avec Google"
**When** il complète le flow OAuth Google
**Then** un compte est créé (si nouveau) ou il est connecté (si existant), et le token OAuth n'est jamais exposé côté client (NFR-S7)

**Given** le flow OAuth Google implémenté
**When** j'inspecte l'implémentation
**Then** il suit les standards OAuth 2.0 avec gestion des refresh tokens (NFR-I6)

**Given** un utilisateur OAuth existant
**When** il revient et se reconnecte via Google
**Then** il retrouve son compte et historique sans créer de doublon

---

### Story 2.4 : Déconnexion

En tant qu'utilisateur connecté,
je veux me déconnecter,
afin que ma session soit terminée de manière sécurisée.

**Acceptance Criteria:**

**Given** un utilisateur connecté
**When** il clique sur "Se déconnecter"
**Then** sa session est invalidée côté serveur et le cookie de session est supprimé

**Given** une session invalidée
**When** l'utilisateur tente d'accéder à une page protégée
**Then** il est redirigé vers la page de connexion

---

### Story 2.5 : Modal Auth Juste à Temps

En tant qu'utilisateur ayant vu son design généré,
je veux pouvoir créer un compte ou me connecter via un modal,
afin de finaliser mon achat sans avoir été bloqué par un login wall dès l'arrivée sur le site.

**Acceptance Criteria:**

**Given** un utilisateur non connecté ayant atteint l'écran de révélation du design
**When** il clique sur "Acheter — 19.90€"
**Then** un modal d'auth s'ouvre (Google OAuth en bouton primaire, email/password en option secondaire) sans quitter la page de révélation

**Given** l'utilisateur complète l'auth dans le modal
**When** la connexion réussit
**Then** le modal se ferme et le flow d'achat reprend là où il s'était arrêté, sans perte du design généré

**Given** l'utilisateur ferme le modal sans s'authentifier
**When** il revient sur la page de révélation
**Then** son design est toujours visible et le bouton d'achat est toujours présent

---

### Epic 3 : Création & Génération de Design IA

Les utilisateurs peuvent uploader leurs photos, configurer leur Save the Date via un form conversationnel enrichi avec preview texte, choisir un style parmi 5 templates, lancer la génération IA avec progress mascotte, prévisualiser le résultat via une preview watermarquée Cloudinary avec révélation + confettis, et itérer jusqu'à 3 fois. Les photos et designs sont automatiquement supprimés après 7 jours (RGPD).

FRs couverts : FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR23 (simplifié mascotte), FR31 (cron RGPD photos + designs), FR40, FR41, FR43, FR44
Growth documentés : FR19, FR20, FR21, FR22 (feedback guidé IA-powered — TODO Growth)
NFRs clés : NFR-P1, NFR-P3, NFR-P4, NFR-P5, NFR-P6, NFR-SC1, NFR-SC6, NFR-I1, NFR-I4, NFR-I5, NFR-I7, NFR-A1-A7, NFR-S5, NFR-S9

---

### Story 3.1 : Upload de Photos

En tant qu'utilisateur,
je veux uploader jusqu'à 2 photos depuis mon appareil,
afin de fournir les photos personnelles qui serviront à créer mon illustration.

**Acceptance Criteria:**

**Given** un utilisateur sur la page d'upload
**When** il dépose ou sélectionne 1 ou 2 photos (JPG/PNG, max 10MB chacune)
**Then** les photos sont uploadées sur Cloudinary et une prévisualisation s'affiche immédiatement (NFR-P6 : traitement < 5s)

**Given** un fichier dont le format n'est pas JPG ou PNG
**When** l'utilisateur tente de l'uploader
**Then** un message d'erreur bienveillant s'affiche via la mascotte avec la solution ("Ce format n'est pas supporté, utilisez JPG ou PNG") (FR40, FR41, NFR-S9)

**Given** un fichier dépassant 10MB
**When** l'utilisateur tente de l'uploader
**Then** l'upload est bloqué immédiatement avec un message indiquant la limite et comment compresser la photo (FR40, FR41)

**Given** les photos uploadées
**When** j'inspecte le stockage Cloudinary
**Then** elles sont stockées avec un identifiant de session et leur date d'expiration est fixée à J+7 (NFR-S5, FR31)

---

### Story 3.2 : Galerie de Sélection de Template (Style Universe Selector)

En tant qu'utilisateur,
je veux voir et choisir parmi 5 styles artistiques illustrés,
afin de définir l'univers visuel de mon Save the Date avant la génération.

**Acceptance Criteria:**

**Given** un utilisateur ayant uploadé ses photos
**When** il arrive sur la page de sélection de style
**Then** une galerie de 5 templates s'affiche (Bohème, Moderne, Classique, Vintage, Minimaliste) avec un visuel d'exemple pour chacun (FR10)

**Given** la galerie sur mobile
**When** l'utilisateur la consulte
**Then** les cartes de template ont une zone tactile d'au moins 44px et l'effet zoom "Luxe" est visible au tap (NFR-A2)

**Given** un utilisateur qui sélectionne un template
**When** il clique ou tape sur une carte
**Then** le template est mis en évidence (bordure Vert Sauge) et un bouton "Continuer" devient actif (FR11)

---

### Story 3.3 : Form Conversationnel Enrichi avec Preview Texte

En tant qu'utilisateur,
je veux renseigner les noms, la date et le lieu de mon mariage via un formulaire conversationnel,
afin de voir une preview du texte final avant de lancer la génération IA et éviter des itérations inutiles.

**Acceptance Criteria:**

**Given** un utilisateur ayant choisi son template
**When** il arrive sur le formulaire de configuration
**Then** les labels sont formulés en questions ("Comment s'appellent les futurs mariés ?", "Quelle est la date de votre mariage ?", "Où se célèbre votre mariage ?") et la mascotte l'accueille chaleureusement (FR23)

**Given** l'utilisateur saisit les prénoms
**When** il tape la première lettre
**Then** la mise en majuscule automatique s'applique et la validation inline confirme le champ en temps réel

**Given** tous les champs remplis
**When** l'utilisateur consulte la section preview
**Then** il voit un aperçu du texte final tel qu'il apparaîtra sur le design ("Sophie & Thomas — 20 Septembre 2026 — Château de Lastours") avant de valider

**Given** l'utilisateur valide la preview
**When** il clique sur "C'est parfait, générer mon design"
**Then** le système enregistre la configuration et passe à l'étape de génération

---

### Story 3.4 : Génération IA avec Progress Mascotte

En tant qu'utilisateur,
je veux voir la progression de la génération de mon illustration via des messages animés de la mascotte,
afin de vivre une attente engageante et rassurante pendant les 20-30 secondes de traitement.

**Acceptance Criteria:**

**Given** un utilisateur ayant validé sa configuration
**When** la génération IA est lancée
**Then** une progress bar (0 à 100%) s'affiche avec des messages rotatifs de la mascotte toutes les 5s ("Analyse de vos photos...", "Création de votre illustration...", "Finalisation des derniers détails...") et le temps estimé restant (FR44)

**Given** la génération en cours
**When** le frontend interroge l'API en polling toutes les 3s (NFR-P5)
**Then** la progress bar se met à jour en fonction du statut retourné par le backend

**Given** le service IA qui échoue sur une tentative
**When** la première tentative retourne une erreur
**Then** le système effectue jusqu'à 3 tentatives avec backoff exponentiel (2s→4s→8s) avant d'afficher un message d'erreur utilisateur (FR43, NFR-SC6)

**Given** 3 tentatives échouées
**When** le service IA est indisponible
**Then** un message bienveillant s'affiche avec un bouton de retry manuel (NFR-I5)

**Given** la génération réussie (moins de 30s dans 95% des cas — NFR-P1)
**When** le backend retourne l'URL de l'illustration
**Then** l'utilisateur est redirigé automatiquement vers l'écran de révélation

---

### Story 3.5 : Révélation du Design avec Effet Wow

En tant qu'utilisateur,
je veux découvrir mon illustration générée via une révélation animée,
afin de vivre le moment émotionnel fort qui est au cœur de l'expérience Siana Memento.

**Acceptance Criteria:**

**Given** la génération terminée avec succès
**When** l'utilisateur arrive sur l'écran de révélation
**Then** l'illustration apparaît via un fade-in progressif sur 2 secondes suivi d'une célébration confettis de 3 secondes (canvas-confetti, 3KB) (FR14)

**Given** l'illustration révélée
**When** l'utilisateur pinch-to-zoom ou clique sur l'illustration
**Then** il peut voir les détails en haute résolution (FR15)

**Given** l'illustration affichée
**When** l'utilisateur consulte l'interface
**Then** le compteur d'itérations est visible ("Itération 1/3 — 2 itérations restantes incluses") (FR16)

---

### Story 3.6 : Upload Cloudinary & Watermark Design Preview

En tant que système,
je veux uploader le design généré sur Cloudinary et ne retourner au frontend qu'une preview watermarquée,
afin que les utilisateurs ne puissent pas accéder au design pleine résolution avant paiement et que le base64 volumineuse disparaisse du localStorage.

**Acceptance Criteria:**

**Given** la génération Gemini terminée avec succès
**When** le backend obtient le PNG base64
**Then** il l'uploade sur Cloudinary (dossier `designs/`) et retourne un `previewUrl` watermarqué (redimensionné 1000px, watermark texte centré semi-transparent) — jamais le base64 ni l'URL full-res originale

**Given** l'upload Cloudinary réussi
**When** on inspecte la table `designs`
**Then** les champs `cloudinary_public_id` et `preview_url` sont renseignés — le full-res propre est accessible uniquement côté serveur (pour Story 4.2 delivery email)

**Given** le localStorage de l'utilisateur
**When** il inspecte `siana-generation-store`
**Then** `generatedImageUrl` contient une URL `https://res.cloudinary.com/...` — aucun base64 en localStorage

**Given** l'upload Cloudinary qui échoue
**When** après 3 tentatives
**Then** le backend retourne une erreur 500 et la génération est marquée en échec

---

### Story 3.7 : Itérations et Feedback Simple

En tant qu'utilisateur non satisfait du premier résultat,
je veux ajuster ma demande et regénérer,
afin d'obtenir une illustration plus proche de mes attentes dans la limite de 3 itérations incluses.

**Acceptance Criteria:**

**Given** un utilisateur sur l'écran de révélation
**When** il clique sur "Ajuster"
**Then** un panneau s'ouvre avec des options rapides (texte trop petit/grand, photos pas assez visibles, couleurs, style) et un champ libre, avec la mascotte qui demande "Qu'est-ce que je peux améliorer ?" (FR23 simplifié)

**Given** l'utilisateur valide son ajustement
**When** il clique sur "Regénérer"
**Then** la mascotte reformule chaleureusement ("D'accord, je vais agrandir vos prénoms. Prêt pour la prochaine version ?") et la génération repart (Story 3.4)

**Given** un utilisateur voulant changer ses photos
**When** il clique sur "Changer mes photos"
**Then** il est redirigé vers Story 3.1 sans perdre son choix de template ni sa configuration texte (FR18)

**Given** l'utilisateur ayant utilisé ses 3 itérations
**When** il tente d'en lancer une 4e
**Then** le bouton "Ajuster" est désactivé et un message l'informe que les 3 itérations incluses sont épuisées (FR16, FR17)

---

### Story 3.8 : Cron RGPD — Suppression Automatique des Photos & Designs

En tant que système,
je veux supprimer automatiquement les photos et designs des utilisateurs après 7 jours,
afin d'être conforme au RGPD et à la politique de confidentialité affichée.

**Acceptance Criteria:**

**Given** une photo uploadée sur Cloudinary
**When** 7 jours se sont écoulés depuis l'upload
**Then** la photo est automatiquement supprimée de Cloudinary via un cron job quotidien (FR31, NFR-S5)

**Given** un design généré (non acheté) stocké sur Cloudinary
**When** 7 jours se sont écoulés depuis la génération
**Then** le design est automatiquement supprimé de Cloudinary via le même cron job (utilise `cloudinary_public_id` de la table `designs`)

**Given** un design acheté stocké sur Cloudinary
**When** 7 jours se sont écoulés depuis la date d'achat
**Then** le design est automatiquement supprimé de Cloudinary (dépendance Story 4.1 pour `purchased_at`)

**Given** le cron job exécuté
**When** j'inspecte les logs backend
**Then** chaque suppression est loggée (Pino) avec l'identifiant de session et le timestamp (NFR-R8)

**Given** un utilisateur tentant de re-générer après suppression de ses photos
**When** ses photos ne sont plus disponibles
**Then** un message clair l'invite à uploader de nouvelles photos

---

### Epic 4 : Achat, Livraison & Espace Personnel

Les utilisateurs peuvent acheter leur design pour 19.90€ via Stripe, recevoir immédiatement le fichier haute résolution par email, consulter leur historique de commandes, et re-télécharger leurs designs dans les 7 jours.

FRs couverts : FR6, FR7 (nécessite Epic 2), FR24, FR25, FR26, FR28, FR29, FR30, FR42
NFRs clés : NFR-S4, NFR-I2, NFR-I3, NFR-I7, NFR-R3, NFR-R6, NFR-R7

Note : Les stories FR6 (historique) et FR7 (re-téléchargement) nécessitent Epic 2 (Auth) comme prérequis implémenté.

---

### Story 4.1 : Checkout Stripe

En tant qu'utilisateur ayant choisi son design,
je veux payer 19.90€ de manière sécurisée,
afin de finaliser l'achat et recevoir mon illustration haute résolution.

**Acceptance Criteria:**

**Given** un utilisateur connecté sur l'écran de révélation
**When** il clique sur "Acheter — 19.90€"
**Then** il est redirigé vers un checkout Stripe avec le prix pré-rempli à 19.90€ (FR24, FR25, NFR-S4)

**Given** un paiement réussi
**When** Stripe envoie le webhook de confirmation
**Then** la commande est enregistrée en base de données avec transaction ACID (NFR-R3) et l'utilisateur est redirigé vers une page de confirmation (FR26)

**Given** un paiement échoué
**When** Stripe retourne une erreur
**Then** un message d'erreur clair s'affiche et l'utilisateur peut réessayer sans perdre son design

**Given** le webhook Stripe reçu
**When** j'inspecte l'implémentation
**Then** la signature du webhook est validée avant tout traitement (sécurité anti-replay)

---

### Story 4.2 : Delivery Email avec Fichier Haute Résolution

En tant qu'utilisateur ayant payé,
je veux recevoir automatiquement mon design par email,
afin de disposer immédiatement du fichier haute résolution sans action supplémentaire.

**Acceptance Criteria:**

**Given** une commande confirmée par le webhook Stripe
**When** le système traite la confirmation
**Then** un email est envoyé via Resend dans les 60 secondes avec le fichier HR attaché (minimum 3000×3000px) et un message chaleureux (FR28, FR29, NFR-I3)

**Given** l'email envoyé
**When** l'utilisateur l'ouvre
**Then** il peut télécharger directement le fichier haute résolution depuis la pièce jointe (FR30)

**Given** l'adresse email contenant des espaces ou mal formatée
**When** le système tente l'envoi
**Then** l'email est nettoyé (trim) et validé avant l'envoi (FR42)

**Given** l'envoi email qui échoue
**When** une erreur de delivery est détectée
**Then** l'échec est loggé avec le contexte complet (NFR-I4) et l'admin peut renvoyer manuellement depuis le dashboard (NFR-R7)

---

### Story 4.3 : Page de Confirmation Post-Achat

En tant qu'utilisateur ayant payé,
je veux voir une page de confirmation enthousiaste,
afin de vivre le moment de possession de mon design et être encouragé à le partager.

**Acceptance Criteria:**

**Given** un paiement confirmé
**When** l'utilisateur est redirigé vers la page de confirmation
**Then** il voit un message de célébration ("Votre Save the Date est en route ! Vérifiez votre boîte email."), un récapitulatif de commande, et un aperçu de son illustration

**Given** la page de confirmation
**When** l'utilisateur la consulte
**Then** l'adresse email de support est visible avec un message rassurant ("Une question ? Répondez simplement à l'email reçu") (FR49)

---

### Story 4.4 : Historique de Commandes

En tant qu'utilisateur connecté,
je veux consulter mes commandes passées,
afin de retrouver facilement mes designs achetés.

**Acceptance Criteria:**

**Given** un utilisateur connecté accédant à son espace personnel
**When** il consulte la page "Mes commandes"
**Then** il voit la liste de ses commandes avec date, aperçu miniature du design, statut (livré), et un bouton de re-téléchargement si disponible (FR6)

**Given** aucune commande passée
**When** l'utilisateur accède à la page
**Then** un état vide bienveillant s'affiche avec un CTA pour créer son premier design

---

### Story 4.5 : Re-téléchargement dans les 7 Jours

En tant qu'utilisateur connecté ayant acheté un design,
je veux pouvoir le re-télécharger depuis mon espace personnel,
afin de récupérer mon fichier si l'email a été supprimé ou perdu.

**Acceptance Criteria:**

**Given** un utilisateur connecté dont le design a été acheté il y a moins de 7 jours
**When** il clique sur "Re-télécharger" dans son historique
**Then** le fichier haute résolution est téléchargé directement (FR7)

**Given** un design acheté il y a plus de 7 jours
**When** l'utilisateur tente de le re-télécharger
**Then** le bouton est désactivé et un message indique que le fichier n'est plus disponible (conformément à la politique RGPD)

---

### Epic 5 : Landing Page & Découverte Publique

Les visiteurs peuvent découvrir Siana Memento, voir des exemples de designs générés, comprendre le pricing (19.90€ affiché clairement), lire des témoignages clients, et accéder aux informations de contact et à la politique RGPD.

FRs couverts : FR27, FR32, FR49, FR50 (affichage testimonials — lecture seule visiteurs)
NFRs clés : NFR-P2, NFR-P7, NFR-A1-A7 (SEO + accessibilité complète)

---

### Story 5.1 : Hero Section & Proposition de Valeur

En tant que visiteur arrivant sur le site,
je veux comprendre immédiatement ce qu'est Siana Memento et ce que je vais obtenir,
afin de décider en quelques secondes si le service correspond à mon besoin.

**Acceptance Criteria:**

**Given** un visiteur arrivant sur l'URL racine
**When** la page se charge
**Then** il voit au-dessus de la ligne de flottaison : le titre principal, la promesse "Save the Date unique avec vos photos en 15 minutes", le pricing "19.90€" affiché clairement, et un CTA primaire "Créer mon Save the Date" (FR27)

**Given** la landing page sur mobile
**When** un visiteur la consulte sur un écran de moins de 768px
**Then** la mise en page est responsive, le CTA est accessible sans scroll, et le LCP est inférieur à 2.5s (NFR-P2)

**Given** la page HTML
**When** j'inspecte le code source
**Then** les balises title, meta description, og:title, og:image sont correctement renseignées pour le SEO et le partage social (NFR-P7)

**Given** la landing page
**When** j'exécute Lighthouse
**Then** les scores Performance ≥90 (mobile), SEO ≥95, Accessibility ≥90 sont atteints (NFR-P7, NFR-A7)

---

### Story 5.2 : Galerie d'Exemples et Section "Comment ça marche"

En tant que visiteur curieux,
je veux voir des exemples de designs générés et comprendre le processus en 3 étapes,
afin d'être convaincu de la qualité du résultat avant de passer commande.

**Acceptance Criteria:**

**Given** un visiteur scrollant la landing page
**When** il atteint la section galerie
**Then** il voit au moins 3 exemples de designs générés (un par style) avec des légendes illustrant des couples fictifs

**Given** la section "Comment ça marche"
**When** le visiteur la consulte
**Then** il voit 3 étapes illustrées : "Uploadez vos photos", "Choisissez votre style", "Recevez votre illustration en 15 min"

**Given** le contenu textuel de la landing page
**When** j'analyse le HTML
**Then** la page contient au moins 300 mots de texte indexable (titres H2, étapes, FAQ) pour le référencement naturel (NFR-P7)

---

### Story 5.3 : Témoignages Clients

En tant que visiteur hésitant,
je veux lire des avis de clients satisfaits,
afin de me rassurer sur la qualité du service avant d'acheter.

**Acceptance Criteria:**

**Given** des testimonials activés dans la base de données (gérés via Epic 6)
**When** un visiteur consulte la landing page
**Then** les testimonials actifs s'affichent avec le prénom du client et son témoignage (FR50 — affichage lecture seule)

**Given** aucun testimonial activé
**When** la section est rendue
**Then** elle est masquée proprement sans espace vide visible

---

### Story 5.4 : Footer, Contact & Politique RGPD

En tant que visiteur,
je veux trouver facilement les informations légales et les moyens de contact,
afin d'avoir confiance dans le service et ses engagements sur mes données.

**Acceptance Criteria:**

**Given** un visiteur consultant le footer
**When** il le lit
**Then** il voit l'adresse email de support (support@[domain]) clairement affichée (FR49)

**Given** un visiteur cliquant sur "Politique de confidentialité"
**When** la page s'ouvre
**Then** il peut lire la politique RGPD complète incluant : données collectées, durée de conservation des photos (7 jours), droits de l'utilisateur, et coordonnées du responsable de traitement (FR32)

**Given** un nouveau visiteur interagissant pour la première fois avec un formulaire
**When** il consulte le formulaire
**Then** un lien vers la politique de confidentialité est affiché avant la soumission (NFR-S8)

---

### Epic 6 : Dashboard Admin & Opérations Business

Aldo peut surveiller les métriques business (revenus, coûts API, marges, taux conversion), consulter les logs de génération, recevoir des alertes automatiques (<5 min), exporter les données en CSV, gérer les testimonials, renvoyer manuellement des designs, et tracker le coût d'acquisition client par canal.

**FRs couverts :** FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR45, FR46, FR47, FR48, FR50 (CRUD admin), FR51
**NFRs clés :** NFR-R1, NFR-R4, NFR-R5, NFR-R8, NFR-S10, NFR-I4, NFR-SC3

---

### Story 6.1 : Healthcheck Endpoint et Monitoring

En tant qu'admin Aldo,
je veux un endpoint `/api/health` qui vérifie l'état de tous les composants,
afin de recevoir des alertes via UptimeRobot si le service est dégradé.

**Acceptance Criteria:**

**Given** une requête GET sur `/api/health`
**When** tous les composants sont opérationnels (DB, Cloudinary, Resend)
**Then** l'endpoint retourne HTTP 200 avec `{ status: "ok", components: {...} }` (FR45)

**Given** une requête GET sur `/api/health`
**When** un composant est indisponible
**Then** l'endpoint retourne HTTP 503 avec le détail du composant défaillant (NFR-R5)

**Given** l'endpoint configuré
**When** UptimeRobot ping toutes les 5 minutes et deux pings consécutifs échouent
**Then** Aldo reçoit un email d'alerte automatique (NFR-R1 — uptime ≥99%)

**Given** l'endpoint `/api/health`
**When** j'inspecte son accès
**Then** il est protégé par un secret token ou IP allowlist — jamais public sans auth (NFR-S10)

---

### Story 6.2 : Dashboard Métriques Business et Export CSV

En tant qu'admin Aldo,
je veux consulter les métriques essentielles et exporter les données en CSV,
afin de surveiller la santé financière du service et prendre des décisions marketing.

**Acceptance Criteria:**

**Given** Aldo authentifié sur `/admin/dashboard`
**When** il consulte la page
**Then** il voit pour les 30 derniers jours : revenus totaux (€), nombre de commandes, coût API moyen par commande, marge brute estimée, taux de conversion (FR33)

**Given** le dashboard admin
**When** Aldo consulte la section CAC
**Then** il voit le coût d'acquisition client par canal (organique, paid, social, referral) si les données UTM sont disponibles (FR51)

**Given** Aldo sur le dashboard
**When** il clique "Exporter CSV"
**Then** un fichier CSV est téléchargé avec toutes les commandes de la période : date, montant, statut, coût API, marge (FR39)

**Given** un utilisateur non-admin tentant d'accéder à `/admin`
**When** sa requête arrive
**Then** il reçoit une redirection 401/403 — aucune donnée admin accessible (NFR-S10)

---

### Story 6.3 : Logs de Génération et Historique Erreurs IA

En tant qu'admin Aldo,
je veux consulter les logs de toutes les générations et l'historique des erreurs IA,
afin de diagnostiquer rapidement les problèmes et optimiser les coûts API.

**Acceptance Criteria:**

**Given** Aldo authentifié sur `/admin/logs`
**When** il consulte la liste des générations
**Then** chaque entrée affiche : date/heure, user ID, template, durée (ms), coût Gemini API estimé (€), statut (FR34, NFR-R8)

**Given** la table des logs
**When** Aldo filtre par "échecs seulement"
**Then** il voit l'historique des erreurs avec le message complet et le contexte (payload, timestamp) (FR35, NFR-I4)

**Given** le backend AdonisJS
**When** une génération est lancée ou échoue
**Then** l'événement est loggé via Pino en JSON structuré (timestamp, user_id, template, durée, coût_api_estimate) (NFR-R8)

---

### Story 6.4 : Alertes Automatiques Admin

En tant qu'admin Aldo,
je veux recevoir des alertes email automatiques si des seuils critiques sont dépassés,
afin de réagir en moins de 5 minutes avant que les problèmes n'impactent les clients.

**Acceptance Criteria:**

**Given** le système en production
**When** le taux d'erreur des générations IA dépasse 5% sur les 15 dernières minutes
**Then** Aldo reçoit un email d'alerte avec le taux actuel et les 5 dernières erreurs (FR36, NFR-R4)

**Given** le suivi des coûts API
**When** le coût moyen par commande dépasse 0.70€ sur les 24 dernières heures
**Then** Aldo reçoit un email d'alerte avec le coût actuel vs seuil (FR37, NFR-R4)

**Given** les appels Gemini API
**When** les rate limits atteignent >80% du quota journalier
**Then** Aldo reçoit un email d'alerte avec le quota restant (FR38, NFR-R4)

**Given** les alertes configurées
**When** je vérifie le délai de réception
**Then** l'email est envoyé en moins de 5 minutes après détection du seuil (NFR-R4)

---

### Story 6.5 : Renvoi Manuel de Designs et Backups DB

En tant qu'admin Aldo,
je veux pouvoir renvoyer manuellement un design par email et être assuré que les données sont sauvegardées,
afin de réparer les livraisons échouées et garantir la récupération des données en cas de défaillance.

**Acceptance Criteria:**

**Given** Aldo sur `/admin/orders` et une commande avec statut `email_failed`
**When** il clique "Renvoyer l'email"
**Then** le système renvoie l'email avec le design HR en pièce jointe et met à jour le statut de la commande (FR47, NFR-R7)

**Given** Aldo renvoyant un design
**When** le renvoi est déclenché
**Then** l'action est loggée avec timestamp et admin_id pour traçabilité (NFR-R8)

**Given** la base de données PostgreSQL sur Railway
**When** minuit (UTC) chaque jour
**Then** un backup automatique est effectué et conservé 30 jours (FR46, NFR-R2)

**Given** un paiement Stripe confirmé
**When** une erreur survient lors de l'envoi email ou de la génération
**Then** la commande reste enregistrée en base avec statut récupérable — aucune perte de données (NFR-R3)

---

### Story 6.6 : Gestion des Testimonials (CRUD Admin)

En tant qu'admin Aldo,
je veux gérer les testimonials de la landing page (ajouter, modifier, activer, supprimer),
afin de contrôler la preuve sociale présentée aux visiteurs sans redéploiement.

**Acceptance Criteria:**

**Given** Aldo sur `/admin/testimonials`
**When** il crée un nouveau testimonial
**Then** le formulaire accepte : prénom client, texte du témoignage, statut actif/inactif (FR50)

**Given** un testimonial actif
**When** Aldo le désactive
**Then** il disparaît immédiatement de la landing page sans redéploiement (flag `is_active`) (FR50)

**Given** un testimonial activé depuis le dashboard
**When** un visiteur recharge la landing page
**Then** le testimonial apparaît dans la section Story 5.3 sans redéploiement Vercel

**Given** Aldo souhaitant supprimer définitivement un testimonial
**When** il confirme la suppression
**Then** le testimonial est supprimé de la base de données (FR50)

---

### Story 6.7 : Survey de Satisfaction Post-Achat

En tant que client ayant acheté un design,
je veux recevoir un survey de satisfaction 24h après mon achat,
afin de partager mon expérience et aider Siana Memento à s'améliorer.

**Acceptance Criteria:**

**Given** une commande avec statut `paid` et email livré avec succès
**When** 24 heures s'écoulent après la confirmation de paiement
**Then** le client reçoit un email avec 3 questions : satisfaction globale (1-5), qualité design (1-5), recommandation (Oui/Non) (FR48)

**Given** l'email de survey reçu
**When** le client clique pour répondre
**Then** il accède à une page simple (sans connexion requise) pour soumettre ses réponses

**Given** les réponses soumises
**When** Aldo consulte le dashboard
**Then** il voit le score de satisfaction moyen et la distribution des réponses

**Given** le cron job de survey
**When** il s'exécute
**Then** il n'envoie pas de survey aux commandes déjà enquêtées (idempotent — colonne `survey_sent_at`)

