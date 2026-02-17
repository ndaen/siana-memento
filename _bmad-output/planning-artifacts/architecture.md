---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/prd-validation-report.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-05.md'
workflowType: 'architecture'
project_name: 'Siana Memento'
user_name: 'Aldo'
date: '2026-02-16'
partyModeReviewed: true
partyModeValidationReviewed: true
lastStep: 8
status: 'complete'
completedAt: '2026-02-16'
---

# Architecture Decision Document - poster-generator

**Author:** Aldo
**Date:** 2026-02-15
**Project:** Siana Memento - SaaS de génération de Save the Date personnalisés par IA

---

_Ce document se construit collaborativement étape par étape. Les sections sont ajoutées au fur et à mesure de nos décisions architecturales._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (51 total):**

L'architecture doit supporter 8 catégories fonctionnelles distinctes :

1. **User Management (FR1-FR8)** : Système d'authentification dual (OAuth Google pour conversion optimisée + Email/Password classique), gestion de sessions sécurisées (7 jours), historique commandes, et re-téléchargement designs dans fenêtre RGPD (7 jours).

2. **Design Generation (FR9-FR18)** : Pipeline de génération complexe - upload jusqu'à 2 photos (JPG/PNG, max 10MB), sélection parmi 5 templates pré-optimisés (Bohème, Moderne, Classique, Vintage, Minimaliste), génération haute résolution (minimum 3000x3000px) via service IA externe, preview avec zoom, tracking itérations (max 3 incluses), et possibilité remplacement photos entre itérations.

3. **Iteration & Feedback (FR19-FR23)** : **Innovation architecturale critique** - système de feedback guidé (checkboxes structurées + texte libre) qui enrichit automatiquement les prompts IA pour itération suivante. Reformulation intelligente des directives utilisateur. Conseils contextuels adaptatifs pour améliorer qualité input.

4. **Payment & Commerce (FR24-FR27)** : Intégration processeur de paiement sécurisé (PCI-DSS Level 1), checkout fluide <1 min, pricing transparent (19.90€ single visible dès landing), confirmation transaction avec webhooks.

5. **Content Delivery (FR28-FR32)** : Delivery automatique par email post-paiement (fichier haute résolution attaché), suppression automatique photos après 7 jours (conformité RGPD), politique confidentialité affichée clairement, re-téléchargement possible pour utilisateurs authentifiés dans fenêtre 7 jours.

6. **Admin & Monitoring (FR33-FR39)** : Dashboard temps réel avec métriques business critiques (revenus, commandes, coûts API, marges, taux conversion), logs complets générations (succès/échec/durée/coût), historique erreurs service IA externe, alertes automatiques email (taux erreur >5%, coûts >seuil, rate limits proches), export données (CSV/Excel).

7. **System Reliability (FR40-FR47)** : Validation robuste inputs (format/taille photos avec messages d'erreur explicites, trim/format emails), retry logic pour service IA externe, indicateurs progression détaillés (progress bar 0-100%, messages rotatifs 5s, temps estimé), healthcheck endpoint monitoring, backups automatiques database, capability admin re-send manuel si delivery échoue.

8. **User Feedback & Analytics (FR48-FR51)** : Survey satisfaction automatique 24h post-achat (3 questions : satisfaction globale, qualité design, recommandation), affichage email support visible (footer + page contact), gestion testimonials admin (CRUD + activation), tracking CAC par canal marketing (Google Ads, Facebook, Organic, Referral).

**Implications architecturales majeures des FRs :**
- Nécessité d'une **architecture événementielle** pour orchestrer workflow complexe (upload → génération → feedback → itération → paiement → delivery)
- **State management sophistiqué** pour tracking progression multi-étapes avec possibilité retour arrière
- **Job queue future** pour migration async (architecture sync MVP, async Growth si >20 gen/jour)
- **Webhook handling** robuste pour paiement et confirmations
- **Cross-device session persistence** (QR Code mobile upload → récupération desktop)

---

**Non-Functional Requirements (38 total):**

Les NFRs définissent 6 piliers architecturaux non-négociables :

**Performance (NFR-P1 à P7) :**
- Génération design **<30 secondes** dans 95% des cas (critique UX - attente perçue)
- Pages web **LCP <2.5s** (Core Web Vitals), FID <100ms, CLS <0.1
- Actions utilisateur feedback visuel **<100ms** (touch/click responsiveness)
- Support **5-10 générations simultanées MVP** sans dégradation (architecture sync)
- Communication temps réel **mise à jour 2-3s** (polling pour progress)
- Images 10MB traitées/validées **<5 secondes**
- Lighthouse Performance **≥90 mobile, ≥95 desktop**

**Security (NFR-S1 à S10) :**
- **HTTPS/TLS 1.3 minimum** (toutes communications)
- Mots de passe hashés **algorithme adaptatif sécurisé** (cost factor ≥12)
- Sessions expiration **7 jours inactivité**
- Paiements via **processeur PCI-DSS Level 1** (zero données bancaires stockées)
- Photos **suppression automatique 7 jours** (RGPD compliance)
- Données personnelles **chiffrées au repos** (email, nom en database)
- Tokens OAuth **jamais exposés côté client**
- **Politique RGPD visible** avant collecte données
- Uploads validés **prévention malware** (format, taille, type MIME)
- Endpoints admin **authentification forte** (pas d'accès public)

**Scalability (NFR-SC1 à SC6) :**
- Architecture MVP sync **10 utilisateurs simultanés** sans dégradation
- **Migration async planifiée** pour 50-100 générations simultanées (Growth phase)
- Database relationnelle **croissance 10K commandes** sans refactoring schema
- **Pics saisonniers** (juillet-septembre mariages, +300% trafic) via auto-scaling Vercel/Railway
- Stockage cloud **100GB photos** (avec suppression 7 jours rotation)
- Service génération IA **retry logic exponentiel** (3 tentatives, backoff 2s→4s→8s)

**Accessibility (NFR-A1 à A7) :**
- Conformité **WCAG 2.1 Level AA** stricte
- Navigation **clavier complète** (Tab, Enter, Esc sur tous éléments interactifs)
- Contrastes couleurs **ratio ≥4.5:1** (texte normal), ≥3:1 (texte large)
- Images **attributs alt descriptifs** (vides pour décoratives)
- Formulaires **labels explicites** associés à chaque input
- Erreurs **annoncées aria-live** pour lecteurs d'écran
- Lighthouse Accessibility **≥90**

**Integration (NFR-I1 à I7) :**
- Service génération IA **taux succès ≥95%** (<5% échecs techniques)
- Processeur paiement **webhooks confirmation asynchrone**
- Service email **délivrabilité ≥98%**
- Erreurs API externes **loggées avec contexte complet** (timestamp, user ID, payload)
- **Mode dégradé** si service IA down (message user + retry automatique)
- OAuth Google **standards OAuth 2.0 + refresh tokens**
- Toutes intégrations **timeout 30s** (prévention blocages)

**Reliability (NFR-R1 à R8) :**
- **Uptime ≥99%** mensuel (~7h downtime/mois acceptable)
- Backups database **automatiques quotidiens** (rétention 30 jours)
- **Zero data loss** commandes payées (transactions ACID garanties)
- Erreurs critiques **alertes email <5 minutes** (taux >5%, coûts seuil, rate limits)
- **Healthcheck endpoint** (/api/health) pour monitoring externe
- Échecs génération IA **récupérables** (retry auto 3×, puis message user)
- Échecs email **re-send manuel admin** via dashboard
- **Logging complet** transactions (générations, paiements, erreurs) pour audit/troubleshooting

**Implications architecturales majeures des NFRs :**
- **Monitoring & Observability** doivent être first-class citizens (pas afterthought)
- **Resilience patterns** obligatoires : retry logic, graceful degradation
- **Performance budget** strict nécessite optimisations frontend (code splitting, lazy loading, image optimization)
- **Security-first architecture** : encryption at rest, secure session management, HTTPS everywhere
- **Scalability migration path** claire : sync MVP → async Growth (job queue + Redis + workers)

---

### Scale & Complexity

**Évaluation de la complexité projet :**

- **Domaine primaire** : Full-Stack Web Application (Frontend Next.js 15 SSR + Backend AdonisJS 6 API + Intégrations externes multiples)

- **Niveau de complexité** : **MEDIUM** (tendance MEDIUM-HIGH en raison de contraintes business)

  **Facteurs de complexité MEDIUM :**
  - Architecture API-First standard (frontend/backend séparés)
  - Intégrations externes gérables (5 services : IA génération, Paiement, Email, OAuth, Stockage)
  - Data model relativement simple (Users, Orders, Generations, Photos temporaires)
  - Pas de multi-tenancy complexe (B2C simple)
  - Pas de real-time collaboration (juste polling pour progress)

  **Facteurs poussant vers MEDIUM-HIGH :**
  - **Innovation UX différenciante** (système feedback itératif = complexité custom)
  - **Contraintes business critiques** (coûts API trackés au centime, marges serrées)
  - **Dépendance service IA externe** (qualité/disponibilité hors contrôle, nécessite resilience)
  - **Timeline serrée + ressources limitées** (4 mois solo dev, objectif 30-40h → architecture pragmatique requise)
  - **First-mover advantage temporel** (fenêtre 6-12 mois avant concurrence → time-to-market critique)

- **Composants architecturaux estimés** : **12-15 composants majeurs**

  **Frontend (Next.js 15) - 5-6 composants :**
  1. Pages & Routing (App Router SSR)
  2. Upload & Media Management
  3. Template Gallery & Selection
  4. Generation Progress & Preview (polling client)
  5. Feedback Loop UI (version simplifiée MVP)
  6. Checkout & Payment Flow

  **Backend (AdonisJS 6 API) - 4 services (architecture pragmatique) :**
  1. AuthService (OAuth Google + Email/Password)
  2. GenerationService (orchestration API IA, retry, logging)
  3. OrderService (CRUD, webhooks paiement)
  4. EmailService (templates, delivery, retry)

  **Infrastructure & Cross-Cutting - 3-4 composants :**
  1. Database (PostgreSQL via Railway)
  2. File Storage (Cloudinary pour photos temporaires)
  3. Monitoring & Alerting (logs, metrics, email alerts)
  4. RGPD Compliance Automation (cron job suppression 7 jours)

---

### Technical Constraints & Dependencies

**Contraintes de ressources (critiques pour architecture) :**

- **Budget infrastructure** : 200€ maximum total
  - ~20-30€ tests API pré-MVP (validation prompts)
  - ~60€ hébergement (Railway $5/mois × 12 mois, Vercel gratuit)
  - ~50€ domaine/SSL
  - → Reste ~70-110€ marge sécurité
  - **Implication architecture** : Hébergement économique obligatoire, pas de services premium

- **Contrainte temps** : 4 mois (février → juin 2026), **objectif réaliste 30-40h dev** (pas 160h), solo developer
  - **Implication architecture** :
    - Scope MVP minimal strict (YAGNI principle)
    - Stack maîtrisée (React + AdonisJS, zéro apprentissage nouveau)
    - Éviter over-engineering
    - Favoriser solutions managed (Vercel, Railway, Stripe)
    - Monolithe modulaire (pas microservices)

- **Contrainte timeline business** : Lancement juin 2026 = timing critique pour saison mariages (pic juillet-septembre)

**Stack technique imposée (maîtrisée) :**

- **Frontend** : Next.js 15 (App Router), React 18, TypeScript (optionnel MVP), Tailwind CSS, shadcn/ui (Radix UI)
- **Backend** : AdonisJS 6, PostgreSQL, Lucid ORM
- **Déploiement** :
  - Frontend : Vercel (auto-deploy, edge CDN, SSL auto, gratuit)
  - Backend : Railway ($5/mois, PostgreSQL included, 10 workers concurrent)

**Dépendances externes critiques :**

1. **Service de génération d'images par IA**
   - Coût : $0.134-$0.24 par image selon résolution
   - **Décision MVP** : Pas de fallback multi-provider (Gemini uptime 99.9%+, acceptable risk)

2. **Processeur de paiement sécurisé** (Stripe)
   - Coût : 2-3% par transaction

3. **Service d'envoi d'emails** (Resend/SendGrid gratuit 3K emails/mois)

4. **Service de stockage cloud** (Cloudinary gratuit 25GB)

5. **OAuth Google** (gratuit, standards OAuth 2.0)

**Contraintes de scalabilité :**

- **Architecture MVP** : Synchrone simple (polling 3s)
  - Supporte 5-10 utilisateurs simultanés
  - **Capacité** : 10 workers × (3600/30) = 1200 gen/heure (largement suffisant)

- **Architecture Growth** : Asynchrone avec BullMQ + Redis (si >20 gen/jour)

---

### Cross-Cutting Concerns Identified

Les 14 préoccupations transversales affectant multiples composants :

1. **Authentication & Authorization** - Dual OAuth Google + Email/Password, sessions 7j
2. **Error Handling & Resilience** - Retry logic, graceful degradation, messages user-friendly
3. **Real-Time Communication** - Polling 3s (MVP), WebSocket (Growth)
4. **File Upload & Storage Management** - Validation, temporary storage, cleanup 7j RGPD
5. **Cost Tracking & Optimization** - Per-request logging, alertes seuils
6. **Payment Processing & Webhooks** - Idempotence, signature validation, transactions ACID
7. **Email Delivery & Notifications** - Templates, retry, délivrabilité ≥98%
8. **Monitoring, Logging & Alerting** - Structured logs JSON, email alerts, healthcheck
9. **RGPD Compliance Automation** - Cron job suppression 7j, audit logs
10. **Accessibility (WCAG 2.1 AA)** - Radix UI, semantic HTML, keyboard navigation
11. **SEO Optimization** - Next.js SSR, meta tags, sitemap
12. **Mobile-First Responsive Design** - <768px priorité, 60-70% trafic attendu
13. **Cross-Device Session Persistence** - Database-backed sessions
14. **Rate Limiting & Quota Management** - Tracking quotas IA, alertes 80% seuil

---

### Décisions Architecturales Issues de l'Analyse Collaborative

Suite à l'analyse multi-perspectives (Party Mode : Winston/Architect, Mary/Analyst, Barry/Solo Dev, Sally/UX Designer), les décisions suivantes affinent le scope architectural MVP :

**Scope MVP Affiné - Features Confirmées (KEEP) :**

- ✅ **Auth Google OAuth + Email/Password** (FR1-FR8) - Conversion boost 30%, 3h dev
- ✅ **Upload photos + génération IA** (FR9-FR18 core) - Cœur produit
- ✅ **Paiement Stripe** (FR24-FR27) - Validation business
- ✅ **Email delivery automatique** (FR28-FR32) - Expérience complète
- ✅ **3-5 templates pré-optimisés** - Différenciation validée empiriquement
- ✅ **Form configuration enrichi avec preview texte** ⭐ **PRIORITÉ HAUTE**
- ✅ **UX "Magie Perçue"** - Micro-interactions émotionnelles (mascotte, confettis, conversationnel)

**Features Déplacées vers Growth Phase :**

- ⏭️ **Système feedback guidé IA-powered** (FR19-FR23) - Complexité 10-15h, remplacé par feedback simple
- ⏭️ **Cross-Device QR Code Upload** - Nice-to-have, économie 4-5h
- ⏭️ **Server-Sent Events** (NFR-P5) - Remplacé par polling 3s (30 min vs 5h dev)
- ⏭️ **Dashboard admin fancy** - Version CSV export suffit MVP

**Justification :**
- Timeline 30-40h réaliste (anti-pattern abandon identifié)
- Ship Fast > Perfect (first-mover 6-12 mois critique)
- "Good Enough Architecture" = Clean code, testable, migration path documentée

---

**Optimisation Coûts API - Insight Critique :**

**Découverte empirique** (Save the Date sœur) : "Premier parfait style, ajustements texte seulement"

**Implication** : Prompts IA excellents. Problème = inputs textuels utilisateur erronés.

**Solution** : **Form enrichi avec preview texte AVANT génération**

**Implémentation (3h dev) :**
1. Champs validés séparés (noms auto-caps, date picker, lieu structuré)
2. **Preview texte complet** - User confirme AVANT d'appeler API (zéro coût gaspillé)
3. Validation inline temps réel

**Impact business calculé :**

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Itérations moyennes | 2.5 | 1.2 | **-52%** |
| Coût API/commande (4K) | 1.38€ | 0.66€ | **-0.72€** |
| Marge pack 49€ | 47.62€ (97.2%) | 48.34€ (98.7%) | **+0.72€** |
| Économie 100 commandes | - | 72€ | = 1 mois Railway |

**ROI** : 3h investies = 52% réduction coûts API permanente.

---

**Architecture Pragmatique "Clean but Simple" :**

**Backend (AdonisJS) - 4 Services Propres :**
```
/app/services/
  ├── AuthService.ts          // OAuth + Email/Password, sessions
  ├── GenerationService.ts    // Orchestration IA, retry 3×, cost logging
  ├── OrderService.ts         // CRUD, webhooks Stripe, transactions ACID
  └── EmailService.ts         // Templates, delivery, retry failed
```

**Frontend (Next.js App Router) :**
```
/app/
  ├── (public)/
  │   ├── page.tsx                    // Landing (SSR SEO)
  │   └── generate/
  │       ├── upload/page.tsx         // Upload photos drag&drop
  │       ├── configure/page.tsx      // Form enrichi + PREVIEW ⭐
  │       ├── generating/page.tsx     // Polling 3s + mascotte
  │       └── result/[id]/page.tsx    // Révélation + confettis + achat
  ├── (auth)/dashboard/page.tsx       // Historique commandes
  └── (admin)/admin/page.tsx          // Logs + CSV export
```

**Infrastructure Simple mais Solide :**

| Composant | Solution | Coût MVP |
|-----------|----------|----------|
| Frontend | Vercel (Hobby) | Gratuit |
| Backend + DB | Railway (Developer) | $5/mois |
| Storage | Cloudinary (Free) | Gratuit |
| Payments | Stripe | 2-3% txn |
| Emails | Resend (Free 3K) | Gratuit |
| Monitoring | Pino + UptimeRobot | Gratuit |

**Total** : $5/mois = 60€/an (sous budget 200€)

---

**UX "Magie Perçue" - Différenciation Émotionnelle Simple (7h dev) :**

1. **IA Mascot Messenger ✨** (2h) - Messages pré-écrits rotatifs, zéro IA générative
   - 10-15 messages chaleureux par étape workflow
   - Rotation aléatoire 5s pendant génération

2. **Form Conversationnel** (1h) - Labels questions vs formulaire administratif
   - "Comment s'appellent les futurs mariés ?" vs "Nom 1 :"
   - Validation bienveillante, mascotte commente

3. **Révélation + Confettis** (1h) - Fade-in + canvas-confetti (3KB)
   - Écran noir → Fade 2s → Confettis 3s
   - Son optionnel désactivable

4. **Feedback Simple Humain** (1h) - Reformulation templates pré-écrits
   - Bouton "Ajuster" (pas "Régénérer")
   - Mascotte reformule : "✨ D'accord, je vais agrandir vos noms. Prêt ?"

5. **Polish Micro-Interactions** (2h) - Transitions fluides, hover states premium

**Résultat** : Différenciation vs Canva **sans** complexité SSE/feedback IA/QR Code.

---

**Stratégie Anti-Abandon & Exécution Pragmatique :**

**Solutions implémentées** (session brainstorming) :
- ✅ **Tiny Milestones** - 8 semaines, 1 victoire visible/semaine
- ✅ **Saturday Rule** - 2h/semaine rituel immuable (9h-11h samedis)
- ✅ **MVP of MVP** - 30-40h au lieu de 160h

**Principe "Good Enough Architecture"** :
- Code fonctionne, explicable en 5 min, migration path documentée
- Pas tests 100% (10% coverage suffit MVP)
- Pas ADRs formels (comments inline)
- Test qualité : "Ça marche? Rapide? Je peux payer? J'ai reçu design?"

**Engagement** : Refactoring autorisé quand 1K€/mois revenue atteint.

---

**Gestion Risques Actualisée :**

**Risque #1 : Service IA indisponible**
- **Décision** : Pas de fallback multi-provider MVP (Gemini 99.9%+ uptime)
- Monitoring quotas + alertes email suffisant

**Risque #2 : Architecture sync bloque workers**
- **Décision** : Sync suffit MVP (10 workers = 1200 gen/h vs 50-100/mois attendu = 0.008% capacité)
- Migration async BullMQ+Redis si analytics montrent >20 gen/jour

**Risque #3 : Itérations moyennes explosent**
- **Mitigation** : Form enrichi preview (52% réduction projetée)
- Dashboard admin monitoring réel, ajustements prompts si nécessaire

---

**Monitoring & Observability MVP (3h dev) :**

1. **Structured Logging** (Pino JSON) - Levels error/warn/info, context enrichi
2. **Cost Tracking Auto** - Log chaque génération avec coût calculé, agrégation quotidienne
3. **Healthcheck** - `/api/health` + UptimeRobot gratuit (ping 5 min)
4. **Email Alerts** (Nodemailer) - Taux erreur >5%, coûts seuil, webhooks failed
5. **Dashboard Admin** - Revenus, commandes, coûts API, marges, export CSV

**Coût** : 0€ (outils gratuits).

---

**Timeline & Roadmap Actualisée :**

| Semaine | Milestone | Heures |
|---------|-----------|--------|
| 1 | Setup infra + Auth (OAuth Google, Email/Password, sessions) | 4h |
| 2 | Upload photos + storage (Cloudinary, validation) | 3h |
| 3 | **Form enrichi + Preview texte** ⭐ (validation, preview confirm) | 3h |
| 4 | Génération IA (API service, retry, polling 3s, mascotte) | 5h |
| 5 | Révélation + UX magie (confettis, fade-in, feedback simple) | 3h |
| 6 | Paiement Stripe (checkout, webhooks, order ACID) | 4h |
| 7 | Email delivery + Admin dashboard basique | 3h |
| 8 | Polish, tests manuels, deploy prod, premiers clients | 3h |

**Total** : 28h dev + 10h buffer bugs/imprévus = **38h réaliste**

**Growth Phase** (post-MVP si break-even 200€ mois 3) :
1. Cross-Device QR Code (4h)
2. Système feedback guidé IA-powered (12h)
3. Migration async BullMQ+Redis (15h)
4. Dashboard admin graphiques (8h)
5. Pack complet 49€ (20h)

---

**Stack Technique Validé :**
- Frontend : Next.js 15 + React 18 + Tailwind + shadcn/ui
- Backend : AdonisJS 6 + PostgreSQL + Lucid ORM
- Deploy : Vercel (frontend) + Railway (backend $5/mois)
- Intégrations : Service génération IA, Stripe, Cloudinary, Resend, OAuth Google

**Patterns Architecturaux MVP :**
- ✅ Sync + Polling 3s (pas job queue, pas SSE)
- ✅ Monolithe modulaire (4 services backend propres)
- ✅ "Good Enough" quality (clean, testable, pas perfect)
- ✅ Migration path documentée (comments `// TODO Growth`)

**Différenciation Préservée :**
- ✅ Form enrichi preview (52% économie API)
- ✅ UX "Magie Perçue" (mascotte, confettis, conversationnel)
- ✅ Templates validés empiriquement (prompts optimisés)

**Features → Growth :**
- ⏭️ Feedback IA-powered, QR Code, SSE, Dashboard fancy

**Objectif Final :** Lancement Juin 2026, first-mover advantage 6-12 mois, architecture évolutive sync → async.

---

## Starter Template Evaluation

### Selected Starter Templates

Suite à l'analyse des besoins projet et de l'infrastructure disponible (VPS Hostinger), voici les starters officiels sélectionnés pour initialiser l'architecture :

#### Frontend: Next.js 16.1.6 (App Router) + shadcn/ui

**Starter officiel :** `create-next-app@latest` (version 16.1.6, publiée le 11 février 2026)

**Commandes d'initialisation :**

```bash
# Initialisation Next.js 16.1.6 avec configuration optimale
npx create-next-app@latest poster-generator-web --yes

cd poster-generator-web

# Configuration shadcn/ui (Radix UI pour accessibilité WCAG 2.1 AA)
npx shadcn@latest init

# Installation composants shadcn/ui de base
npx shadcn@latest add button card form input dialog toast
npx shadcn@latest add select checkbox label textarea
npx shadcn@latest add alert progress skeleton
```

**Décisions architecturales fournies par ce starter :**

✅ **App Router** activé par défaut (SSR pour SEO, Server Components)
✅ **TypeScript** configuré (tsconfig.json strict mode)
✅ **Tailwind CSS** pré-configuré avec design tokens
✅ **Turbopack** activé pour dev (build 10× plus rapide)
✅ **ESLint** + **Prettier** configurés (code quality)
✅ **shadcn/ui** composants Radix UI (accessibilité native WCAG 2.1 AA)

**Optimisations immédiates :**

- `next.config.ts` avec compression images automatique
- **Mobile-First** responsive design (Tailwind breakpoints)
- **Bundle optimization** via code splitting automatique
- **Core Web Vitals** optimisés (LCP <2.5s, FID <100ms, CLS <0.1)

**Vert Sauge Botanique (#2D4A3E) intégré :**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: '#2D4A3E', // Vert Sauge Botanique
        // shadcn/ui génère automatiquement les variants (hover, active, etc.)
      }
    }
  }
}
```

---

#### Backend: AdonisJS 6 (API Kit) + PostgreSQL

**Starter officiel :** `npm init adonisjs@latest` (version 6.18.1, LTS stable)

**Commandes d'initialisation :**

```bash
# Initialisation AdonisJS 6 API Kit
npm init adonisjs@latest -- poster-generator-api \
  --kit=api \
  --db=postgres \
  --auth-guard=session \
  --git-init=false

cd poster-generator-api

# Installation dépendances additionnelles
npm install @adonisjs/lucid @adonisjs/cors @adonisjs/mail
npm install stripe cloudinary
npm install --save-dev pino pino-pretty
```

**Décisions architecturales fournies par ce starter :**

✅ **API-First architecture** (controllers, routes, middleware RESTful)
✅ **Lucid ORM** pré-configuré pour PostgreSQL
✅ **Session-based Auth** avec bcrypt (cost factor 12)
✅ **Validation** avec VineJS (typesafe schemas)
✅ **CORS middleware** pour frontend séparé
✅ **Environment variables** sécurisées (.env + validation)
✅ **Database migrations** système robuste

**Services métier initialisés :**

```typescript
// app/services/
├── AuthService.ts          // OAuth + Email/Password
├── GenerationService.ts    // Orchestration IA, retry 3×
├── OrderService.ts         // CRUD, webhooks Stripe
└── EmailService.ts         // Templates, delivery, retry
```

**Configuration PostgreSQL :**

```env
# .env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_DATABASE=poster_generator
```

---

### Infrastructure & Deployment Strategy

#### Décision Critique : Utilisation du VPS Hostinger Existant

**Spécifications VPS validées :**

- **OS :** Ubuntu 24.04 LTS (support jusqu'à 2029)
- **CPU :** 2 cœurs (largement suffisant pour charge MVP)
- **RAM :** 8GB (confortable pour PostgreSQL + AdonisJS + Nginx)
- **Stockage :** 100GB SSD (capacité ~10K commandes avec photos 7j rotation)
- **Accès :** SSH root complet

**Évaluation capacité :**

✅ **EXCELLENT** pour MVP et Growth phase (jusqu'à 50-100 générations/jour)
✅ **Économie substantielle** : 60€/an vs Railway ($5/mois = 60€/an)
✅ **Contrôle total** : Configuration custom, logs illimités, backups manuels

---

#### Configuration VPS Hostinger (Backend + Database)

**Stack déployée sur VPS :**

1. **Nginx** (reverse proxy + HTTPS)
2. **PM2** (process manager, clustering, auto-restart)
3. **PostgreSQL 16** (database locale)
4. **Certbot** (SSL Let's Encrypt gratuit)

**Commandes setup VPS (une seule fois) :**

```bash
# 1. Connexion SSH
ssh root@your-vps-ip

# 2. Mise à jour système Ubuntu 24.04 LTS
apt update && apt upgrade -y

# 3. Installation Node.js 22 LTS (via nvm pour flexibilité)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# 4. Installation PostgreSQL 16
apt install postgresql postgresql-contrib -y
systemctl start postgresql
systemctl enable postgresql

# 5. Création database + user
sudo -u postgres psql
CREATE DATABASE poster_generator;
CREATE USER poster_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE poster_generator TO poster_user;
\q

# 6. Installation PM2 global
npm install -g pm2

# 7. Installation Nginx
apt install nginx -y
systemctl start nginx
systemctl enable nginx

# 8. Installation Certbot (SSL gratuit)
apt install certbot python3-certbot-nginx -y
```

**Configuration Nginx (/etc/nginx/sites-available/poster-api) :**

```nginx
server {
    listen 80;
    server_name api.poster-generator.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activation config Nginx
ln -s /etc/nginx/sites-available/poster-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL Let's Encrypt (automatique)
certbot --nginx -d api.poster-generator.com
```

**Configuration PM2 (ecosystem.config.cjs) :**

```javascript
module.exports = {
  apps: [{
    name: 'poster-generator-api',
    script: './build/bin/server.js',
    instances: 2, // 2 workers (1 par CPU)
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3333,
      HOST: '0.0.0.0'
    }
  }]
}
```

**Déploiement backend (après chaque update) :**

```bash
# Sur VPS via SSH
cd /var/www/poster-generator-api

# Pull dernières modifications
git pull origin main

# Install dependencies
npm ci --production

# Run migrations
node ace migration:run --force

# Build AdonisJS
node ace build

# Restart PM2
pm2 restart ecosystem.config.cjs
pm2 save
```

---

#### Frontend Deployment : Vercel (Hobby Plan Gratuit)

**Avantages Vercel pour Next.js 16 :**

✅ **Auto-deploy** depuis GitHub (push → live en <2 min)
✅ **Edge CDN mondial** (latence <50ms global)
✅ **SSL automatique** (HTTPS par défaut)
✅ **Preview deployments** (chaque PR = URL unique)
✅ **Core Web Vitals monitoring** (analytics intégrées)
✅ **100GB bandwidth/mois gratuit** (largement suffisant MVP)

**Configuration Vercel (une seule fois) :**

```bash
# Installation Vercel CLI
npm i -g vercel

# Login + link projet
cd poster-generator-web
vercel login
vercel link

# Configuration variables d'environnement
vercel env add NEXT_PUBLIC_API_URL production
# Valeur : https://api.poster-generator.com
```

**Déploiement automatique :**

```bash
# Push to GitHub main branch → Vercel auto-deploy
git push origin main
```

---

### Integration Notes (Frontend ↔ Backend)

#### CORS Configuration (Backend AdonisJS)

```typescript
// config/cors.ts
export default {
  enabled: true,
  origin: [
    'https://poster-generator.vercel.app', // Production
    'http://localhost:3000' // Dev local
  ],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  credentials: true, // Permet sessions cookies
  maxAge: 90
}
```

#### Environment Variables

**Frontend (.env.local) :**

```env
NEXT_PUBLIC_API_URL=https://api.poster-generator.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

**Backend (.env sur VPS) :**

```env
# Server
PORT=3333
HOST=0.0.0.0
NODE_ENV=production

# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=poster_user
DB_PASSWORD=your_secure_password
DB_DATABASE=poster_generator

# Intégrations
STRIPE_SECRET_KEY=sk_live_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
RESEND_API_KEY=re_xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Session
APP_KEY=your_app_key_generated_by_ace
SESSION_DRIVER=cookie
```

---

### Cost Comparison & Justification

#### Coûts Infrastructure MVP (12 mois)

| Service | Solution | Coût Mensuel | Coût Annuel |
|---------|----------|--------------|-------------|
| **Frontend** | Vercel (Hobby) | 0€ | **0€** |
| **Backend + Database** | VPS Hostinger (existant) | 0€ (déjà payé) | **0€** |
| **Storage Photos** | Cloudinary (Free 25GB) | 0€ | **0€** |
| **Emails** | Resend (Free 3K/mois) | 0€ | **0€** |
| **Monitoring** | UptimeRobot + Pino logs | 0€ | **0€** |
| **SSL Certificates** | Let's Encrypt (gratuit) | 0€ | **0€** |
| **Payments** | Stripe | 2-3% par txn | Variable |
| **IA Generation** | Service IA externe | 0.66€/commande | Variable |

**Total Infrastructure Fixe MVP :** **0€/an** 🎉

**Économie vs Railway :** 60€/an (100% du budget infrastructure prévu)

**Budget 200€ réalloué :**

- ~50€ tests API IA pré-MVP (validation prompts, 35-40 générations test)
- ~50€ domaine personnalisé + emails professionnels
- ~100€ marge sécurité / premiers coûts IA génération (150 premières commandes gratuites)

---

### Verification of Technology Versions

**Sources vérifiées (web search effectuées) :**

- **Next.js 16.1.6** - Release 11 février 2026 ([nextjs.org/blog](https://nextjs.org/blog/next-16-1))
- **AdonisJS 6.18.1** - Stable LTS ([docs.adonisjs.com](https://docs.adonisjs.com/guides/introduction))
- **shadcn/ui** - Dernière version compatible Next.js 16 ([ui.shadcn.com](https://ui.shadcn.com))
- **PostgreSQL 16** - LTS actuel Ubuntu 24.04 ([postgresql.org](https://www.postgresql.org))
- **Node.js 22 LTS** - Dernière version LTS ([nodejs.org](https://nodejs.org))

---

### Summary : Starter Template Decisions

**Décisions Architecturales Fournies par les Starters :**

✅ **Frontend Framework :** Next.js 16.1.6 App Router (SSR, Server Components)
✅ **UI Components :** shadcn/ui (Radix UI, WCAG 2.1 AA native)
✅ **Styling :** Tailwind CSS + design tokens personnalisés
✅ **Backend Framework :** AdonisJS 6 API Kit (RESTful, modular)
✅ **Database :** PostgreSQL 16 + Lucid ORM
✅ **Authentication :** Session-based (bcrypt cost 12) + OAuth Google
✅ **Deployment :** Vercel (frontend) + VPS Hostinger (backend)
✅ **Process Management :** PM2 clustering (2 workers)
✅ **Reverse Proxy :** Nginx + SSL Let's Encrypt
✅ **Development :** TypeScript strict, ESLint, Turbopack

**Décisions Restantes pour Step 4 :**

- State management approach (frontend)
- API design patterns spécifiques (RESTful déjà choisi)
- Caching strategy (Redis future, memory cache MVP?)
- File upload handling détaillé
- Error handling standards
- Monitoring & logging implementation précise
- Testing strategy

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation) :**

Les décisions suivantes sont **obligatoires** pour démarrer l'implémentation MVP :

1. **Docker + GHCR CI/CD** - Environnement reproductible dev/prod
2. **PostgreSQL 16 VPS local** - Persistence données
3. **Cloudinary direct upload** - Upload photos (signed URLs, progress bar)
4. **VineJS validation centralisée** - Sécurité inputs
5. **Ally Google OAuth + Cookie sessions** - Authentification
6. **Stripe webhooks idempotents** - Paiements (table stripe_events)
7. **Error codes standardisés** - Communication frontend/backend
8. **Discord webhooks monitoring** - Alertes temps réel mobile

**Important Decisions (Shape Architecture) :**

9. **Zustand state management** - State client (persist localStorage)
10. **React Hook Form + Zod** - Forms typesafe validation
11. **Memory cache in-process** - Performance légère (migration Redis Growth)
12. **Pino structured logging** - Debugging/analytics (events JSON)
13. **AdonisJS Rate Limiter** - Protection abus (ajusté MVP : 10 login attempts, 5 gen/min)

**Deferred Decisions (Growth Phase) :**

14. **Redis caching** - Quand migration async BullMQ (si >20 gen/jour)
15. **Sentry error tracking** - Quand budget 50€/mois disponible
16. **Backup off-site S3/Backblaze** - Semaine 9-10 (5€/mois, 10 min setup)
17. **Crons automation** - Manuel MVP (dashboard buttons), automatiser Growth
18. **Error codes extraction** - Inline MVP, fichier séparé quand 10+ utilisés

---

### 1. Data Architecture

#### 1.1 - Caching Strategy

**Décision :** Memory Cache In-Process (Map<string, any>)

**Rationale :**
- Zero configuration, templates emails/config légers
- Migration Redis triviale (Growth phase BullMQ)
- **Note importante :** Per-worker cache avec PM2 clustering. Sessions = cookies donc OK.

**Implementation :**
```typescript
// /app/services/CacheService.ts
class CacheService {
  private cache = new Map<string, { value: any; expires: number }>()
  set(key: string, value: any, ttl: number = 3600) { /* ... */ }
  get(key: string): any | null { /* ... */ }
}
```

**Affects :** EmailService (templates), ConfigService

---

#### 1.2 - File Upload & Storage

**Décision :** Cloudinary Direct Upload avec Signed URLs

**Rationale :**
- Upload direct browser → Cloudinary (zero transit backend)
- Progress bar précise (XMLHttpRequest.upload.onprogress)
- 25GB gratuit = ~2500 photos MVP

**Flow :**
1. Frontend request signed URL backend
2. Upload direct Cloudinary avec progress
3. Backend reçoit publicId pour génération

**UX Note (Sally) :**
- Message onboarding : *"📱 Finalisez votre création sur cet appareil. Vos photos restent sur ce navigateur uniquement."*
- Adresse limitation localStorage cross-device (5 min setup, évite frustration)

**Affects :** UploadForm, GenerationService, RGPD cleanup

---

#### 1.3 - Data Validation

**Décision :** VineJS Schemas Centralisés (/app/validators/)

**Rationale :**
- Natif AdonisJS 6, typesafe, réutilisable
- Messages français customisables
- DRY principle

**Structure :**
```typescript
// /app/validators/CreateOrderValidator.ts
export const createOrderValidator = vine.compile(
  vine.object({
    template: vine.enum(['boheme', 'moderne', 'classique', 'vintage', 'minimaliste']),
    photos: vine.array(vine.string().url()).minLength(1).maxLength(2),
    config: vine.object({ /* ... */ })
  })
)
```

**Affects :** Tous controllers API, tests unitaires

---

### 2. Authentication & Security

#### 2.1 - OAuth Google

**Décision :** Ally Google Provider (AdonisJS officiel)

**Setup :** 15 min, gère refresh tokens automatiquement

**Flow :** `/auth/google` → Google consent → callback → session créée

---

#### 2.2 - Session Management

**Décision :** Cookie-Based Encrypted (7 jours expiration)

**Configuration :**
```typescript
{
  driver: 'cookie',
  age: '7 days',
  cookie: {
    httpOnly: true,    // XSS protection
    secure: true,      // HTTPS only
    sameSite: 'lax'    // CSRF protection
  }
}
```

**Rationale :** Stateless, compatible PM2 multi-workers, 4KB suffit (user_id, email, role)

---

#### 2.3 - Rate Limiting

**Décision :** AdonisJS Limiter Middleware

**Limites ajustées MVP (Party Mode - Sally) :**
- Login : **10 attempts/15min** (vs 5, typos arrivent)
- Generate : **5/min** (vs 3, testing itérations)
- Register : 3/hour (anti-spam)

**Rationale MVP :** Low traffic, meilleure UX early adopters, durcir si abus observés

**Error response standardisée :**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Trop de tentatives. Réessayez dans 2 minutes.",
    "retryAfter": 120
  }
}
```

**Documentation :** Messages clairs indiquent que rate limiter = source erreur

---

### 3. API & Communication

#### 3.1 - Response Format Standardisé

**Décision :** Format unifié avec Error Codes Constants

**Success :**
```json
{ "success": true, "data": { /* payload */ } }
```

**Error :**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Le fichier doit être JPG ou PNG",
    "details": { /* context */ }
  }
}
```

**Error Codes (Party Mode - Barry : inline MVP, extraire Growth) :**
```typescript
// Inline dans controllers MVP, extraire /app/exceptions/ErrorCodes.ts quand 10+ utilisés
const ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
}
```

**Rationale Barry :** MVP utilise 5-6 codes max, pas besoin fichier séparé. Économie 30 min.

---

#### 3.2 - Webhook Handling (Stripe)

**Décision :** Signature Validation + Table Idempotence

**Migration :**
```sql
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY,
  stripe_event_id VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  processed_at TIMESTAMP
);
```

**Pattern idempotence :**
```typescript
const existing = await StripeEvent.findBy('stripe_event_id', event.id)
if (existing?.processed) return { received: true }
// Process payment...
await StripeEvent.create({ stripe_event_id: event.id, processed: true })
```

**Affects :** OrderService, EmailService, PaymentService

---

#### 3.3 - Logging Structure

**Décision :** Pino Structured JSON (Event-Based)

**Levels :**
- `error` : Échecs critiques (AI down, payment failed)
- `warn` : Rate limits, retry attempts, quotas 80%
- `info` : Générations success, paiements, emails sent
- `debug` : Dev only (disabled production)

**Format :**
```json
{
  "level": "info",
  "event": "generation_succeeded",
  "userId": 123,
  "orderId": "uuid",
  "cost": 0.66,
  "duration": 28000
}
```

**Analytics queries :**
```bash
# Coût total aujourd'hui
grep '"event":"generation_succeeded"' logs/app.log | jq -s 'map(.cost) | add'
```

---

### 4. Frontend Architecture

#### 4.1 - State Management

**Décision :** Zustand (Lightweight Store avec Persist)

**Rationale :** Développeur connaît déjà, 1KB bundle, persist localStorage natif

**Stores :**
```typescript
// useUserStore - Session user (persist)
// useGenerationStore - Form multi-étapes (photos, config, step)
```

**UX Note (Sally) :** localStorage = limitation cross-device. Message onboarding adresse cela.

---

#### 4.2 - Form Handling

**Décision :** React Hook Form + Zod

**Rationale :** shadcn/ui natif, validation temps réel, typesafe

**Schema example :**
```typescript
const configFormSchema = z.object({
  nom1: z.string().min(2).max(50).transform(capitalize),
  nom2: z.string().min(2).max(50).transform(capitalize),
  date: z.date().min(new Date()),
  lieu: z.string().min(3).max(100)
})
```

**Preview temps réel :** Form watch() values → preview texte avant génération (52% économie API)

---

#### 4.3 - Image Upload UX

**Décision :** react-dropzone + Cloudinary Direct Upload + Progress

**Features :**
- Drag & drop (validation client format/taille)
- Preview instant (URL.createObjectURL)
- Progress bar précise (XMLHttpRequest.upload.onprogress)

**Pattern :**
```typescript
xhr.upload.onprogress = (e) => {
  setProgress((e.loaded / e.total) * 100)
}
```

---

#### 4.4 - Component Architecture

**Décision :** Mix Server Components (SEO) / Client Components (Interactif)

**Structure :**
- Pages (`page.tsx`) : Server (SSR SEO)
- Forms, Polling, Animations : Client (`'use client'`)

**Optimisations :** Code splitting auto, Server Components = zero JS client

---

### 5. Infrastructure & Deployment

#### 5.1 - CI/CD Pipeline

**Décision :** Docker + GitHub Actions + GHCR + Zero-Downtime

**Workflow :**
1. Push GitHub main → Actions build image
2. Push GHCR (ghcr.io/username/api:latest)
3. VPS pull + `docker-compose up -d --no-deps api`
4. PM2 reload workers un par un (zero downtime)

**Rollback :** `docker tag ghcr.io/username/api:PREVIOUS_SHA latest` (10 secondes)

**Party Mode Note (Barry) :**
- **Crons manuels MVP** : Dashboard buttons "Run Backup", "Run RGPD Cleanup"
- Automatiser crons semaine 9-10 (économie 1-2h timeline MVP)

---

#### 5.2 - Database

**Décision :** PostgreSQL 16 Local VPS (Docker service)

**Rationale :**
- 0€ à vie (100GB = ~80K commandes)
- Latency <1ms (local)
- Always-on (zero cold start)

**Connection pooling :**
```typescript
pool: { min: 2, max: 10 } // Suffisant 5-10 users simultanés MVP
```

---

#### 5.3 - Monitoring & Alerting

**Décision :** UptimeRobot + Pino Logs + **Discord Webhooks** (Party Mode validé)

**Discord Setup (15 min) :**

**Serveur :** "Poster Generator Monitoring"

**Channels :**
- 🔴 **#errors** (@Aldo ping) - Erreurs critiques
- 🟡 **#warnings** (no ping) - Warnings non-bloquants
- 💰 **#payments** - Chaque paiement success
- 🎨 **#generations** - Générations success avec preview image
- 📊 **#daily-summary** - Métriques quotidiennes

**Code pattern :**
```typescript
// /app/services/DiscordService.ts
async sendAlert(level: 'error' | 'warn', message: string, context?: any) {
  try {
    await fetch(env.get('DISCORD_WEBHOOK_' + level.toUpperCase()), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: level === 'error' ? '@Aldo 🚨' : '',
        embeds: [{
          title: (level === 'error' ? '❌ ' : '⚠️ ') + message,
          color: level === 'error' ? 15158332 : 16776960,
          fields: Object.entries(context || {}).map(([k, v]) => ({
            name: k, value: String(v), inline: true
          })),
          timestamp: new Date()
        }]
      })
    })
  } catch (error) {
    logger.error({ event: 'discord_webhook_failed', originalMessage: message })
  }
}
```

**Intégration services :**
```typescript
// GenerationService
logger.error({ event: 'generation_failed', orderId, error })
await DiscordService.sendAlert('error', `Generation failed: ${error.message}`, { orderId, userId })

// PaymentService
await DiscordService.sendAlert('info', 'Paiement reçu !', { amount: order.amount, template: order.template })
```

**Daily summary (cron ou manual) :**
```typescript
async sendDailySummary() {
  const stats = await getAnalytics()
  await fetch(DISCORD_WEBHOOK_METRICS, {
    body: JSON.stringify({
      embeds: [{
        title: '📊 Daily Summary',
        fields: [
          { name: '💰 Revenus', value: stats.revenue + '€' },
          { name: '🎨 Générations', value: stats.generations },
          { name: '❌ Erreurs', value: stats.errors },
          { name: '📈 Coût API moyen', value: stats.avgApiCost + '€' },
          { name: '📉 Marge moyenne', value: stats.avgMargin + '%' }
        ]
      }]
    })
  })
}
```

**Benefits (Party Mode consensus) :**
- ✅ Mobile notifications temps réel (DX meilleur qu'emails)
- ✅ Rich embeds (images, code blocks, fields structurés)
- ✅ Searchable history Discord
- ✅ 0€, setup 15 min (vs 45 min email postfix)
- ✅ Channels thématiques = organisation visuelle
- ✅ Fallback : Logs file toujours écrit (SSH access)

**Migration Growth :** Discord Bot custom (slash commands `/stats`, `/retry {orderId}`) si besoin contrôle avancé

**Affects :** Tous services backend, admin dashboard analytics, developer experience

---

#### 5.4 - Backup Strategy

**Décision :** pg_dump Quotidien Local (30j rétention)

**Cron (Party Mode - Barry : manuel MVP, automatiser Growth) :**

**MVP Semaine 1-8 :** Dashboard admin bouton "Backup Database Now"
```typescript
// Admin controller
async backupDatabase() {
  await exec('docker exec postgres pg_dump -U poster_user poster_generator | gzip > /backups/db-$(date +%Y%m%d).sql.gz')
}
```

**Growth Semaine 9+ :** Cron automatique quotidien 2h du matin

**Script :**
```bash
#!/bin/bash
docker exec postgres pg_dump -U poster_user poster_generator | gzip > /backups/db-$(date +%Y%m%d).sql.gz
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

**Party Mode Note (Winston) :**
- ⚠️ **Backup off-site recommandé Growth** (semaine 9-10)
- S3/Backblaze B2 : 5€/mois, 10 min setup
- VPS crash catastrophique (fire, flood, ransomware) = risque ultra-rare mais impact total
- Pas critique MVP, mais peace of mind long-term

**Restore procedure :**
```bash
gunzip < /backups/db-20260215.sql.gz | docker exec -i postgres psql -U poster_user poster_generator
# Downtime: ~2 minutes
```

---

#### 5.5 - RGPD Compliance Automation

**Décision :** Cleanup 7 jours (Cloudinary + DB Anonymization)

**AdonisJS Command :**
```typescript
// /commands/CleanupRgpd.ts
export default class CleanupRgpd extends BaseCommand {
  static commandName = 'cleanup:rgpd'

  async run() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const oldOrders = await Order.query()
      .where('created_at', '<', sevenDaysAgo)
      .whereNotNull('cloudinary_photo_ids')

    for (const order of oldOrders) {
      // Delete photos Cloudinary
      if (order.cloudinary_photo_ids?.length > 0) {
        await cloudinary.api.delete_resources(order.cloudinary_photo_ids)
      }

      // Anonymize personal data (garde metadata business)
      order.cloudinary_photo_ids = null
      order.user_email = '[deleted]'
      order.user_name = '[deleted]'
      await order.save()

      logger.info({ event: 'rgpd_cleanup', orderId: order.id })
      await DiscordService.sendAlert('info', `RGPD cleanup order ${order.id}`)
    }
  }
}
```

**Execution (Party Mode - Barry : manuel MVP) :**

**MVP :** Dashboard admin bouton "Run RGPD Cleanup Now" → `node ace cleanup:rgpd`

**Growth :** Cron quotidien 3h du matin

**Audit logs :**
```bash
grep '"event":"rgpd_cleanup"' logs/app.log | jq -r '[.orderId, .createdAt] | @csv' > rgpd-audit.csv
```

---

### Decision Impact Analysis

#### Implementation Sequence (Ordre Optimal)

**Phase 1 : Fondations Infrastructure (Semaine 1, 4h)**
1. Setup Docker + docker-compose (postgres + api)
2. GitHub Actions CI/CD (build + push GHCR)
3. VPS Nginx + SSL Let's Encrypt
4. Discord server + webhooks setup
5. Healthcheck endpoint + UptimeRobot

**Phase 2 : Backend Core (Semaine 2-3, 8h)**
6. VineJS validators centralisés
7. Error codes inline + ApiResponse helper
8. Pino structured logging + DiscordService integration
9. AdonisJS Rate Limiter (10 login, 5 gen/min)
10. Ally Google OAuth + Cookie sessions
11. Stripe webhook idempotence (stripe_events table)

**Phase 3 : Intégrations Externes (Semaine 4, 5h)**
12. Cloudinary signed URLs (GenerationService)
13. Stripe checkout + webhooks
14. Email delivery (Resend templates)
15. AI generation service wrapper (retry logic)

**Phase 4 : Frontend (Semaine 5-6, 10h)**
16. Zustand stores (UserStore, GenerationStore)
17. React Hook Form + Zod schemas
18. react-dropzone + Cloudinary direct upload + progress
19. Server/Client components structure
20. shadcn/ui integration (forms, dialogs, toasts)
21. Message onboarding localStorage limitation

**Phase 5 : Features Business (Semaine 7, 7h)**
22. Form enrichi + preview texte temps réel
23. Polling 3s génération progress
24. UX "Magie Perçue" (confetti, mascotte messages)
25. Dashboard user (historique commandes)
26. Admin dashboard basique (analytics, manual backup/RGPD buttons, CSV export)

**Phase 6 : Polish & Production (Semaine 8, 4h)**
27. Tests manuels end-to-end
28. Documentation deployment
29. Discord alerts configuration finale
30. Deploy production + premiers clients

**Total : ~38h (timeline réaliste validée)**

**Party Mode Optimizations Applied :**
- Crons manuels MVP (semaine 1-8) → automatiser Growth (semaine 9+) : **-1.5h**
- Error codes inline MVP → extraire Growth : **-0.5h**
- **Net gain : 2h** (36h achievable)

---

#### Cross-Component Dependencies

**Docker → Tout** - Bloque déploiement, CI/CD, backups

**PostgreSQL VPS → Backend** - Bloque models, migrations

**Cloudinary Direct Upload → Frontend + Backend** - UploadForm (frontend) + Signed URLs (backend) + RGPD cleanup

**VineJS Validators → API Endpoints** - Tous POST/PUT endpoints

**Zustand → Frontend State** - Forms multi-étapes, user session

**React Hook Form + Zod → Forms** - ConfigForm, AuthForms

**Stripe Webhooks Idempotence → Payments** - Order finalization, email delivery (CRITIQUE : évite double-charge)

**Pino + Discord → Monitoring** - Tous services, admin dashboard, alertes

**Cookie Sessions → Auth** - Login, protected routes, user context

**AdonisJS Rate Limiter → API Security** - Login, generation, webhooks exclus

---

#### Migration Paths Documentées (Growth Phase)

**Memory Cache → Redis :**
```typescript
import Redis from 'ioredis'
const redis = new Redis()
// API identique : set(key, value, ttl), get(key)
```
**Effort :** 1h | **Trigger :** Migration async BullMQ

---

**Sync Polling → Async BullMQ + Redis :**
```typescript
import { Queue, Worker } from 'bullmq'
const queue = new Queue('generations', { connection: redis })
await queue.add('generate', { orderId })
new Worker('generations', async (job) => await GenerationService.generate(job.data.orderId))
```
**Effort :** 15h | **Trigger :** >20 générations/jour

---

**PostgreSQL VPS → Neon (si migration VPS) :**
```bash
pg_dump postgresql://localhost/poster_generator > backup.sql
psql $NEON_URL < backup.sql
```
**Effort :** 15 min downtime

---

**Discord → Discord + Email Backup (critiques only) :**
```typescript
if (context.critical) {
  await sendEmail(message, context) // Top 3 erreurs uniquement
}
```
**Effort :** 1h | **Trigger :** Besoin redondance

---

**Crons Manuel → Automatisés :**
```bash
# /etc/cron.daily/backup-postgres.sh
# /etc/cron.daily/rgpd-cleanup.sh
```
**Effort :** 30 min | **Trigger :** Semaine 9-10 (automatisation confort)

---

**Backup Local → Backup Off-site S3 :**
```bash
# Ajouter à cron backup
aws s3 cp /backups/db-$DATE.sql.gz s3://poster-backups/
```
**Effort :** 10 min | **Coût :** 5€/mois | **Trigger :** Semaine 9-10 (peace of mind)

---

## Synthèse Finale : Architecture MVP Validée ✅

**Toutes décisions validées (Party Mode reviewed) :**

**Catégorie 1 - Data Architecture :**
1. ✅ Caching : Memory cache in-process
2. ✅ File Upload : Cloudinary direct upload (signed URLs, progress)
3. ✅ Validation : VineJS schemas centralisés

**Catégorie 2 - Authentication & Security :**
1. ✅ OAuth : Ally Google Provider
2. ✅ Sessions : Cookie encrypted (7j, httpOnly/secure/sameSite)
3. ✅ Rate Limiting : AdonisJS Limiter (10 login, 5 gen/min - MVP permissif)

**Catégorie 3 - API & Communication :**
1. ✅ Response Format : Standardisé { success, data/error, code }
2. ✅ Webhooks Stripe : Signature validation + stripe_events idempotence
3. ✅ Logging : Pino JSON structuré (event-based)

**Catégorie 4 - Frontend Architecture :**
1. ✅ State Management : Zustand (persist localStorage + onboarding message limitation)
2. ✅ Forms : React Hook Form + Zod typesafe
3. ✅ Upload : react-dropzone + Cloudinary direct + progress bar
4. ✅ Components : Mix Server (SEO) / Client (interactif)

**Catégorie 5 - Infrastructure & Deployment :**
1. ✅ CI/CD : Docker + GitHub Actions + GHCR (zero downtime)
2. ✅ Database : PostgreSQL 16 local VPS
3. ✅ Monitoring : UptimeRobot + Pino + **Discord webhooks** (temps réel mobile)
4. ✅ Backups : pg_dump manuel MVP (bouton dashboard), cron Growth, off-site semaine 9-10
5. ✅ RGPD : Cleanup 7j manuel MVP (bouton dashboard), cron Growth

**Party Mode Optimizations Applied :**
- Discord webhooks remplace email alerts (Barry, Winston, Mary, Sally)
- Crons manuels MVP → automatiser Growth (Barry)
- Error codes inline MVP → extraire Growth (Barry)
- Rate limits permissifs MVP (Sally)
- Message onboarding localStorage (Sally)
- Backup off-site recommandé Growth (Winston)

**Timeline Final :**
- MVP Core : **36h** (optimisé de 38h)
- Growth Polish : **6h** (semaine 9-10 : crons, error codes extraction, backup off-site)
- **Total : 42h** avec marge confort

**Architecture MVP Finalisée - Prête pour Implémentation** 🎯

**Breakeven :** 11 commandes (18.64€ marge/commande)

**First-mover window :** 6-12 mois

**Lancement target :** Juin 2026 (saison mariages juillet-septembre)

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified : 18 zones de décisions**

Sans ces patterns, différents agents AI pourraient créer du code incompatible :
- Agent #1 crée `users` table → Agent #2 crée `Orders` table → Chaos total
- Agent #1 utilise `userId` JSON → Agent #2 utilise `user_id` → Frontend breaks
- Agent #1 met tests dans `__tests__/` → Agent #2 co-located → Aucune cohérence

**Tous les patterns ci-dessous sont OBLIGATOIRES pour tous les agents AI travaillant sur ce projet.**

---

### 1. Naming Patterns

#### 1.1 - Database Naming Conventions

**Tables :** `snake_case` plural

```sql
-- ✅ CORRECT
users
orders
generations
stripe_events
cloudinary_photos

-- ❌ INCORRECT
Users          -- PascalCase
user           -- Singular
stripeEvents   -- camelCase
```

**Colonnes :** `snake_case`

```sql
-- ✅ CORRECT
user_id
created_at
cloudinary_photo_ids
stripe_payment_intent_id
is_active

-- ❌ INCORRECT
userId                    -- camelCase
CreatedAt                 -- PascalCase
cloudinary_photoIds       -- Mixed case
```

**Foreign Keys :** `{table}_id` format

```sql
-- ✅ CORRECT
user_id REFERENCES users(id)
order_id REFERENCES orders(id)

-- ❌ INCORRECT
fk_user      -- Prefix naming
userId       -- camelCase
```

**Indexes :** `idx_{table}_{columns}` format

```sql
-- ✅ CORRECT
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_users_email ON users(email);

-- ❌ INCORRECT
CREATE INDEX orders_user_id_index ...     -- Suffix naming
CREATE INDEX user_email ...                -- No prefix
```

**Lucid ORM Auto-Mapping :**

```typescript
// ✅ CORRECT - Lucid auto-converts
class Order extends BaseModel {
  @column()
  public userId: number        // → user_id en DB

  @column.dateTime()
  public createdAt: DateTime   // → created_at en DB

  @column()
  public cloudinaryPhotoIds: string[]  // → cloudinary_photo_ids en DB
}

// Migration
table.integer('user_id').unsigned().references('users.id')
table.timestamp('created_at')
```

---

#### 1.2 - API Naming Conventions

**Endpoints :** RESTful, plural resources

```typescript
// ✅ CORRECT
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
DELETE /api/orders/:id

GET    /api/users/:userId/orders     // Nested resources
POST   /api/webhooks/stripe           // Singular service name

// ❌ INCORRECT
GET    /api/order              -- Singular
GET    /api/orders/{id}        -- Curly braces
GET    /api/getOrders          -- Verb in endpoint
POST   /api/webhook-stripe     -- Kebab case
```

**Route Parameters :** `:paramName` format (AdonisJS standard)

```typescript
// ✅ CORRECT
router.get('/orders/:id', [OrdersController, 'show'])
router.get('/orders/:orderId/generations/:genId', ...)

// ❌ INCORRECT
router.get('/orders/{id}', ...)        -- Curly braces
router.get('/orders/[id]', ...)        -- Square brackets
```

**Query Parameters :** `camelCase`

```typescript
// ✅ CORRECT
GET /api/orders?userId=123&status=paid&createdAfter=2026-01-01

// ❌ INCORRECT
GET /api/orders?user_id=123           -- snake_case
GET /api/orders?UserId=123            -- PascalCase
```

---

#### 1.3 - Files & Folders Naming

**Frontend (Next.js 16 App Router) :**

```
/app/
  ├── (public)/
  │   ├── page.tsx                    ✅ lowercase (Next.js pages)
  │   └── generate/
  │       ├── upload/
  │       │   ├── page.tsx            ✅ lowercase
  │       │   └── UploadForm.tsx      ✅ PascalCase (components)
  │       └── configure/
  │           ├── page.tsx
  │           └── ConfigForm.tsx
  │
  └── components/
      ├── ui/
      │   ├── button.tsx              ✅ lowercase (shadcn/ui convention)
      │   ├── dialog.tsx
      │   └── toast.tsx
      ├── forms/
      │   ├── PhotoUpload.tsx         ✅ PascalCase (custom components)
      │   └── ConfigForm.tsx
      └── layout/
          └── Header.tsx

/stores/
  ├── useUserStore.ts                 ✅ camelCase (hooks)
  └── useGenerationStore.ts

// ❌ INCORRECT
/app/UploadPage.tsx                   -- PascalCase page
/components/photo-upload.tsx          -- kebab-case
/components/PhotoUpload.jsx           -- .jsx (use .tsx)
```

**Backend (AdonisJS 6) :**

```
/app/
  ├── controllers/
  │   ├── OrdersController.ts         ✅ PascalCase + Controller suffix
  │   ├── GenerationsController.ts
  │   └── WebhooksController.ts
  │
  ├── models/
  │   ├── Order.ts                    ✅ PascalCase singular
  │   ├── User.ts
  │   └── Generation.ts
  │
  ├── services/
  │   ├── GenerationService.ts        ✅ PascalCase + Service suffix
  │   ├── DiscordService.ts
  │   └── CloudinaryService.ts
  │
  └── validators/
      └── CreateOrderValidator.ts     ✅ PascalCase + Validator suffix

// ❌ INCORRECT
/app/controllers/orders-controller.ts  -- kebab-case
/app/models/order.ts                   -- lowercase
/app/services/generationService.ts     -- camelCase
```

---

#### 1.4 - TypeScript Naming

**Interfaces :** PascalCase, **no `I` prefix**

```typescript
// ✅ CORRECT
interface User {
  id: number
  email: string
}

interface OrderConfig {
  template: string
  photos: string[]
}

// ❌ INCORRECT
interface IUser { ... }               -- I prefix (old convention)
interface user { ... }                -- lowercase
interface order_config { ... }       -- snake_case
```

**Types :** PascalCase

```typescript
// ✅ CORRECT
type OrderStatus = 'pending' | 'paid' | 'completed'
type ErrorCode = 'VALIDATION_FAILED' | 'PAYMENT_FAILED'

// ❌ INCORRECT
type orderStatus = ...                -- camelCase
type order_status = ...               -- snake_case
```

**Enums :** PascalCase

```typescript
// ✅ CORRECT
enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Completed = 'completed'
}

enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

// ❌ INCORRECT
enum orderStatus { ... }              -- camelCase
enum ORDER_STATUS { ... }             -- UPPER_SNAKE
```

**Constants :** UPPER_SNAKE_CASE

```typescript
// ✅ CORRECT
const MAX_PHOTOS = 2
const RGPD_RETENTION_DAYS = 7
const API_TIMEOUT_MS = 30000

const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
}

// ❌ INCORRECT
const maxPhotos = 2                   -- camelCase
const MaxPhotos = 2                   -- PascalCase
const max_photos = 2                  -- lowercase snake
```

**Functions & Variables :** camelCase

```typescript
// ✅ CORRECT
function getUserById(id: number) { ... }
const userData = await fetchUser()
const isLoading = false

// ❌ INCORRECT
function GetUserById() { ... }        -- PascalCase
function get_user_by_id() { ... }     -- snake_case
const user_data = ...                 -- snake_case
```

---

### 2. Structure Patterns

#### 2.1 - Tests Location

**Convention :** Co-located (`.test.ts` à côté du fichier source)

```
/app/services/
  ├── GenerationService.ts
  ├── GenerationService.test.ts       ✅ Co-located
  ├── DiscordService.ts
  └── DiscordService.test.ts

/app/components/forms/
  ├── PhotoUpload.tsx
  └── PhotoUpload.test.tsx            ✅ Co-located

// ❌ INCORRECT
/tests/services/GenerationService.test.ts   -- Séparé root
/app/services/__tests__/...                 -- Dossier séparé
```

**Naming :** `{FileName}.test.ts` ou `{FileName}.spec.ts`

```typescript
// ✅ CORRECT
GenerationService.test.ts
PhotoUpload.test.tsx

// ❌ INCORRECT
GenerationService.tests.ts           -- Plural
test-generation-service.ts           -- Prefix
generation-service-test.ts           -- Suffix kebab
```

---

#### 2.2 - Components Organization

**Convention :** By Type (technical layer)

```
/app/components/
  ├── ui/                   ✅ shadcn/ui components
  │   ├── button.tsx
  │   ├── dialog.tsx
  │   ├── form.tsx
  │   ├── input.tsx
  │   └── toast.tsx
  │
  ├── forms/                ✅ All forms together
  │   ├── LoginForm.tsx
  │   ├── UploadForm.tsx
  │   ├── ConfigForm.tsx
  │   └── CheckoutForm.tsx
  │
  ├── displays/             ✅ Display components
  │   ├── ProgressDisplay.tsx
  │   ├── OrderCard.tsx
  │   └── GenerationPreview.tsx
  │
  └── layout/               ✅ Layout components
      ├── Header.tsx
      ├── Footer.tsx
      └── Sidebar.tsx

/hooks/                     ✅ Custom hooks
  ├── useAuth.ts
  ├── useGeneration.ts
  └── useStripe.ts

// ❌ INCORRECT (by feature)
/features/
  ├── auth/
  │   ├── LoginForm.tsx
  │   └── useAuth.ts
  └── generation/
      ├── UploadForm.tsx
      └── useGeneration.ts
```

**Rationale :** MVP petit (~15 components), réutilisabilité prime, Next.js App Router déjà organize by-feature (`/app/generate/`, `/app/dashboard/`)

---

#### 2.3 - Backend Services Organization

**Convention :** Flat `/app/services/` (pas de sous-dossiers)

```
/app/services/
  ├── AuthService.ts                 ✅ Flat structure
  ├── GenerationService.ts
  ├── OrderService.ts
  ├── EmailService.ts
  ├── DiscordService.ts
  └── CloudinaryService.ts

// ❌ INCORRECT (nested)
/app/services/
  ├── auth/
  │   └── AuthService.ts
  └── generation/
      └── GenerationService.ts
```

**Rationale :** 6-8 services total MVP, flat = navigation rapide, évite over-engineering

---

### 3. Format Patterns

#### 3.1 - API Response Formats

**Convention :** Standardisé `{ success, data/error, code }`

**Success Response :**

```typescript
// ✅ CORRECT
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid-123",
      "status": "pending",
      "amount": 19.90,
      "createdAt": "2026-02-15T10:30:00.000Z"
    }
  }
}

// ❌ INCORRECT
{
  "order": { ... }                    -- Direct response (no wrapper)
}

{
  "status": "success",                -- Different wrapper format
  "result": { ... }
}
```

**Error Response :**

```typescript
// ✅ CORRECT
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Le fichier doit être JPG ou PNG",
    "details": {
      "field": "photo",
      "received": "application/pdf",
      "expected": ["image/jpeg", "image/png"]
    }
  }
}

// ❌ INCORRECT
{
  "error": "Validation failed"        -- String error (no code)
}

{
  "success": false,
  "message": "Error"                  -- Missing error object wrapper
}
```

**Helper Implementation :**

```typescript
// /app/utils/ApiResponse.ts
export class ApiResponse {
  static success<T>(data: T) {
    return { success: true, data }
  }

  static error(code: string, message: string, details?: any) {
    return {
      success: false,
      error: { code, message, details }
    }
  }
}

// Usage controllers
return response.json(ApiResponse.success({ order }))
return response.status(400).json(
  ApiResponse.error('VALIDATION_FAILED', 'Invalid input', errors)
)
```

---

#### 3.2 - API JSON Field Naming

**Convention :** `camelCase` (standard web APIs)

```json
// ✅ CORRECT
{
  "userId": 123,
  "createdAt": "2026-02-15T10:30:00.000Z",
  "cloudinaryPhotoIds": ["abc", "def"],
  "stripePaymentIntentId": "pi_123"
}

// ❌ INCORRECT
{
  "user_id": 123,                     -- snake_case
  "UserId": 123,                      -- PascalCase
  "created_at": "...",                -- snake_case
}
```

**Backend Auto-Serialization :**

```typescript
// Lucid BaseModel (all models extend)
export default class BaseModel extends LucidBaseModel {
  // Auto camelCase serialization
  public serialize() {
    return this.toJSON() // Lucid converts snake_case → camelCase
  }
}

// Usage
const order = await Order.find(1)
return response.json({ order: order.serialize() })
// → { "userId": 123, "createdAt": "..." }
```

---

#### 3.3 - Dates Format

**Convention :** ISO 8601 strings (UTC timezone)

```typescript
// ✅ CORRECT
{
  "createdAt": "2026-02-15T10:30:00.000Z",
  "paidAt": "2026-02-15T11:45:23.456Z",
  "updatedAt": "2026-02-15T12:00:00.000Z"
}

// ❌ INCORRECT
{
  "createdAt": 1708000200000,         -- Unix timestamp
  "paidAt": "2026-02-15",             -- Date only (no time)
  "updatedAt": "15/02/2026 12:00"     -- Non-ISO format
}
```

**Backend Lucid Configuration :**

```typescript
class Order extends BaseModel {
  @column.dateTime({
    autoCreate: true,
    serialize: (value) => value?.toISO()
  })
  public createdAt: DateTime  // → "2026-02-15T10:30:00.000Z"
}
```

**Frontend Parsing :**

```typescript
// ✅ CORRECT
const date = new Date(order.createdAt)  // Direct ISO parse
const formatted = new Date(order.createdAt).toLocaleDateString('fr-FR')
// → "15/02/2026"

// ❌ INCORRECT
const date = new Date(order.createdAt * 1000)  -- Assuming timestamp
```

---

#### 3.4 - Booleans & Null Handling

**Booleans :** `true/false` uniquement

```json
// ✅ CORRECT
{
  "isPaid": true,
  "hasError": false,
  "isActive": true
}

// ❌ INCORRECT
{
  "isPaid": 1,                        -- Number
  "hasError": "false",                -- String
  "isActive": "yes"                   -- String yes/no
}
```

**Null Handling :**

```json
// ✅ CORRECT
{
  "email": "user@example.com",        // Present
  "phoneNumber": null,                // Explicitly null (optional field, no value)
  "avatarUrl": "https://..."          // Present
  // middleName omitted               // Optional field not set → omit
}

// ❌ INCORRECT
{
  "email": "",                        -- Empty string instead of null
  "phoneNumber": undefined,           -- undefined (not valid JSON)
  "middleName": null                  -- Send null for all optional fields
}
```

**Backend Pattern :**

```typescript
// ✅ CORRECT - Omit null optionals
const user = {
  email: 'user@example.com',
  phoneNumber: user.phone || null,     // Explicit null if no value
  ...(user.avatar && { avatarUrl: user.avatar })  // Omit if not set
}

// ❌ INCORRECT
const user = {
  email: user.email || '',             -- Empty string
  phoneNumber: user.phone || undefined -- undefined
}
```

---

### 4. Communication Patterns

#### 4.1 - Event Naming (Logging)

**Convention :** `snake_case` events (cohérent database naming)

```typescript
// ✅ CORRECT
logger.info({ event: 'generation_started', userId, orderId })
logger.info({ event: 'generation_succeeded', orderId, cost, duration })
logger.error({ event: 'generation_failed', orderId, error })

logger.info({ event: 'payment_succeeded', orderId, amount })
logger.error({ event: 'payment_failed', orderId, reason })

logger.info({ event: 'rgpd_cleanup', orderId, photosDeleted })
logger.warn({ event: 'rate_limit_exceeded', ip, route })

// ❌ INCORRECT
logger.info({ event: 'generationStarted', ... })      -- camelCase
logger.info({ event: 'GENERATION_STARTED', ... })     -- UPPER_SNAKE
logger.info({ event: 'generation-started', ... })     -- kebab-case
```

**Event Categories :**

```typescript
// User events
'user_registered', 'user_logged_in', 'user_logged_out'

// Order events
'order_created', 'order_paid', 'order_completed'

// Generation events
'generation_started', 'generation_succeeded', 'generation_failed'

// Payment events
'payment_succeeded', 'payment_failed', 'webhook_received'

// System events
'rgpd_cleanup', 'backup_completed', 'discord_webhook_failed'
```

---

#### 4.2 - Discord Webhook Patterns

**Convention :** Channel-based routing + Embed formatting

```typescript
// ✅ CORRECT
async sendAlert(level: 'error' | 'warn' | 'info', message: string, context?: any) {
  const webhookUrl = level === 'error'
    ? env.get('DISCORD_WEBHOOK_ERRORS')
    : env.get('DISCORD_WEBHOOK_WARNINGS')

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: level === 'error' ? '@Aldo 🚨' : '',  // Ping only on errors
      embeds: [{
        title: (level === 'error' ? '❌ ' : '⚠️ ') + message,
        color: level === 'error' ? 15158332 : 16776960,  // Red : Yellow
        fields: context ? Object.entries(context).map(([k, v]) => ({
          name: k,
          value: String(v),
          inline: true
        })) : [],
        timestamp: new Date().toISOString()
      }]
    })
  })
}

// ❌ INCORRECT
await fetch(DISCORD_WEBHOOK, {
  body: JSON.stringify({
    content: message  // Plain text (no embed formatting)
  })
})
```

---

### 5. Process Patterns

#### 5.1 - Error Handling (Frontend)

**Convention :** Try/Catch + Toast Notifications

```typescript
// ✅ CORRECT - Uniform pattern
async function handleSubmit(data: FormData) {
  try {
    const order = await apiCall('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    toast.success('✅ Commande créée !')
    router.push(`/result/${order.id}`)

  } catch (error: any) {
    // Use backend error codes
    if (error.code === 'VALIDATION_FAILED') {
      toast.error(`❌ ${error.message}`)
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      toast.error(`⏱️ ${error.message}`)
    } else {
      toast.error('❌ Erreur inattendue. Réessayez.')
      logger.error({ event: 'unexpected_error', error })
    }
  }
}

// API Client Helper
async function apiCall(endpoint: string, options?: RequestInit) {
  const response = await fetch(endpoint, options)
  const data = await response.json()

  if (!data.success) {
    throw { code: data.error.code, message: data.error.message }
  }

  return data.data
}

// ❌ INCORRECT - Inconsistent error handling
async function handleSubmit() {
  const response = await fetch('/api/orders', { method: 'POST' })
  if (response.ok) {
    // Success
  } else {
    alert('Error!')  // No toast, no error code
  }
}
```

---

#### 5.2 - Loading States

**Convention :** Hybrid (Boolean simple, Status enum workflows)

**Simple Forms (React Hook Form intégré) :**

```typescript
// ✅ CORRECT
const form = useForm<ConfigFormValues>()
const isSubmitting = form.formState.isSubmitting  // Built-in

return (
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Envoi...' : 'Envoyer'}
    </Button>
  </form>
)

// ❌ INCORRECT
const [loading, setLoading] = useState(false)  // Duplicate React Hook Form state
```

**Workflows Multi-Étapes (Zustand Status Enum) :**

```typescript
// ✅ CORRECT - Zustand store
interface GenerationStore {
  status: 'idle' | 'uploading' | 'processing' | 'generating' | 'completed' | 'error'
  progress: number
  error: string | null
}

// Usage component
const { status, progress } = useGenerationStore()

if (status === 'uploading') return <UploadProgress progress={progress} />
if (status === 'generating') return <GeneratingAnimation />
if (status === 'completed') return <ResultDisplay />
if (status === 'error') return <ErrorMessage />

// ❌ INCORRECT - Multiple boolean flags
const [isUploading, setIsUploading] = useState(false)
const [isProcessing, setIsProcessing] = useState(false)
const [isGenerating, setIsGenerating] = useState(false)
// → Confusing, possible invalid states (multiple true)
```

---

### 6. Enforcement Guidelines

#### All AI Agents MUST:

1. **Respect ALL naming conventions** (database snake_case, API camelCase, files PascalCase/lowercase)
2. **Use standardized API response format** (`{ success, data/error }`)
3. **Co-locate tests** (`.test.ts` next to source file)
4. **Handle errors with try/catch + toast** (frontend) or ApiResponse helper (backend)
5. **Use ISO 8601 dates** in all API responses
6. **Log events in snake_case** with structured Pino format
7. **Follow TypeScript conventions** (no `I` prefix, PascalCase types, UPPER_SNAKE constants)
8. **Organize components by type** (`/components/forms/`, `/components/ui/`, etc.)
9. **Use Lucid auto-serialization** (camelCase JSON from snake_case DB)
10. **Implement loading states correctly** (React Hook Form built-in for simple, Zustand status for workflows)

#### Pattern Verification:

**Before committing code, AI agents should verify:**

- [ ] Database tables/columns use `snake_case`
- [ ] API JSON fields use `camelCase`
- [ ] Files follow Next.js/AdonisJS conventions (PascalCase components, lowercase pages)
- [ ] Tests are co-located (`.test.ts` next to source)
- [ ] Error responses use `{ success: false, error: { code, message } }` format
- [ ] Dates are ISO 8601 strings
- [ ] Log events use `snake_case`
- [ ] TypeScript interfaces have no `I` prefix
- [ ] Constants use `UPPER_SNAKE_CASE`

#### Pattern Violations:

**If patterns are violated, agents should:**

1. **Self-correct immediately** before marking task complete
2. **Document why** if legitimate exception (comment in code)
3. **Alert user** if pattern conflicts with framework convention

---

### 7. Pattern Examples

#### Good Examples (Follow These)

**Database Model + API Response :**

```typescript
// ✅ Backend - Lucid Model
class Order extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: number              // → user_id in DB

  @column()
  public stripePaymentIntentId: string  // → stripe_payment_intent_id in DB

  @column.dateTime({ autoCreate: true, serialize: (v) => v?.toISO() })
  public createdAt: DateTime         // → created_at in DB → "2026-02-15T10:30:00.000Z" in JSON
}

// ✅ Controller
async show({ params, response }: HttpContext) {
  const order = await Order.find(params.id)
  if (!order) {
    return response.status(404).json(
      ApiResponse.error('ORDER_NOT_FOUND', 'Commande introuvable')
    )
  }

  return response.json(
    ApiResponse.success({ order: order.serialize() })
  )
}

// ✅ API Response
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid-123",
      "userId": 456,                              // camelCase
      "stripePaymentIntentId": "pi_abc",          // camelCase
      "createdAt": "2026-02-15T10:30:00.000Z"     // ISO 8601
    }
  }
}
```

**Frontend Form + Error Handling :**

```typescript
// ✅ Component
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { configFormSchema, type ConfigFormValues } from '@/schemas/configFormSchema'
import { toast } from '@/components/ui/use-toast'

export default function ConfigForm() {
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    mode: 'onChange'
  })

  const onSubmit = async (data: ConfigFormValues) => {
    try {
      const order = await apiCall('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      toast({ title: '✅ Commande créée !' })
      router.push(`/result/${order.id}`)

    } catch (error: any) {
      if (error.code === 'VALIDATION_FAILED') {
        toast({
          title: '❌ Validation échouée',
          description: error.message,
          variant: 'destructive'
        })
      } else {
        toast({
          title: '❌ Erreur inattendue',
          description: 'Réessayez dans quelques instants.',
          variant: 'destructive'
        })
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Envoi...' : 'Continuer'}
        </Button>
      </form>
    </Form>
  )
}
```

**Logging + Discord Alerts :**

```typescript
// ✅ Service
class GenerationService {
  async generate(orderId: string) {
    const startTime = Date.now()

    logger.info({
      event: 'generation_started',    // snake_case
      orderId,
      timestamp: new Date().toISOString()
    })

    try {
      const result = await this.callAIService(orderId)
      const duration = Date.now() - startTime

      logger.info({
        event: 'generation_succeeded',
        orderId,
        duration,
        cost: result.cost
      })

      await DiscordService.sendAlert('info', 'Génération réussie', {
        orderId,
        duration: `${duration}ms`,
        cost: `${result.cost}€`
      })

      return result

    } catch (error) {
      logger.error({
        event: 'generation_failed',
        orderId,
        error: error.message,
        duration: Date.now() - startTime
      })

      await DiscordService.sendAlert('error', `Génération échouée: ${error.message}`, {
        orderId,
        error: error.stack
      })

      throw error
    }
  }
}
```

---

#### Anti-Patterns (Avoid These)

**❌ Mixed Naming Conventions :**

```typescript
// ❌ WRONG - Inconsistent database naming
table.integer('userId')              // camelCase
table.string('user_email')           // snake_case
table.timestamp('CreatedAt')         // PascalCase

// ❌ WRONG - Inconsistent API JSON
{
  "user_id": 123,                    // snake_case
  "createdAt": "...",                // camelCase
  "OrderId": "abc"                   // PascalCase
}
```

**❌ Non-Standard API Response :**

```typescript
// ❌ WRONG - Direct response without wrapper
return response.json({ order })

// ❌ WRONG - Different error format
return response.json({
  error: "Validation failed"         // String error, no code
})

// ❌ WRONG - Different wrapper format
return response.json({
  status: 'success',                 // Not "success: true"
  result: { order }                  // Not "data"
})
```

**❌ Inconsistent Error Handling :**

```typescript
// ❌ WRONG - No try/catch
async function handleSubmit() {
  const response = await fetch('/api/orders', { method: 'POST' })
  const data = await response.json()
  // No error handling!
}

// ❌ WRONG - Alert instead of toast
catch (error) {
  alert('Error!')                    // Use toast
}

// ❌ WRONG - Ignoring backend error codes
catch (error) {
  toast.error('Error occurred')      // Generic, no error.code checking
}
```

**❌ Multiple Boolean Loading States :**

```typescript
// ❌ WRONG - Possible invalid states
const [isUploading, setIsUploading] = useState(false)
const [isProcessing, setIsProcessing] = useState(false)
const [isGenerating, setIsGenerating] = useState(false)

// What if isUploading=true AND isGenerating=true? → Invalid state!

// ✅ CORRECT - Use status enum
const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'generating'>('idle')
```

**❌ Non-ISO Dates :**

```typescript
// ❌ WRONG
{
  "createdAt": 1708000200000,        // Unix timestamp
  "date": "15/02/2026"               // Non-ISO format
}

// ✅ CORRECT
{
  "createdAt": "2026-02-15T10:30:00.000Z",  // ISO 8601
  "date": "2026-02-15T00:00:00.000Z"
}
```

---

## Pattern Summary : Quick Reference

| Category | Pattern | Example |
|----------|---------|---------|
| **Database** | snake_case tables/columns | `users`, `user_id`, `created_at` |
| **API Endpoints** | Plural RESTful | `GET /api/orders/:id` |
| **API JSON** | camelCase fields | `{ "userId": 123, "createdAt": "..." }` |
| **Files (Next.js)** | pages lowercase, components PascalCase | `page.tsx`, `UploadForm.tsx` |
| **Files (AdonisJS)** | PascalCase | `OrdersController.ts`, `Order.ts` |
| **TypeScript** | No `I` prefix, PascalCase types | `interface User`, `type OrderStatus` |
| **Constants** | UPPER_SNAKE_CASE | `const MAX_PHOTOS = 2` |
| **Tests** | Co-located `.test.ts` | `GenerationService.test.ts` |
| **Components** | By type organization | `/components/forms/`, `/components/ui/` |
| **Dates** | ISO 8601 strings | `"2026-02-15T10:30:00.000Z"` |
| **Booleans** | `true/false` only | `{ "isPaid": true }` |
| **Null** | Explicit null or omit | `{ "phone": null }` or omit field |
| **Events** | snake_case | `generation_started`, `payment_succeeded` |
| **Errors** | Try/catch + toast | `toast.error(error.message)` |
| **Loading** | Hybrid (Boolean/Status enum) | `isSubmitting` or `status: 'loading'` |

---

**Implementation Patterns Finalisées - Prêtes pour Implémentation Cohérente** ✅

**18 points de conflit identifiés et résolus**

**Tous les agents AI suivront ces patterns pour garantir un code compatible et cohérent.**

---

## Project Structure & Boundaries

### Naming Strategy (Party Mode Validated)

**Brand Name :** Siana Memento (user-facing, display)

**Technical Naming** - **Cohérence validée par Paige, Winston, Barry, Amelia** :

| Context | Format | Example |
|---------|--------|---------|
| **Root folder** | kebab-case | `siana-memento/` |
| **NPM packages** | Scoped kebab | `@siana-memento/web`, `@siana-memento/api` |
| **Database** | snake_case | `siana_memento` (tables: `users`, `orders`) |
| **Docker services** | kebab-case | `siana-memento-postgres`, `siana-memento-api` |
| **PM2 process** | kebab-case | `siana-memento-api` |
| **Git repository** | kebab-case | `siana-memento` |
| **Container registry** | kebab-case | `ghcr.io/username/siana-memento-api:latest` |
| **User-facing** | Brand name | "Siana Memento" (titles, emails, footer) |
| **URLs** | kebab-case | `siana-memento.com`, `api.siana-memento.com` |
| **Environment vars** | UPPER_SNAKE | `SIANA_MEMENTO_API_URL` |

**Rationale :** Cohérence technique (kebab infrastructure, snake DB) + Brand clarity user-facing

**Migration Effort :** 10 min (before code written = perfect timing - Winston)

---

### Complete Project Structure

Voir le document complet dans le fichier pour la structure détaillée de :
- Frontend Next.js 16 (@siana-memento/web)
- Backend AdonisJS 6 (@siana-memento/api)
- Docker Compose configuration
- GitHub Actions CI/CD
- VPS deployment structure

**Project Structure Finalisée - Prête pour Implémentation** ✅

---
## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

Toutes les décisions technologiques fonctionnent ensemble sans conflits. Vérifications effectuées :

- **Next.js 16.1.6 + AdonisJS 6.18.1** : Communication RESTful JSON via fetch(), CORS configuré, cookies cross-origin (sameSite: 'lax')
- **Next.js + shadcn/ui** : Compatibilité native Radix UI, Tailwind CSS, TypeScript strict
- **AdonisJS + PostgreSQL 16** : Lucid ORM natif, migrations type-safe, connection pooling optimisé
- **Docker + PM2 + Nginx** : Stack VPS production-ready, zero-downtime deployments, clustering multi-workers
- **Cloudinary + Stripe + Resend** : Toutes APIs RESTful, webhooks idempotents, retry logic intégré
- **PostgreSQL + Cookie sessions** : Stateless sessions compatibles PM2 multi-workers (pas de sticky sessions requis)

**Versions Compatibility Matrix :**

| Tech | Version | Compatible With | Verified |
|------|---------|----------------|----------|
| Next.js | 16.1.6 | React 19, Node 22 LTS | ✅ |
| AdonisJS | 6.18.1 | Node 22 LTS, PostgreSQL 16 | ✅ |
| PostgreSQL | 16 | Ubuntu 24.04 LTS, Lucid ORM | ✅ |
| Node.js | 22 LTS | All frameworks | ✅ |
| TypeScript | 5.x | Next.js 16, AdonisJS 6 | ✅ |

**Pattern Consistency:**

Tous les implementation patterns supportent les décisions architecturales :

- **Database snake_case** → Lucid ORM auto-conversion vers camelCase JSON : ✅ Cohérent
- **API camelCase JSON** → React Hook Form + Zod validation : ✅ Type-safe end-to-end
- **Tests co-located** → Compatible Next.js + AdonisJS conventions : ✅ DX optimisé
- **Error codes standardisés** → Frontend toast + Backend ApiResponse helper : ✅ Consistent UX
- **ISO 8601 dates** → Lucid DateTime serialization + JS Date native parsing : ✅ Zero conversion
- **Discord webhooks** → Pino structured logging integration : ✅ Monitoring cohérent

**Structure Alignment:**

La structure projet supporte toutes les décisions architecturales :

- **Monorepo `/siana-memento/`** avec `/frontend/` et `/backend/` séparés → Déploiements indépendants Vercel + VPS : ✅
- **Components by type** (`/forms/`, `/ui/`) → Réutilisabilité maximale, import paths clairs : ✅
- **Services flat structure** (`/app/services/`) → 6-8 services MVP, navigation rapide : ✅
- **Validators centralisés** (`/app/validators/`) → DRY principle, réutilisables controllers : ✅
- **Docker Compose** architecture → PostgreSQL + API + Redis (Growth) orchestration : ✅

**Integration Points Properly Structured:**

- **Frontend → Backend** : API client wrapper (`/lib/api.ts`) avec error handling standardisé
- **Backend → Cloudinary** : CloudinaryService abstraction, signed URLs generation
- **Backend → Stripe** : WebhooksController avec signature validation + idempotence table
- **Backend → AI Service** : GenerationService avec retry logic + Discord alerts
- **Backend → Discord** : DiscordService abstraction, channel-based routing

**Aucun conflit architectural détecté.** ✅

---

### Requirements Coverage Validation ✅

**From Epics / FR Categories:**

**Coverage Matrix : 51/51 Functional Requirements architecturally supported** ✅

| FR Category | Count | Architectural Support | Validation |
|-------------|-------|-----------------------|------------|
| **User Management** | 8 | Ally Google OAuth + Cookie sessions 7j + Lucid User model + Auth middleware | ✅ Full |
| **Design Generation** | 10 | Cloudinary direct upload + AI service wrapper + GenerationService + Order model + Polling 3s | ✅ Full |
| **Iteration & Feedback** | 5 | Generation model iterations tracking + Form enrichi preview + Feedback structured storage | ✅ Full |
| **Payment & Commerce** | 4 | Stripe checkout + Webhooks idempotence + stripe_events table + OrderService | ✅ Full |
| **Content Delivery** | 5 | Resend email delivery + Cloudinary storage + RGPD cleanup command + re-download endpoint | ✅ Full |
| **Admin & Monitoring** | 7 | Admin dashboard + Pino logs + Discord webhooks + Analytics queries + CSV export | ✅ Full |
| **System Reliability** | 8 | VineJS validation + Retry logic + Progress bar + Healthcheck + pg_dump backups | ✅ Full |
| **User Feedback & Analytics** | 4 | Survey model + Testimonials CRUD + UTM tracking + analytics dashboard | ✅ Full |

**Specific FR Architectural Mapping Examples:**

- **FR-AUTH-001** (OAuth Google) → `Ally Google Provider` + `AuthController.redirectToGoogle()`
- **FR-GEN-002** (5 templates) → `TemplateSeeder` with Bohème/Moderne/Classique/Vintage/Minimaliste ⚠️ *Specs visuelles requises (voir Gap 1)*
- **FR-GEN-003** (Upload 2 photos) → `Cloudinary signed URLs` + `react-dropzone` + `MAX_PHOTOS = 2` constant
- **FR-GEN-008** (3 itérations incluses) → `Order.iterations_count <= 3` validation + pricing logic
- **FR-PAY-001** (Stripe) → `StripeService` + `WebhooksController` + `stripe_events` idempotence
- **FR-DEL-002** (RGPD 7j) → `CleanupRgpd` command + `RGPD_RETENTION_DAYS = 7` constant
- **FR-ADM-001** (Dashboard metrics) → `AnalyticsService` + Pino JSON queries + Discord daily summary
- **FR-REL-003** (Progress bar) → Polling 3s avec `Order.status` enum (uploading/processing/generating/completed)

**Cross-Epic Dependencies Handled:**

- **Auth → All Features** : `AuthMiddleware` protège routes, `auth.user` context disponible controllers
- **Payment → Generation** : `Order.status = 'paid'` trigger `GenerationService.generate()`
- **Generation → Email Delivery** : `Generation.completed` trigger `EmailService.sendDelivery()`
- **RGPD → Cloudinary + Database** : `CleanupRgpd` command orchestre cleanup synchronisé

**Non-Functional Requirements:**

**Coverage Matrix : 38/38 NFRs architecturally supported** ✅

| NFR Category | Key Requirements | Architectural Support | Validation |
|--------------|------------------|----------------------|------------|
| **Performance** | Generation <30s, Form preview <100ms, Page load <2s | AI service timeout 30s + React preview instant + Next.js SSR + Vercel Edge | ✅ Full |
| **Scalability** | 5-10 users simultanés MVP, 50-100 Growth | PostgreSQL pool 2-10 connections + PM2 clustering 2 workers + Migration BullMQ documented | ✅ Full |
| **Security** | PCI-DSS, RGPD, HTTPS, Sessions sécurisées | Stripe compliance + RGPD cleanup + Let's Encrypt SSL + httpOnly/secure cookies | ✅ Full |
| **Availability** | 99% uptime target | UptimeRobot monitoring + Discord alerts + Healthcheck + Backup daily + Zero-downtime deploy | ✅ Full |
| **Usability** | Mobile responsive, WCAG 2.1 AA | Tailwind responsive + shadcn/ui accessible + "Magie Perçue" UX patterns | ✅ Full |
| **Maintainability** | TypeScript strict, Tests co-located, Documentation | TS strict all files + `.test.ts` co-located + architecture.md + inline comments | ✅ Full |

**Specific NFR Architectural Mapping Examples:**

- **NFR-PER-001** (Generation <30s) → `GenerationService` timeout 30s + retry logic + Discord alert si >30s
- **NFR-PER-004** ("Magie Perçue") → Preview temps réel + Confetti success + Mascotte messages + Progress animations ⚠️ *Templates visuels impact perception (voir Gap 1)*
- **NFR-SEC-001** (HTTPS obligatoire) → Nginx SSL Let's Encrypt + `secure: true` cookies
- **NFR-SEC-003** (RGPD conformité) → Cleanup 7j + Cloudinary deletion + User anonymization
- **NFR-AVA-001** (99% uptime) → UptimeRobot 5 min checks + Discord alerts + Healthcheck `/health`
- **NFR-USA-001** (WCAG 2.1 AA) → shadcn/ui Radix UI components (accessible native)
- **NFR-MAI-002** (Code maintenable) → TypeScript strict + ESLint + Prettier + Architecture doc

**Aucun requirement sans support architectural.** ✅

---

### Implementation Readiness Validation ✅

**Decision Completeness:**

Tous les critical et important decisions documentés avec versions vérifiées :

- ✅ **23 architectural decisions** documentées (8 critical, 5 important, 10 deferred Growth)
- ✅ **Toutes versions verified via web search** (Next.js 16.1.6, AdonisJS 6.18.1, PostgreSQL 16, Node 22 LTS)
- ✅ **Rationale explicite** pour chaque décision (business value, technical trade-offs)
- ✅ **Migration paths documentés** pour 5 deferred decisions (Redis, BullMQ, Neon, backup off-site, crons automation)
- ✅ **Examples concrets** fournis pour decisions complexes (Stripe idempotence, Discord webhooks, Lucid serialization)

**Structure Completeness:**

Project structure complète et spécifique, prête pour scaffolding :

- ✅ **Frontend structure** : 25+ files définis (`/app/(public)/`, `/components/`, `/stores/`, `/lib/`, `/schemas/`)
- ✅ **Backend structure** : 30+ files définis (`/app/controllers/`, `/models/`, `/services/`, `/validators/`, `/commands/`)
- ✅ **Docker Compose** : 3 services définis (postgres, api, nginx reverse proxy)
- ✅ **CI/CD structure** : GitHub Actions workflow steps documentés (build → push GHCR → deploy VPS)
- ✅ **VPS deployment** : Nginx config, PM2 ecosystem, SSL Let's Encrypt setup steps

**Integration points clearly specified:**

- API routes RESTful (`/api/orders`, `/api/generations/:id/status`, `/api/webhooks/stripe`)
- Environment variables (⚠️ *Liste à compléter - voir Gap 2*)
- Component boundaries (Frontend forms, Backend services, External APIs)
- Database schema (Users, Orders, Generations, StripeEvents tables définis)

**Pattern Completeness:**

18 implementation patterns définis, addressing all potential conflict points :

| Pattern Category | Patterns Defined | Conflict Points Resolved | Completeness |
|------------------|------------------|--------------------------|--------------|
| **Naming** | 4 patterns | Database snake_case, API camelCase, Files conventions, TypeScript conventions | ✅ 100% |
| **Structure** | 3 patterns | Tests co-located, Components by type, Services flat | ✅ 100% |
| **Format** | 4 patterns | API responses, JSON fields, Dates ISO 8601, Booleans/Null | ✅ 100% |
| **Communication** | 2 patterns | Event naming snake_case, Discord webhooks embeds | ✅ 100% |
| **Process** | 2 patterns | Error handling try/catch+toast, Loading states hybrid | ✅ 100% |
| **Enforcement** | 3 guidelines | Verification checklist, Self-correction, Pattern violations handling | ✅ 100% |

**Examples provided for all major patterns:**

- ✅ Lucid ORM auto-serialization code example
- ✅ API Response format (success/error) with ApiResponse helper
- ✅ Discord webhook embed structure avec fields/colors
- ✅ React Hook Form + Zod validation pattern
- ✅ Error handling try/catch + toast frontend
- ✅ Loading states hybrid (boolean simple vs status enum workflows)
- ✅ Good examples vs Anti-patterns comparison tables

**Patterns cover all cross-cutting concerns:**

- Error handling : Standardisé try/catch + ApiResponse + Discord alerts
- Logging : Pino structured JSON + snake_case events
- Validation : VineJS backend + Zod frontend
- Dates : ISO 8601 everywhere (DB → API → Frontend)
- Sessions : Cookie encrypted (httpOnly, secure, sameSite: 'lax')

**AI agents peuvent implémenter de manière consistante sans ambiguïté.** ✅

---

### Gap Analysis Results (Party Mode Reviewed)

**TOTAL GAPS : 5** (1 Critical, 4 Nice-to-Have)

#### Critical Gaps : 1 ⚠️

**Gap 1 : Template Visual Specifications (PRIORITÉ HAUTE)**

**Issue :** Les 5 templates (Bohème, Moderne, Classique, Vintage, Minimaliste) sont mentionnés dans FR-GEN-002 mais **manquent de spécifications visuelles précises** pour implémentation cohérente.

**Documentation actuelle :**
```
FR-GEN-002 : Templates prédéfinis (Bohème, Moderne, Classique, Vintage, Minimaliste)
```

**Specs manquantes critiques :**
- ❌ **Couleurs dominantes** par template (palettes précises, codes hex)
- ❌ **Typographies** (font families, sizes, weights, letterspacing)
- ❌ **Layouts compositions** (centered, asymmetric, grid, margins, spacing)
- ❌ **Éléments décoratifs signature** (borders, ornements, illustrations, overlays)
- ❌ **Design tokens** (border-radius, shadows, opacities)

**Impact sans résolution (Party Mode - Winston, Barry, Amelia consensus) :**

1. **Incohérence marque** : Dev improvise designs → 5 templates génériques sans identité
2. **Timeline risk** :
   - Spike research : 2-3h pour étudier styles Save the Date
   - Design iteration : 1-2h × 5 templates = 5-10h
   - Refactor après feedback : 2-4h quand "pas ce que j'imaginais"
   - **Total temps perdu : 9-17h** → Timeline 36h → **45-53h** (sortie "Good Enough Architecture")
3. **NFR-PER-004 compromise** : "Magie Perçue" UX dépend de templates visuellement impactants
4. **AC incomplets FR-GEN-002** : Cannot implement proprement sans specs claires

**Résolution recommandée (Party Mode - Tous agents) :**

**Option A (Recommandée) :**
- **Specs visuelles maintenant avec Sally UX Designer** (20-30 min)
  - Définir couleurs dominantes × 5 templates (+ palettes secondaires)
  - Choisir typographies × 5 templates (Google Fonts recommendations)
  - Décrire layouts compositions × 5 templates (wireframes sketches)
  - Lister éléments décoratifs signature par template
- **Documenter dans** `/docs/template-design-specs.md` (10 min)
- **Créer TemplateSeeder** avec ces specs (Amelia implémentation 2-3h)
- **Net gain :** Économie 5-13h iterations design + cohérence marque garantie

**Option B (Compromis timeline) :**
- **MVP 2 templates** (Bohème + Moderne) avec specs minimales (1h specs + 2h impl = 3h)
- 3 autres templates → "Coming Soon" Growth phase
- **Risque :** Frustration users si template favori manquant (impact NFR-PER-004)

**Effort Option A :** 30 min specs + 10 min doc + 2-3h impl = **3-3.5h**
**Effort Option B :** 1h specs + 2h impl = **3h**

**Verdict (Barry) :** Option A meilleure (même timeline ~3.5h, mais 5 templates complets MVP + économie 5-13h future iterations)

**Status :** ⚠️ **BLOQUE implémentation propre FR-GEN-002**

---

#### Nice-to-Have Gaps : 4 ✅

**Gap 2 : Environment Variables Complete List** *(reclassé Important → Nice-to-Have)*

**Issue :** Liste env vars partielle dans document (section Starter Template Evaluation line ~800).

**Specs manquantes :**
- Discord webhooks URLs (4 channels : errors, warnings, payments, generations)
- Cloudinary complete credentials (CLOUD_NAME, API_KEY, API_SECRET)
- Stripe complete keys (SECRET_KEY, WEBHOOK_SECRET, PUBLISHABLE_KEY)

**Résolution :** Compléter section avec toutes env vars organisées par service.

**Effort :** 5 min

**Rationale downgrade (Party Mode - Barry) :** Information déjà partiellement documentée, **trivial à compléter pendant Docker setup**, non-bloquant implémentation (devs discover au fur et à mesure).

**Status :** ✅ Optionnel, addressable en 5 min pendant setup

---

**Gap 3 : Testing Strategy Documentation**

**Issue :** Stratégie de tests non documentée (frameworks, coverage targets, patterns).

**Résolution potentielle :**
- Framework : Vitest (frontend) + Japa (backend AdonisJS natif)
- Coverage target : 70% core services (GenerationService, OrderService, PaymentService)
- Patterns : Tests co-located, AAA pattern, mock external APIs

**Effort :** 15-20 min documentation

**Rationale déferrement :**
- Tests co-located pattern déjà défini ✅
- TDD light : Tests écrits au fur et à mesure implémentation (Barry approach)
- Strategy émergera naturellement de la pratique

**Status :** ✅ Déférable, strategy émergera organiquement

---

**Gap 4 : AI Prompts Templates Documentation**

**Issue :** Templates prompts IA génération non documentés (structure, variables, exemples).

**Résolution potentielle :**
- Template base structure avec variables `{template}`, `{couple_names}`, `{date}`, `{lieu}`
- Prompts exemples par template (Bohème, Moderne, etc.)
- Guidelines itération (feedback incorporation patterns)

**Effort :** 30-45 min documentation + exemples

**Rationale déferrement (Party Mode - Barry) :**
- **20-30 itérations réelles nécessaires** pour affiner prompts production-ready
- Documenter maintenant = waste (prompts vont changer)
- Meilleure approche : Itérer en production, documenter après stabilisation

**Status :** ✅ Déférable Growth phase (post 30+ générations réelles)

---

**Gap 5 : Monitoring Dashboard Screenshots**

**Issue :** Pas de mockups visuels Discord channels layout, admin dashboard UI.

**Résolution potentielle :**
- Screenshots Discord embed examples (errors, warnings, payments)
- Admin dashboard wireframes (metrics cards, charts, tables)

**Effort :** 20-30 min mockups

**Rationale déferrement :**
- Discord embeds structure déjà documentée en code ✅
- Admin dashboard = CRUD basique shadcn/ui (Card, Table, Chart components)
- Polish visuel = Growth phase

**Status :** ✅ Nice-to-have polish, non-bloquant

---

### Validation Issues Addressed (Party Mode Session)

**Party Mode Participants :**
- 🏗️ **Winston (Architect)** - Évaluation complétude architecturale
- 🚀 **Barry (Quick Flow Solo Dev)** - Analyse pragmatisme timeline
- 💻 **Amelia (Developer)** - Vérification faisabilité implémentation

**Issues Soulevées :**

**Issue 1 : Gap TemplateSeeder sous-estimé (Winston)**

> "Gap 2 (TemplateSeeder) est classé 'Important' mais je le classerais **gap critique** si on veut 'Magie Perçue' UX. Les 5 templates sont mentionnés partout (PRD, UX spec) **mais les specs visuelles précises manquent**. Sans ça, Amelia va improviser 5 templates différents, et on perdra la cohérence de marque."

**Résolution :** ✅ **Gap reclassé Critical** (Important → Critical avec priorité haute)

---

**Issue 2 : Timeline risk templates (Barry)**

> "Si je dois implémenter ces templates sans specs claires : Spike research 2-3h + Design iteration 5-10h + Refactor 2-4h = **9-17h lost**. On passe de 36h à **45-53h**. Là, on sort du 'Good Enough Architecture'."

**Résolution :** ✅ **Option A recommandée** (specs 30 min now → économie 5-13h later)

---

**Issue 3 : AC incomplets FR-GEN-002 (Amelia)**

> "Je ne peux pas implémenter 5 templates sans specs. Current doc : `Templates prédéfinis (Bohème, Moderne, etc.)` **Insuffisant pour AC**. Sans specs claires, je vais écrire `{ color: '#???', font: '???' }` (guess)."

**Résolution :** ✅ **Gap bloque implémentation propre** FR-GEN-002, résolution requise avant dev

---

**Issue 4 : Gap Env Vars overclassified (Barry)**

> "Gap 1 (env vars) : trivial, je les liste en 5 min pendant le setup Docker. Ce n'est PAS bloquant."

**Résolution :** ✅ **Gap reclassé Nice-to-Have** (Important → Nice-to-Have, rationale : 5 min, non-bloquant)

---

**Consensus Final (Tous agents) :**

✅ **Gap TemplateSeeder = seul gap critique** identifié
✅ **Résolution recommandée = Option A** (specs 30 min + doc 10 min + impl 2-3h = 3-3.5h total)
✅ **Net gain timeline** : Économie 5-13h iterations futures
✅ **Tous autres gaps = Nice-to-Have** (non-bloquants, déférables, ou triviaux)

---

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed (51 FRs, 38 NFRs)
- [x] Scale and complexity assessed (5-10 users MVP, 50-100 Growth)
- [x] Technical constraints identified (Budget 200€, Timeline 36h, Solo dev, VPS Hostinger existant)
- [x] Cross-cutting concerns mapped (Auth, Error handling, Monitoring, RGPD, Backups)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions (23 decisions : 8 critical, 5 important, 10 deferred)
- [x] Technology stack fully specified (Next.js 16.1.6, AdonisJS 6.18.1, PostgreSQL 16, Node 22 LTS)
- [x] Integration patterns defined (Cloudinary direct upload, Stripe webhooks idempotence, Discord alerts)
- [x] Performance considerations addressed (Polling 3s MVP, BullMQ Growth, Memory cache → Redis migration)

**✅ Implementation Patterns**

- [x] Naming conventions established (18 patterns : Database snake_case, API camelCase, Files conventions, etc.)
- [x] Structure patterns defined (Tests co-located, Components by type, Services flat)
- [x] Communication patterns specified (Event naming snake_case, Discord webhooks embeds, API responses standardisés)
- [x] Process patterns documented (Error handling try/catch+toast, Loading states hybrid, Validation VineJS+Zod)

**✅ Project Structure**

- [x] Complete directory structure defined (55+ files frontend+backend)
- [x] Component boundaries established (Frontend pages/components/stores, Backend controllers/services/models)
- [x] Integration points mapped (RESTful API routes, Webhooks endpoints, External services wrappers)
- [x] Requirements to structure mapping complete (51 FRs → Files/Components/Services mapped)

**⚠️ Outstanding Items (Party Mode Identified)**

- [ ] **Gap 1 : Template Visual Specifications** (CRITICAL - bloque FR-GEN-002)
  - Résolution requise : 30 min specs + 10 min doc = 40 min
  - Blockers removed → 100% ready

- [ ] Gap 2-5 : Nice-to-Have (env vars, testing, AI prompts, mockups)
  - Non-bloquants, déférables Growth ou addressables en 5-30 min pendant implémentation

---

### Architecture Readiness Assessment (Party Mode Updated)

**Overall Status:** ✅ **READY FOR IMPLEMENTATION** *(après résolution Gap 1)*

**Confidence Level:** **98%** *(upgraded from 95%)*

**Rationale upgrade (Party Mode consensus) :**
- **Gap analysis refiné** : 1 critical identifié (vs 2 important mal classés)
- **Timeline risk mitigé** : Option A (specs 40 min) économise 5-13h iterations futures
- **Zero ambiguïté implémentation** : Avec specs templates claires, tous AC FR-GEN-002 définissables
- **Patterns completeness 100%** : 18/18 patterns définis, exemples concrets fournis
- **Migration paths documentés** : 5 deferred decisions avec triggers et efforts précis

**Implementation Blockers:**

⚠️ **1 critical blocker identifié (Party Mode) :**
- **Gap 1 : Template Visual Specifications** doit être résolu avant implémentation FR-GEN-002
  - **Impact :** Bloque TemplateSeeder, risque timeline +9-17h, compromise cohérence marque
  - **Résolution :** 40 min (specs 30 min + doc 10 min) avant dev FR-GEN-002
  - **Alternative :** MVP 2 templates (Bohème + Moderne), 3 autres Growth phase

✅ **Tous autres gaps non-bloquants :**
- Gap 2 (Env vars) : 5 min pendant Docker setup
- Gap 3-5 : Déférables Growth ou émergent organiquement pendant implémentation

**Key Strengths (Original + Party Mode additions) :**

1. **Pragmatisme validé** (Party Mode - Barry) :
   - "Good Enough Architecture" respecté : 36h timeline protégée
   - Crons manuels MVP → cron automation Growth (économie 1.5h)
   - Error codes inline MVP → extraction Growth (économie 0.5h)
   - 2h net gain optimizations applied

2. **Naming cohérent** (Party Mode - Paige, Winston) :
   - kebab-case infrastructure (`siana-memento/`)
   - snake_case database (`siana_memento`, `user_id`)
   - camelCase API JSON (`{ userId }`)
   - Brand clarity user-facing ("Siana Memento")
   - Zero confusion agents AI

3. **Cost optimization empirique** (Party Mode - Mary) :
   - Form enrichi + preview texte avant API → 52% cost reduction (2.5 → 1.2 iterations moyenne)
   - Économie 0.72€/commande → 72€ over 100 orders
   - VPS Hostinger existant → 60€/an savings vs Railway

4. **Developer Experience** (Party Mode - Tous agents) :
   - Discord webhooks > email alerts : Mobile notifications, rich embeds, 15 min setup
   - Tests co-located : Navigation rapide, context proche
   - TypeScript strict : Type-safe end-to-end, catch errors compile-time
   - Patterns examples : Good vs Anti-patterns comparison tables

5. **Monitoring mobile-first** (Party Mode - Winston, Sally) :
   - Discord channels thématiques (#errors, #warnings, #payments, #generations)
   - Push notifications temps réel mobile
   - Rich embeds with fields/colors/images
   - Searchable history Discord (vs log files SSH only)

6. **Migration paths documented** (Original + Winston validation) :
   - Memory cache → Redis (1h, trigger: BullMQ migration)
   - Polling 3s → BullMQ async (15h, trigger: >20 gen/jour)
   - PostgreSQL VPS → Neon (15 min, trigger: VPS migration)
   - Crons manual → automated (30 min, trigger: semaine 9-10)
   - Backup local → S3 off-site (10 min, trigger: peace of mind semaine 9-10)

**Areas for Future Enhancement (Post-MVP Growth) :**

1. **Templates expansion** (si Option B MVP) : 3 templates additionnels (Classique, Vintage, Minimaliste) semaine 9-10
2. **Testing strategy formalization** : 70% coverage target core services, Vitest+Japa frameworks
3. **AI prompts optimization** : Documentation après 30+ générations réelles, feedback patterns
4. **Backup off-site S3** : Peace of mind long-term (5€/mois, 10 min setup)
5. **Monitoring dashboard mockups** : Polish visuel admin dashboard, Discord embeds screenshots
6. **Sentry error tracking** : Si budget 50€/mois disponible, aggregation advanced
7. **Redis caching** : Si migration async BullMQ (>20 gen/jour)

---

### Implementation Handoff

**AI Agent Guidelines:**

Tous les agents AI travaillant sur ce projet **DOIVENT** :

1. **Suivre TOUS les naming conventions** sans exception :
   - Database : `snake_case` tables/columns (`users`, `user_id`, `created_at`)
   - API JSON : `camelCase` fields (`{ userId, createdAt }`)
   - Files : PascalCase components (`UploadForm.tsx`), lowercase pages (`page.tsx`)
   - TypeScript : No `I` prefix interfaces, PascalCase types, UPPER_SNAKE constants
   - Events : `snake_case` logging (`generation_started`, `payment_succeeded`)

2. **Utiliser format API standardisé** pour TOUTES les réponses :
   ```typescript
   // Success
   { "success": true, "data": { /* payload */ } }

   // Error
   { "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }
   ```

3. **Co-locate tests** systématiquement :
   - `GenerationService.ts` → `GenerationService.test.ts` (même dossier)
   - `PhotoUpload.tsx` → `PhotoUpload.test.tsx` (même dossier)

4. **Gérer erreurs avec try/catch + toast** (frontend) ou `ApiResponse` helper (backend) :
   ```typescript
   // Frontend
   try {
     const order = await apiCall('/api/orders', { method: 'POST', body })
     toast.success('✅ Commande créée !')
   } catch (error: any) {
     if (error.code === 'VALIDATION_FAILED') {
       toast.error(`❌ ${error.message}`)
     }
   }

   // Backend
   return response.json(ApiResponse.success({ order }))
   return response.status(400).json(ApiResponse.error('VALIDATION_FAILED', 'Invalid input'))
   ```

5. **Utiliser ISO 8601 dates** dans TOUTES les API responses :
   ```typescript
   { "createdAt": "2026-02-15T10:30:00.000Z" }  // ✅
   { "createdAt": 1708000200000 }               // ❌
   ```

6. **Logger events en snake_case** avec Pino structured format :
   ```typescript
   logger.info({ event: 'generation_started', orderId, userId })
   logger.error({ event: 'generation_failed', orderId, error })
   ```

7. **Respecter TypeScript conventions** strictement :
   - Interfaces : `interface User { ... }` (no `I` prefix)
   - Types : `type OrderStatus = 'pending' | 'paid'` (PascalCase)
   - Constants : `const MAX_PHOTOS = 2` (UPPER_SNAKE_CASE)

8. **Organiser components by type** (pas by feature) :
   - `/components/forms/` (LoginForm, UploadForm, ConfigForm)
   - `/components/ui/` (shadcn/ui components)
   - `/components/displays/` (ProgressDisplay, OrderCard)
   - `/components/layout/` (Header, Footer)

9. **Utiliser Lucid auto-serialization** (backend) :
   ```typescript
   class Order extends BaseModel {
     @column()
     public userId: number        // → user_id in DB → userId in JSON
   }
   ```

10. **Implémenter loading states correctement** :
    - Simple forms : `form.formState.isSubmitting` (React Hook Form built-in)
    - Workflows : Status enum `'idle' | 'uploading' | 'processing' | 'generating'` (Zustand)

**Avant commit, vérifier checklist patterns :**

- [ ] Database tables/columns utilisent `snake_case`
- [ ] API JSON fields utilisent `camelCase`
- [ ] Files suivent Next.js/AdonisJS conventions
- [ ] Tests sont co-located (`.test.ts` next to source)
- [ ] Error responses utilisent format `{ success, error: { code, message } }`
- [ ] Dates sont ISO 8601 strings
- [ ] Log events utilisent `snake_case`
- [ ] TypeScript interfaces sans `I` prefix
- [ ] Constants utilisent `UPPER_SNAKE_CASE`

**Si pattern violation détectée :**

1. **Self-correct immediately** avant marking task complete
2. **Document pourquoi** si legitimate exception (comment in code)
3. **Alert user** si pattern conflicts avec framework convention

**Référer à ce document** pour TOUTES questions architecturales. Architecture document = source of truth.

---

### First Implementation Priority

**⚠️ ATTENTION : Résoudre Gap 1 (Template Visual Specs) AVANT implémentation FR-GEN-002**

**Option recommandée (Party Mode consensus) :**

**Step 0 : Template Visual Specifications (40 min)**

```bash
# Créer session avec Sally UX Designer
# Définir specs visuelles 5 templates (30 min) :

# Template Bohème :
- Couleurs : Terre cuite #8B7355, Crème #F5E6D3, Vert sauge #2D4A3E
- Typographie : Cormorant Garamond (headings), Lato (body)
- Layout : Asymétrique, marges généreuses, photo dominante gauche
- Décoratifs : Watercolor flowers, handwritten accents

# Template Moderne :
- Couleurs : Noir #000000, Blanc #FFFFFF, Or #D4AF37
- Typographie : Montserrat (headings), Inter (body)
- Layout : Grid strict, centered, géométrique
- Décoratifs : Lignes dorées, formes abstraites

# [3 autres templates specs similaires...]

# Documenter (10 min)
mkdir -p docs
cat > docs/template-design-specs.md << EOF
# Template Design Specifications

[Markdown doc avec couleurs, fonts, layouts, décoratifs × 5 templates]
EOF
```

**Step 1 : Initialize Project Structure (30 min)**

```bash
# 1. Create monorepo structure
mkdir siana-memento
cd siana-memento

# 2. Initialize frontend (Next.js 16.1.6)
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --yes

cd frontend

# 3. Install shadcn/ui
npx shadcn@latest init

# 4. Add shadcn/ui components
npx shadcn@latest add button card dialog form input label toast \
  select separator textarea progress alert avatar badge

# 5. Install dependencies frontend
npm install zustand react-hook-form @hookform/resolvers zod \
  react-dropzone @stripe/stripe-js

cd ..

# 6. Initialize backend (AdonisJS 6)
npm init adonisjs@latest -- backend \
  --kit=api \
  --db=postgres \
  --auth-guard=session \
  --git-init=false

cd backend

# 7. Install AdonisJS packages
npm install @adonisjs/ally @adonisjs/limiter @adonisjs/cors
npm install stripe cloudinary resend pino

# 8. Install dev dependencies
npm install --save-dev @types/node

cd ..

# 9. Initialize Docker Compose
cat > docker-compose.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:16
    container_name: siana-memento-postgres
    environment:
      POSTGRES_USER: siana_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: siana_memento
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./backend
    container_name: siana-memento-api
    depends_on:
      - postgres
    ports:
      - "3333:3333"
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: siana_user
      DB_PASSWORD: dev_password
      DB_DATABASE: siana_memento
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
EOF

# 10. Initialize Git
git init
cat > .gitignore << EOF
node_modules/
.env
.env.local
dist/
build/
.DS_Store
*.log
EOF

git add .
git commit -m "Initial commit: Siana Memento architecture

- Next.js 16.1.6 frontend with shadcn/ui
- AdonisJS 6 backend with PostgreSQL
- Docker Compose development environment
- Architecture decision document implemented

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 2 : Setup Database & Migrations (1h)**

```bash
cd backend

# Create migrations
node ace make:migration create_users_table
node ace make:migration create_orders_table
node ace make:migration create_generations_table
node ace make:migration create_stripe_events_table

# Run migrations
node ace migration:run

# Create models
node ace make:model User
node ace make:model Order
node ace make:model Generation
node ace make:model StripeEvent

# Create seeders (avec template specs doc)
node ace make:seeder TemplateSeeder  # Use docs/template-design-specs.md
```

**Step 3 : Implement Core Services (2-3h)**

```bash
# Create services structure
mkdir -p app/services
touch app/services/AuthService.ts
touch app/services/CloudinaryService.ts
touch app/services/GenerationService.ts
touch app/services/OrderService.ts
touch app/services/EmailService.ts
touch app/services/DiscordService.ts

# Implement services following patterns from architecture doc
```

**Step 4 : Setup CI/CD (1h)**

```bash
# Create GitHub Actions workflow
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << EOF
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t ghcr.io/${{ github.repository }}/api:latest ./backend

      - name: Push to GHCR
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/api:latest

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            docker pull ghcr.io/${{ github.repository }}/api:latest
            docker-compose up -d --no-deps api
EOF
```

**Step 5 : Implement Frontend Core (3-4h)**

```bash
cd frontend

# Create stores
mkdir -p stores
# Implement useUserStore, useGenerationStore (Zustand + persist)

# Create components
mkdir -p app/components/{forms,displays,layout,ui}
# Implement UploadForm, ConfigForm, ProgressDisplay, etc.

# Create pages (App Router)
# Implement landing, /generate/upload, /generate/configure, /result/[id]
```

**Timeline Estimate (avec Gap 1 résolu) :**

- Step 0 : Template specs → **40 min**
- Step 1 : Project init → **30 min**
- Step 2 : Database setup → **1h**
- Step 3 : Core services → **2-3h**
- Step 4 : CI/CD → **1h**
- Step 5 : Frontend core → **3-4h**

**Total Phase 1 : 8-10h** (fondations solides)

**Phases suivantes :** Voir "Decision Impact Analysis" > "Implementation Sequence" (Phase 2-6, ~26-28h remaining)

**Total MVP : 34-38h** (timeline validated, protégée contre iterations design)

---

### 🎯 Architecture Validation COMPLETE

**Status Final :** ✅ **READY FOR IMPLEMENTATION** (98% confidence après résolution Gap 1)

**Critical Path :**
1. ⚠️ **Résoudre Gap 1** (Template Visual Specs - 40 min) → Débloque FR-GEN-002
2. ✅ **Initialize project** (Step 1-5 above)
3. ✅ **Implement MVP** (36h guideline, patterns to follow architecture doc)

**Architecture document = Source of Truth.** Référer pour toutes questions implémentation.

**Prêt pour handoff à l'équipe de développement.** 🚀

---

*Architecture validée par Party Mode collaborative review (Winston, Barry, Amelia)*
*Validation completée : 2026-02-16*
