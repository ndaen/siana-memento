---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-05.md'
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: 'API-First Web Application (B2C Transactional)'
  projectTypeDetails:
    frontend: 'React SPA'
    backend: 'AdonisJS API'
    coreProduct: 'Gemini API (AI generation)'
    payments: 'Stripe'
    storage: 'S3/Cloudinary'
  domain: 'Wedding/Events - Emotional Design Generator'
  domainDetails:
    vertical: 'Événementiel (mariages)'
    target: 'B2C (couples)'
    characteristic: 'User-generated content + AI générative'
  complexity: 'MEDIUM'
  complexityReasons:
    - 'External API dependency (Gemini)'
    - 'Async architecture required for scale'
    - 'Cost management critical (~0.50€/generation)'
    - 'Quality consistency (prompt engineering)'
    - 'High emotional UX expectations'
  projectContext: 'Greenfield MVP - Solo Developer - 4 months'
  contextDetails:
    timeline: '4 months (June 2026 launch)'
    resources: 'Solo dev, 160h budget'
    architectureStrategy: 'Sync simple (MVP), async later (20+ gen/day)'
    budget: '200€ max'
---

# Product Requirements Document - poster-generator

**Author:** Aldo
**Date:** 2026-02-12

## Executive Summary

**Problème :** Les couples français préparant leur mariage passent 2-3 heures à lutter avec des templates Canva génériques ou paient 300€+ pour des designers professionnels, résultant en frustration et designs qui ne capturent pas leur histoire unique.

**Solution :** poster-generator est un SaaS alimenté par IA qui génère des designs de Save the Date 100% personnalisés utilisant les propres photos des couples en 15 minutes. Propulsé par l'API Gemini avec prompts optimisés mariage et système de feedback itératif intelligent, la plateforme délivre des designs qualité professionnelle pour 19.90€.

**Marché Cible :** Couples français planifiant leur mariage (B2C), avec TAM de ~210K mariages/an en France. Focus initial sur couples digitalement avertis âgés 25-35 ans valorisant personnalisation et efficacité.

**Modèle Business :** Pricing transactionnel - 19.90€ par design single (MVP), expansion vers packs 49€ (Save the Date + Faire-part + Remerciements) en phase Growth.

**Métriques de Succès :**
- Break-even à 3 mois (5-10 clients, 200€ revenus nets)
- 1K€ net/mois récurrents à 12 mois
- 80% satisfaction en ≤3 itérations
- <10% taux refund
- 95% taux succès API

**Investissement & Timeline :** 48h dev solo, 8-10 semaines, 200€ budget infrastructure. Cible lancement : Juin 2026. Fenêtre first-mover advantage : 6-12 mois avant réaction Canva/Adobe.

---

## Success Criteria

### User Success

**Critères mesurables :**
- **Taux d'acceptation en ≤3 itérations : ≥80%** - La majorité des couples obtiennent un design satisfaisant sans itérations excessives, validant que les prompts optimisés et la galerie de templates fonctionnent
- **Taux de refund : <10%** - Si moins de 10% des clients demandent un remboursement, cela indique que la qualité perçue est suffisante
- **Feedback positif post-achat : ≥70%** - Survey automatique "Satisfait du design ? Oui/Non" avec objectif de 70%+ de réponses positives

**Moments de succès utilisateur :**
- **Soulagement :** "Enfin c'est fait facilement" - processus complet en <15 minutes vs 3h sur Canva
- **Fierté :** Résultat professionnel qu'ils peuvent montrer fièrement à leur entourage
- **Reconnaissance :** Design "qui leur ressemble" - reflète leur couple et leur histoire unique avec leurs propres photos
- **Reconnaissance sociale :** Compliments des invités sur le Save the Date ("Wow, c'est magnifique !")

### Business Success

**Timeline de succès :**

**3 mois post-lancement (Septembre 2026) :**
- **Break-even atteint : 200€ de revenus nets**
  - Équivalent : 5 packs à 49€ OU 11 singles à 19.90€
  - Remboursement des dépenses initiales (tests API + hébergement)
- **Objectif :** Validation que le concept fonctionne et que des couples sont prêts à payer

**12 mois post-lancement (Juin 2027) :**
- **Revenus récurrents : ≥1K€ net/mois** (minimum)
  - Équivalent : ~21 packs/mois à 49€
  - Plus que 1K€/mois = bonus et signal de forte traction
- **SaaS en ligne et maintenu activement** (pas en autopilot)
- **Signal de succès :** Le produit a trouvé son product-market fit et génère des revenus prévisibles

**Métriques additionnelles :**
- **First-mover advantage maintenu** : Lancement juin 2026, capture du marché avant que Canva ajoute une feature similaire (fenêtre estimée : 6-12 mois)
- **Taux de conversion landing → achat** : ≥5% (benchmark e-commerce émotionnel)
- **Coût d'acquisition client (CAC)** : ≤10€ via marketing organique, influenceurs, groupes Facebook mariages

### Technical Success

**Métriques quantitatives (analytics automatiques) :**
- **Nombre moyen d'itérations par commande : ≤2.5** - Prouve que les prompts optimisés fonctionnent
- **Taux de succès génération API : >95%** - Moins de 5% d'échecs techniques (timeout, erreur Gemini, etc.)
- **Temps moyen de génération : <30 secondes** - Performance acceptable pour MVP sync
- **Coût moyen par commande : ≤0.60€** - Maintient rentabilité (marge >95% sur pack 49€, >96% sur single 19.90€)

**Métriques qualitatives (feedback client) :**
- **Note moyenne satisfaction design : ≥4/5 étoiles** - Survey post-achat automatique
- **Feedback verbatim positifs** - Collecter témoignages enthousiastes pour marketing

**Objectifs infrastructure :**
- **Uptime : ≥99%** - Disponibilité durant saison mariages (juillet-sept critique)
- **Zero data loss** - Photos utilisateurs sécurisées, backups S3
- **RGPD compliance basique** - Photos supprimées après 7 jours, politique claire affichée

### Measurable Outcomes

**Indicateurs clés de réussite globale :**

**À 3 mois :**
- ✅ 5-10 clients payants minimum (break-even)
- ✅ Taux refund <10%
- ✅ Feedback positifs majoritaires (≥70%)
- ✅ Coûts API maîtrisés (<0.60€/commande)

**À 12 mois :**
- ✅ 250-300 clients cumulés (21 packs/mois × 12 mois)
- ✅ 1K€+ net/mois en revenus récurrents
- ✅ Note moyenne ≥4/5 étoiles
- ✅ SaaS techniquement stable (uptime >99%)
- ✅ Apprentissage entrepreneurial complet (marketing, product, business, tech)

**Signal d'échec (pour pivoter ou arrêter) :**
- ❌ Pas de break-even à 6 mois (≥400€ dépensés, <200€ revenus)
- ❌ Taux refund >20% (qualité insuffisante)
- ❌ Coûts API explosent (>1€/commande = non rentable)
- ❌ Zero traction organique après 3 mois (marketing inefficace)

## Product Scope

Voir section **Project Scoping & Phased Development** ci-dessous pour l'ensemble complet des features MVP, timeline et allocation des ressources. Ce PRD suit une approche phasée : Experience MVP (Juin 2026) → Growth Features (Sept-Nov 2026) → Expansion Platform (2027).

## User Journeys

### Journey 1 : Sophie & Thomas - Le Parcours Idéal (Happy Path)

**Persona :** Sophie & Thomas, couple de 28 ans en préparation de mariage

#### 🎬 Opening Scene - La Douleur Actuelle

**Date :** 15 avril 2026, 21h30  
**Lieu :** Appartement de Sophie et Thomas, canapé du salon

Sophie ferme son laptop avec un soupir de frustration. Ça fait 2 heures qu'elle scrolle sur Canva. **47 templates de Save the Date vus**. Certains sont beaux, mais aucun ne capture "eux". Tout semble... générique.

Thomas lui demande : _"Alors, t'as trouvé ?"_  
Sophie : _"Non... Tout se ressemble. Je veux quelque chose avec nos photos d'Islande, mais je ne sais pas faire du design moi. Et payer 300€ un designer pour un Save the Date, c'est trop."_

**État émotionnel :** Frustrée, paralysée par le choix, anxieuse (le mariage est dans 5 mois)

#### ⚡ Rising Action - La Découverte

**23h15 - Sur son téléphone, au lit**

Sophie scroll Instagram et tombe sur un post d'une influenceuse mariage : _"J'ai découvert ce site génial qui génère des Save the Date avec VOS photos via IA. J'ai eu le mien en 10 minutes, regardez le résultat !"_

Sophie clique le lien. Elle arrive sur **poster-generator**.

**Landing page :**
- Elle voit une galerie de 5 templates magnifiques
- Un titre clair : _"Générez votre Save the Date unique avec vos propres photos en 15 minutes"_
- Pricing transparent : 19.90€
- Rassurance : _"Vos photos restent privées et sont supprimées après 7 jours"_

**État émotionnel :** Curiosité, lueur d'espoir ("et si ça marchait ?")

#### 🎨 Rising Action - L'Expérience

**23h20 - Elle se redresse dans le lit, excitée**

Sophie lance le processus :

**Étape 1 - Choix du template (30 secondes)**  
Elle browse la galerie. Le style **"Bohème Moderne"** lui fait battre le cœur. _"C'est exactement nous !"_

**Étape 2 - Upload photos (1 minute)**  
Elle choisit 2 photos de leur voyage en Islande :
- Photo 1 : Eux deux devant une cascade (moment de la demande en mariage)
- Photo 2 : Portrait couple au coucher de soleil

Upload instantané. Preview s'affiche.

**Étape 3 - Génération IA (30 secondes)**  
Elle clique "Générer mon Save the Date".

Un loader apparaît avec un message chaleureux :  
_"✨ Analyse de vos photos... (5s)"_  
_"🎨 Création de votre design unique... (20s)"_  
_"✅ Finalisation... (5s)"_

Pendant le loading, elle lit : _"Saviez-vous que 78% des invités disent que le Save the Date donne le ton de tout le mariage ?"_

**État émotionnel :** Anticipation, un peu d'anxiété ("est-ce que ça va être beau ?")

#### 💎 Climax - Le Moment Magique

**23h21 - Le design apparaît**

L'écran affiche le Save the Date généré.

Sophie reste bouche bée.

**Le design :**
- Leurs deux photos intégrées harmonieusement dans une composition bohème
- Palette de couleurs extraite de leurs photos (bleus glaciaires, roses dorés)
- Texte élégant : "Sophie & Thomas - 20 Septembre 2026 - Château de Lastours"
- Style qui capture EXACTEMENT le vibe de leur couple

Sophie : _"Thomas... THOMAS ! Regarde ça !"_

Thomas se penche. Silence. Puis : _"Bah... c'est incroyable. C'est nous. C'est vraiment nous."_

Sophie a les larmes aux yeux. **Ce design raconte leur histoire**. L'Islande. Leur aventure. Leur amour.

**État émotionnel :** Émotion pure, soulagement intense, fierté

#### ✅ Resolution - La Nouvelle Réalité

**23h25 - Achat immédiat**

Sophie clique "Acheter - 19.90€" sans hésiter.  
Paiement Stripe en 30 secondes.  
Email reçu instantanément avec le fichier haute résolution.

**23h30 - Premier partage**

Sophie envoie le design à sa maman sur WhatsApp.  
Réponse immédiate : _"C'est MAGNIFIQUE ma chérie !! 😍😍😍 On dirait un vrai designer professionnel !"_

**Le lendemain matin**

Sophie poste le Save the Date sur Instagram.  
**23 commentaires en 2 heures**, tous enthousiastes :
- _"Wow, il est sublime ! Vous l'avez fait faire où ?"_
- _"J'adore qu'on voit VOS vraies photos, c'est tellement vous !"_
- _"Je veux le même pour mon mariage !!"_

**État émotionnel final :** Fierté immense, mission accomplie, reconnaissance sociale validée

**Transformation :**
- **Avant :** Frustrée, paralysée, 2h perdues sur Canva, aucun résultat
- **Après :** Design parfait en 10 minutes, 19.90€, fierté immense, compliments de tous

---

### Journey 2 : Claire & Marc - Le Parcours Complexe (Edge Case)

**Persona :** Claire, 31 ans, graphiste professionnelle & Marc, 33 ans, ingénieur

#### 🎬 Opening Scene - Des Attentes Très Précises

**Date :** 3 juin 2026, 14h  
**Lieu :** Bureau de Claire, pause déjeuner

Claire, graphiste de métier, découvre poster-generator via un groupe Facebook mariages. Elle est **sceptique** mais curieuse.

_"Marc, regarde ce site. Ça génère des Save the Date avec l'IA. Bon, je suis graphiste donc j'ai l'œil... on va voir ce que ça donne."_

Marc, pragmatique : _"19.90€, ça vaut le coup de tester. Si c'est nul, on demande un remboursement."_

**État émotionnel :** Scepticisme, attentes élevées (professionnelle du design), approche "test & learn"

#### ⚡ Rising Action - Premier Essai Décevant

**14h10 - Sélection template "Classique"**

Claire upload leurs 2 photos :
- Photo 1 : Portrait studio professionnel (très haute résolution, 15MB)
- Photo 2 : Selfie en soirée (photo sombre, visages coupés)

**Problème #1 - Upload bloqué**  
Message d'erreur : _"⚠️ Photo 1 dépasse la limite de 10MB. Veuillez réduire la taille du fichier."_

Claire soupire, compresse la photo, re-upload. Cette fois ça passe.

**14h15 - Génération... et déception**

Le design s'affiche après 28 secondes.

Claire fronce les sourcils : _"Mouais... Le placement des photos est bizarre. Et on voit pas bien nos visages sur la photo 2, c'est trop sombre."_

**État émotionnel :** Déception initiale, doute, mais volonté de donner une 2e chance

#### 🔄 Rising Action - Itérations & Apprentissage

**14h20 - Deuxième tentative (Itération 1)**

Claire clique sur **"Générer une nouvelle version"**.

Un message apparaît :  
_"💡 Conseil : Pour de meilleurs résultats, utilisez des photos bien éclairées où vos visages sont clairement visibles. Voulez-vous changer vos photos ?"_

Claire remplace la Photo 2 par une photo de leur voyage au Portugal (bien éclairée, composition centrée).

**Génération - 2e essai**

Le nouveau design s'affiche.

Claire : _"Là c'est déjà BEAUCOUP mieux ! Les visages sont clairs. Mais... je trouve que le texte est trop petit. Et j'aimerais que nos photos soient plus grandes."_

**Système de feedback intelligent :** Claire coche "Texte trop petit" et "Photos pas assez visibles" dans un formulaire rapide.

**État émotionnel :** Encouragement ("ça s'améliore"), mais toujours pas 100% satisfaite

#### 🎨 Rising Action - Support Client & Résolution

**14h25 - Troisième tentative (Itération 2)**

Claire re-génère une 3e fois. Le prompt Gemini a été enrichi avec son feedback : "Increase text size, make photos more prominent".

Le design s'affiche... et cette fois, elle sourit.

Claire : _"OK là c'est bon ! Les photos sont bien mises en valeur, le texte est lisible. C'est exactement ce que je voulais."_

Marc : _"Nickel. On prend celui-là !"_

**Tracking itérations :**  
Message visible : _"ℹ️ Vous avez utilisé 2 itérations sur 3 incluses dans le prix. Il vous reste 1 itération gratuite."_

**État émotionnel :** Satisfaction, confiance restaurée

#### 💳 Climax - Achat avec Confiance

**14h30 - Paiement**

Claire clique "Acheter - 19.90€". Paiement Stripe. Confirmation immédiate.

Email reçu avec le fichier haute résolution + message : _"Merci Claire & Marc ! 💕 Si vous avez la moindre question, répondez simplement à cet email."_

Claire à Marc : _"Bon finalement, pour 19.90€ et 20 minutes de mon temps, c'est un super deal. J'aurais mis 3 heures à faire ça moi-même sur Photoshop."_

**État émotionnel :** Satisfaction rationnelle (bon ROI temps/argent), validation professionnelle

#### ✅ Resolution - Devenir Ambassadrice

**Le soir même - 20h**

Claire poste dans le groupe Facebook mariages :

_"Update : J'ai testé poster-generator cet après-midi. En tant que graphiste, j'étais sceptique, mais franchement c'est bien fait. Quelques conseils si vous l'utilisez :_
- _Utilisez des photos bien éclairées (pas de selfies sombres)_
- _Limitez la taille des fichiers à 10MB max_
- _N'hésitez pas à faire 2-3 essais, c'est inclus dans le prix_
- _Le système de feedback entre itérations aide vraiment à affiner le résultat_
- _Résultat final : 👍 pour 19.90€"_

**23 likes, 8 commentaires de futures mariées intéressées.**

**Transformation :**
- **Avant :** Sceptique, attentes élevées (pro du design), test "pour voir"
- **Après :** Satisfaite, ambassadrice du produit, recommande avec conseils pratiques

---

### Journey 3 : Aldo - Gérer et Faire Grandir le SaaS

**Persona :** Aldo, créateur et admin du SaaS, développeur solo

#### 🎬 Opening Scene - Lancement Imminent

**Date :** 15 juin 2026, 8h30  
**Lieu :** Bureau à domicile, café en main

MVP déployé en production hier soir. Le site est **LIVE**.

Vercel Analytics : **0 visiteurs**.  
Stripe Dashboard : **0€ de revenus**.

Sentiment : Mélange d'excitation ("j'ai FINI un projet !") et d'anxiété ("et si personne ne vient ?").

Posts dans 3 groupes Facebook mariages avec un message simple.

**État émotionnel :** Nervosité, anticipation, espoir

#### ⚡ Rising Action - Premiers Signaux de Vie

**16h00 - Premier visiteur !**

Google Analytics : 1 visiteur, session 12 secondes, bounce.

**17h30 - Traffic spike**

Analytics : 23 visiteurs en 2h. Certains restent 2-3 minutes.  
**0 conversions** encore.

**18h45 - Première commande ! 🎉**

Notification Stripe : _"Payment succeeded - 19.90€"_

Vérifications immédiates :
- Logs backend : Génération réussie, 24 secondes
- Coût API Gemini : 0.52€ (dans le budget)
- Email envoyé : ✅ Delivered

**PREMIÈRE VENTE**. Quelqu'un a payé. Le concept marche.

**État émotionnel :** Euphorie, validation, soulagement

#### 📊 Rising Action - Monitoring & Optimisation (Jours 1-7)

**Jour 2 - Dashboard Admin artisanal**

Google Sheets tracking manuel :
- **Revenus :** 59.70€ (3 commandes)
- **Coûts API :** 1.48€ (moyenne 0.49€/commande)
- **Marge brute :** 58.22€ (97% de marge !)
- **Taux conversion :** 3 / 47 visiteurs = 6.4%

Constat : "6.4% de conversion sans pub payante ? Le pricing 19.90€ passe bien."

**Jour 3 - Premier bug critique**

Email client : _"J'ai payé mais je n'ai pas reçu mon design par email."_

Investigation :
- Stripe : Paiement confirmé ✅
- Logs : Génération réussie ✅
- Email service : Erreur 500 - "Invalid recipient email"

**Problème :** Espace dans l'email input (`" sophie@gmail.com "`).

Fix en 20 minutes (trim email), re-génération manuelle, envoi.

Réponse client 1h après : _"Merci beaucoup ! Le design est magnifique 😍"_

**État émotionnel :** Stress → Résolution → Fierté (support réactif)

#### 🔥 Climax - Explosion de Traffic (Jour 14)

**29 juin 2026, 10h - Notification avalanche**

**+12 commandes en 2 heures.**

Analytics : **487 visiteurs aujourd'hui** (vs. 20-30/jour normalement).

Investigation :
- Source : Instagram (87%)
- Referrer : Post influenceuse mariage (42K followers)

Son post : _"Coup de cœur pour ce site qui génère des Save the Date avec VOS photos via IA ! Résultat en 10 min, 19.90€. Foncez ! 💕"_

**478 likes, 89 commentaires.**

Dashboard Real-Time :
- Revenus du jour : 358.20€ (18 commandes)
- Coûts API : 9.36€
- Marge : 348.84€

Réalisation : "En 1 jour, j'ai fait plus que mes 3 premiers mois objectif... Et c'est organique."

**État émotionnel :** Incrédulité, euphorie, gratitude

#### ⚠️ Rising Action - Gestion de Crise (Jour 15)

**30 juin, 8h - API Gemini Rate Limit**

Email monitoring : _"⚠️ 3 générations ont échoué dans la dernière heure"_

Logs : **Error 429 - Rate Limit Exceeded** (Gemini API).

**Solution immédiate :**
1. Upgrade compte Gemini API (plan payant, quotas élevés)
2. Message sur le site : _"⏱️ Forte demande. Génération peut prendre jusqu'à 60s."_
3. Note mentale : "Architecture async nécessaire BIENTÔT. Sync ne scale pas au-delà de 20 commandes/jour."

Crise évitée. Les clients reçoivent leurs designs.

**État émotionnel :** Stress → Action → Relief

#### ✅ Resolution - Routine d'Admin Installée (Jour 30)

**14 juillet 2026 - Routine quotidienne**

**Chaque matin, 9h :**

1. Dashboard Stripe : Revenus 24h
2. Google Sheets :
   - Commandes : 47 total
   - Revenus cumulés : 935.30€
   - Coûts API : 24.44€
   - **Marge nette : 910.86€** 🎉
   - **Break-even ATTEINT** (objectif 200€ dépassé × 4.5 !)

3. Analytics : 75% organique, 15% Instagram, 10% Facebook
4. Emails support : 2-3/semaine (temps réponse 2h)
5. Logs backend : Vérifier erreurs (1-2% taux échec)

**Réflexion :**

_"1 mois de live. 47 clients. 935€ de revenus._

_Le concept marche. Les couples payent. La qualité IA est bonne._

_Prochaines étapes :_
- _Architecture async (traffic augmente)_
- _Feedback système itérations (Claire & Marc)_
- _Tester pack 49€ (Growth)_

_Mais surtout : **J'AI FINI UN PROJET**. Ça tourne. Ça génère des revenus. C'est vivant."_

**État émotionnel final :** Fierté immense, confiance, momentum entrepreneurial

**Transformation :**
- **Avant :** Doute de finir, peur d'abandon, zéro projet livré
- **Après :** Projet LIVE, clients payants, revenus récurrents, compétences validées

---

### Journey Requirements Summary

Les 3 parcours utilisateurs révèlent les **capabilities essentielles** suivantes :

#### Requirements du Journey 1 (Sophie & Thomas - Happy Path)

**Product Core :**
- Galerie de templates inspirante avec aperçus visuels clairs (5 templates MVP)
- Upload photos simple (drag & drop, max 2 photos, 10MB, JPG/PNG)
- Génération IA rapide (<30s) avec prompts optimisés par template
- Loading UX engageant (progress messages + fun facts)
- Preview haute qualité du design généré
- Paiement Stripe fluide (checkout <1 min)
- Delivery immédiate par email (fichier haute résolution)

**Marketing & Trust :**
- Pricing transparent (19.90€ affiché clairement)
- Rassurance privacy ("Photos supprimées après 7 jours")
- Social proof (témoignages, cas d'usage)

**Emotional Design :**
- Messaging empathique (comprend la pression émotionnelle)
- Before/After contrast clair dans la communication

#### Requirements du Journey 2 (Claire & Marc - Edge Case)

**Error Handling & Validation :**
- Validation upload (limite 10MB, messages d'erreur clairs avec solution)
- Photo quality detection (conseils si photos sombres/mal cadrées)
- Iteration tracking (compteur "2/3 itérations utilisées" visible)
- Pricing transparent itérations supplémentaires (2€ pour 1, 6€ pour 5)

**🎯 Iteration Feedback System (CRITIQUE) :**
- **Feedback guidé après chaque génération** :
  - Checkboxes rapides : "Texte trop grand/petit", "Photos pas assez visibles", "Couleurs pas adaptées", "Style pas assez [X]"
  - Champ libre optionnel : "Autre feedback..."
  - **Ce feedback enrichit automatiquement le prompt Gemini** pour l'itération suivante
- **Bénéfices :** Itérations intelligentes (pas random), user en contrôle, augmente satisfaction en ≤3 itérations

**User Guidance :**
- Tips contextuels ("Pour meilleurs résultats, photos bien éclairées...")
- Recovery path clair (possibilité changer photos entre itérations)
- Expectations management (combien d'itérations restent)

**Support & Trust :**
- Support email accessible ("Répondez à cet email pour questions")
- Confirmation après achat avec encouragement
- No dark patterns (compteur honnête, pricing transparent)

#### Requirements du Journey 3 (Aldo Admin)

**Monitoring & Analytics :**
- Dashboard admin basique (revenus, commandes, coûts API, marges)
- Logs backend (trace chaque génération : succès/échec, durée, coût)
- Alertes automatiques (email si taux erreur >5% ou coûts dépassent seuil)
- Analytics traffic (Google Analytics : sources, conversions, bounce)

**Support Client :**
- Email support simple (adresse visible, réponse manuelle rapide OK pour MVP)
- Re-send capability (renvoyer design manuellement si email fail)
- Logs client (historique commandes par email pour troubleshooting)

**Infrastructure & Reliability :**
- Error handling robuste (retry logic, messages clairs)
- Rate limit monitoring (détection quotas Gemini API)
- Scalability awareness (savoir quand migrer sync → async : seuil 20 commandes/jour)

**Business Intelligence :**
- Cost tracking (coût par commande calculé auto)
- Conversion tracking (visiteurs → commandes, objectif ≥5%)
- Revenue milestones (break-even, 1K€/mois, etc.)

**Crisis Management :**
- Backup plans (si Gemini API down : message user, retry)
- Manual override (capacité intervenir manuellement : re-gen, refund, support)

#### Priorités d'Implémentation

**MVP Critical (8 semaines) :**
- ✅ Core product flow (Journey 1)
- ✅ Basic error handling (Journey 2)
- ✅ Simple admin monitoring (Journey 3)
- ✅ Iteration feedback system (Journey 2 - différenciateur clé)

**Growth (Post-MVP) :**
- Advanced analytics dashboard
- Automated support workflows
- Architecture async (>20 commandes/jour)
- Pack complet 49€


## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Iteration Feedback System - Collaborative AI Generation**

**Problème résolu :** Les générateurs d'images IA actuels (Midjourney, DALL-E, Stable Diffusion) proposent des variations aléatoires sans contrôle utilisateur précis. L'utilisateur "re-roule les dés" sans comprendre pourquoi Variation 1 ≠ Variation 2.

**Notre approche innovante :**
- Après chaque génération, l'utilisateur donne un **feedback structuré** via checkboxes rapides :
  - "Texte trop grand/petit"
  - "Photos pas assez visibles"
  - "Couleurs pas adaptées"
  - "Style pas assez [Bohème/Moderne/etc.]"
  - Champ libre optionnel
- Ce feedback **enrichit automatiquement le prompt Gemini** pour l'itération suivante
- **Résultat :** Itérations intelligentes et ciblées, pas re-génération aléatoire

**Différenciation compétitive :**
- Canva : Templates statiques, zéro IA
- Générateurs IA classiques : Re-génération random sans guidage
- **Poster-generator :** Collaboration intelligente User ↔ IA avec feedback loop

**Impact attendu :**
- Augmente taux de satisfaction en ≤3 itérations (objectif ≥80%)
- Réduit frustration utilisateur ("je contrôle le résultat")
- Crée un moat défendable (UX thoughtful que les gros acteurs ne copieront pas immédiatement)

---

**2. Emotional Design Generator - "Design Qui Leur Ressemble"**

**Problème résolu :** Les outils de design actuels créent des résultats génériques ou nécessitent des compétences techniques (Canva = DIY complexe, Fiverr designers = cher + lent).

**Notre approche innovante :**
- **Combination unique :** Photos personnelles + IA générative + Prompts émotionnels optimisés
- **Positionnement :** Pas "beau design générique" → "Design qui capture l'histoire du couple"
- **Exemple :** Photos Islande (demande en mariage) → Save the Date bohème qui raconte cette histoire
- **Valeur émotionnelle élevée :** Reconnaissance sociale, fierté, design unique

**Différenciation :**
- **vs Canva :** Canva = templates génériques. Poster-generator = 100% personnalisé avec VOS photos.
- **vs Designers humains :** Designers = 300€ + 2-3 semaines. Poster-generator = 19.90€ + 15 minutes.
- **vs IA génériques :** IA classiques = jolies images abstraites. Poster-generator = designs chargés émotionnellement, contexte mariage intégré.

---

**3. Wedding-Specific AI Prompt Engineering**

**Innovation technique :** Prompts optimisés par template (Bohème, Moderne, Classique, Vintage, Minimaliste) avec contexte événementiel intégré.

**R&D Produit :**
- Phase de validation (pré-MVP) : Tester 50-100 générations par template
- Optimiser prompts pour atteindre **95% de satisfaction en ≤3 itérations**
- Adapter prompts selon feedback utilisateur accumulé (amélioration continue)

**Risque technique :** Qualité inconsistante si prompts pas assez affinés. Mitigation : Phase de tests payante pré-lancement (50€ tests API budget).

---

**4. Pinterest-Inspired Design (Growth Phase - Future Innovation)**

**Vision future :** Hyper-personnalisation via Vision AI.

**Concept :**
- User paste URL Pinterest ou upload image de style qu'ils aiment
- Vision AI analyse style (couleurs, layout, fonts, vibe)
- Prompt Gemini ajusté automatiquement pour "copier" ce style avec les photos du couple

**Timing :** Post-MVP (Growth phase) si MVP valide le concept de base.

**Différenciation massive :** Aucun concurrent actuel n'offre "montre-moi un design que j'aime, l'IA s'en inspire avec mes photos".

---

### Market Context & Competitive Landscape

**État du marché (2026) :**
- **Canva :** Leader DIY design, 150M+ utilisateurs, mais 100% templates statiques (zéro IA personnalisée avec photos user)
- **Générateurs IA (Midjourney, DALL-E) :** Puissants mais génériques, pas contexte événementiel, pas adaptés aux mariages
- **Designers Fiverr/Malt :** 50-500€, délai 2-3 semaines, qualité variable
- **Templates Etsy :** 5-15€, DIY complexe (Photoshop requis)

**Fenêtre d'opportunité :**
- **First-mover advantage :** 6-12 mois avant que Canva/Adobe ajoutent feature similaire
- **Niche défendable :** Vertical mariage × IA personnalisée = blue ocean temporaire
- **Timing parfait :** Vague IA générative (2024-2026), couples post-COVID veulent personnalisation + digital

**Positionnement unique :**
- **vs Canva :** "100% personnalisé (vos photos) vs templates génériques"
- **vs IA classiques :** "Contexte mariage + prompts émotionnels vs génération abstraite"
- **vs Designers :** "19.90€ + 15min vs 300€ + 3 semaines"

**Moat défendable :**
- Prompts optimisés mariages (R&D propriétaire)
- Feedback-guided iteration system (UX différenciant)
- Data loop : Plus de clients → Meilleurs prompts → Meilleure qualité → Plus de clients

---

### Validation Approach

**Validation de l'innovation Feedback System :**

**Hypothèse à tester :**  
_"Le système de feedback guidé augmente le taux de satisfaction utilisateur en ≤3 itérations comparé à la re-génération basique."_

**Méthodologie A/B Testing :**
- **Groupe A (Control) :** Génération basique, bouton "Re-générer" sans feedback
- **Groupe B (Test) :** Génération avec feedback guidé (checkboxes + prompt enrichment)

**Métriques de succès :**
- **Taux de satisfaction ≤3 itérations :** Groupe B ≥ Groupe A + 15%
- **Nombre moyen d'itérations :** Groupe B ≤ Groupe A
- **Taux de conversion (génération → achat) :** Groupe B ≥ Groupe A + 10%
- **NPS / Feedback qualitatif :** "J'avais le contrôle du résultat" (Groupe B)

**Timeline validation :**
- **Semaines 1-4 post-MVP :** Collecter données (20-30 utilisateurs minimum par groupe)
- **Semaine 5 :** Analyser résultats
- **Décision :** Si Test > Control de manière significative → Garder. Sinon → Revenir à basique.

**Fallback si échec :**
- Supprimer feedback system
- Revenir à re-génération basique (bouton "Générer une nouvelle version" sans guidage)
- **Coût de l'échec :** ~8-10h de dev "perdues", mais learning précieux sur les users

---

**Validation de la qualité prompts (Wedding-Specific AI) :**

**Phase pré-MVP (Budget 50€ tests API) :**
- Générer 50-100 Save the Dates test avec 5 templates
- Tester avec photos variées (couples différents, styles photo différents)
- Mesurer taux de "designs satisfaisants" subjectif
- **Objectif :** ≥80% des générations sont "acceptables" dès premier essai

**Métriques post-lancement :**
- **Taux d'acceptation en 1 itération :** ≥50% (génération parfaite du premier coup)
- **Taux d'acceptation en ≤3 itérations :** ≥80% (objectif succès utilisateur)
- **Taux de refund :** <10% (qualité perçue insuffisante si >10%)

---

### Risk Mitigation

**Risque #1 : Le feedback guidé ne fonctionne pas mieux que random**

**Probabilité :** Moyenne (30%)  
**Impact :** Faible (feature non-essentielle, fallback facile)

**Mitigation :**
- A/B testing rigoureux avant de forcer l'adoption
- **Fallback immédiat :** Revenir à re-génération basique si data montre pas d'amélioration
- Coût faible : 8-10h dev, mais learning précieux

---

**Risque #2 : Qualité prompts inconsistante (génération "moches")**

**Probabilité :** Moyenne-Haute (40%)  
**Impact :** Critique (tue le produit si >20% refunds)

**Mitigation :**
- **Phase de validation API pré-MVP** (50€ budget tests, 50-100 générations)
- Optimisation iterative des prompts template par template
- **Quality assurance :** Tester avec photos variées (luminosité, composition, résolution)
- **Monitoring post-launch :** Si taux refund >10%, pause marketing + fix prompts

---

**Risque #3 : Canva/Adobe lancent feature similaire (gratuit)**

**Probabilité :** Moyenne-Haute (50% dans 6-12 mois)  
**Impact :** Critique (tue le business si pricing = 0€)

**Mitigation :**
- **First-mover advantage :** Capturer early adopters avant que gros acteurs réagissent
- **Moat défendable :** Prompts optimisés mariages + feedback system = différenciation UX
- **Niche focus :** Vertical mariage profond (templates, messaging, contexte) vs feature générique Canva
- **Community & brand :** Testimonials, influenceurs, SEO "Save the Date IA" = brand equity
- **Pivot option :** Si Canva gratuit, pivot vers B2B (wedding planners API integration, white-label)

---

**Risque #4 : Pinterest-inspired feature trop complexe à implémenter**

**Probabilité :** Haute (60%)  
**Impact :** Faible (feature Growth, pas MVP)

**Mitigation :**
- **Ne PAS inclure dans MVP** (scope sanctuaire respecté !)
- Tester faisabilité technique APRÈS validation MVP
- **Alternative plus simple :** Au lieu de Vision AI, proposer "Décrivez le style que vous voulez" (text input libre enrichit prompt)
- Si trop complexe, abandonner sans regret (MVP a déjà validé le concept)


## Web Application Specific Requirements

### Project-Type Overview

**poster-generator** est une **application web moderne (SPA/SSR hybrid)** optimisée pour l'acquisition mobile-first et le SEO organique. L'architecture sépare clairement le frontend (Next.js) du backend (AdonisJS) pour permettre une scalabilité indépendante et un déploiement optimisé.

**Type de projet :** API-First Web Application (B2C Transactionnel)  
**Stack Frontend :** Next.js 15 (App Router) avec Server-Side Rendering  
**Stack Backend :** AdonisJS 6 API RESTful  
**Déploiement :** Vercel (frontend) + Railway (backend)

---

### Technical Architecture Considerations

#### Frontend Architecture

**Framework : Next.js 15 (App Router)**

**Choix architectural :**
- **Server-Side Rendering (SSR)** pour optimisation SEO dès le MVP
- **App Router** (nouvelle architecture Next.js 13+) pour routing moderne
- **React Server Components** pour performance optimale
- **Stratégie de rendu :** Hybride SSR (pages dynamiques) + SSG (pages statiques comme landing)

**Justification :**
- SEO critique pour acquisition organique long-terme ("save the date IA", "faire-part mariage IA")
- Acquisition initiale via réseaux sociaux (Instagram, Facebook), mais Google Search = canal de croissance
- Évite migration React SPA → Next.js future (économie 30h dev)
- Next.js + Vercel = déploiement 1-click, auto-scaling, edge optimization

**Alternative considérée :** React SPA (Vite) + migration Next.js post-MVP  
**Décision :** Next.js dès MVP pour SEO from day 1 et éviter dette technique

---

#### Browser Support & Compatibility

**Navigateurs supportés :**
- **Desktop :** Chrome, Firefox, Safari, Edge (versions modernes, derniers 2 ans)
- **Mobile :** Safari iOS 14+, Chrome Android (versions modernes)
- **Pas de support :** Internet Explorer, navigateurs obsolètes (<2 ans)

**Responsive Design : Mobile-First (CRITIQUE)**

**Breakpoints :**
- **Mobile :** <768px (priorité #1, 60-70% du trafic attendu)
- **Tablet :** 768px - 1024px
- **Desktop :** >1024px

**Justification Mobile-First :**
- Couples cherchent solutions mariage principalement sur mobile (Instagram scroll, Facebook groupes)
- Parcours utilisateur typique : Découverte mobile → Test mobile → Achat (mobile ou desktop)
- **Upload photos mobile** doit être ultra-smooth (accès appareil photo natif)
- Touch-friendly UI (boutons ≥44px, pas de hover critique)

**Testing requis :**
- Tests manuels sur iPhone (Safari) et Android (Chrome)
- Responsive testing Chrome DevTools (breakpoints multiples)
- Touch interactions (upload, navigation, forms)

---

#### SEO Strategy

**Approche SEO : Basique MVP, Expansion Growth**

**Phase 1 - MVP (Mois 1-3) : SEO Basique**

**Meta Tags optimisés :**
```html
<!-- SEO primaire -->
<title>Créez votre Save the Date unique avec l'IA | Poster Generator</title>
<meta name="description" content="Générez un Save the Date 100% personnalisé avec vos photos en 15 minutes grâce à l'IA. 19.90€. Parfait pour votre mariage." />

<!-- Open Graph (partage social - CRITIQUE) -->
<meta property="og:title" content="Save the Date personnalisé par IA" />
<meta property="og:description" content="Votre Save the Date unique en 15 min avec vos photos" />
<meta property="og:image" content="https://poster-generator.com/og-image.jpg" />
<meta property="og:url" content="https://poster-generator.com" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://poster-generator.com/twitter-card.jpg" />
```

**Landing Page Content (Texte indexable) :**
- Section "Comment ça marche" (H2) avec étapes textuelles
- FAQ section (Google adore les FAQ structurées)
- Témoignages clients en texte (pas juste screenshots)
- **Ratio texte/images :** Minimum 300-500 mots de contenu textuel indexable

**SEO Technique :**
- **Sitemap.xml** généré automatiquement (Next.js)
- **Robots.txt** optimisé
- **Google Search Console** setup dès lancement
- **Lighthouse audit** score ≥90 (performance, SEO, accessibility)

**Canaux d'acquisition MVP :**
1. **Social media** (Instagram, Facebook, TikTok) - Canal primaire (70%)
2. **Influenceurs mariages** - Validation et viralité (20%)
3. **Google Search organique** - Long-terme (10% initial, croissance future)

---

**Phase 2 - Growth (Mois 4-6) : SEO Expansion**

Si Google Search devient canal significatif (>20% traffic) :
- **Blog intégré** : "Comment créer un Save the Date 2026", "Idées Save the Date originales", etc.
- **SEO local** : "Save the Date mariage Lyon", "Faire-part Toulouse" (pages géo-ciblées)
- **Backlinks** : Partenariats blogs mariages, sites événementiels
- **Rich Snippets** : Schema.org markup (Product, Review, FAQ)

**Ressources SEO :**
- [Google Search Console](https://search.google.com/search-console) - Monitoring indexation
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Audit SEO automatique (Chrome DevTools)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

---

#### Real-Time Communication

**Approche : Server-Sent Events (SSE) pour Progress Updates**

**Problème résolu :**
- Génération IA Gemini prend 20-30 secondes
- Sans feedback temps réel → User angoisse ("Ça marche ? C'est bloqué ?")
- Avec SSE progress bar → Perception temps réduite de 50% (psychologie)

**Implémentation SSE :**

**Backend (AdonisJS) :**
```typescript
// Route SSE pour streaming progress
async generateStream({ request, response }) {
  response.type('text/event-stream')
  response.header('Cache-Control', 'no-cache')
  response.header('Connection', 'keep-alive')
  
  // Emit progress events
  response.stream.write('data: {"progress": 20, "message": "Analyse de vos photos..."}\n\n')
  
  // Call Gemini API
  const result = await geminiAPI.generate(photos, prompt)
  
  response.stream.write('data: {"progress": 80, "message": "Génération de votre design..."}\n\n')
  
  // Final result
  response.stream.write('data: {"progress": 100, "url": "/generated-design.jpg"}\n\n')
  response.stream.end()
}
```

**Frontend (Next.js) :**
```typescript
// Hook React pour SSE
const useGenerationProgress = () => {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  
  const startGeneration = (jobId) => {
    const eventSource = new EventSource(`/api/generate-stream?job=${jobId}`)
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setProgress(data.progress)
      setMessage(data.message)
      
      if (data.progress === 100) {
        eventSource.close()
      }
    }
  }
  
  return { progress, message, startGeneration }
}
```

**UX Progress Display :**
- Barre de progression animée (0% → 100%)
- Messages contextuels : "✨ Analyse de vos photos... (20%)"
- Temps estimé restant : "~15 secondes restantes"
- Fun fact pendant loading (engagement)

**Fallback si SSE fail :**
- Polling API toutes les 2 secondes (GET /api/job-status/:id)
- Spinner simple si SSE pas supporté (navigateurs très anciens)

**Coût dev :** +5h (SSE setup + testing)  
**ROI :** Énorme (UX critique pour perception temps d'attente)

**Ressources :**
- [MDN - Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [AdonisJS Streaming Response](https://docs.adonisjs.com/guides/http/streaming)

---

#### Accessibility Standards

**Norme : WCAG 2.1 Level AA**

**Contrastes Couleurs :**
- **Texte normal :** Ratio de contraste ≥4.5:1
- **Texte large (18pt+) :** Ratio ≥3:1
- **Outil validation :** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Navigation Clavier :**
- Tous les éléments interactifs accessibles via Tab
- Focus visible (outline) sur élément actif
- Ordre de tabulation logique (haut → bas, gauche → droite)
- Upload photos accessible via Enter key

**Labels & Semantic HTML :**
- Tous les inputs ont `<label>` explicites
- Images décoratives : `alt=""` (vide)
- Images informatives : `alt="Description claire"`
- Boutons : Texte descriptif (pas juste icônes sans label)

**Structure Sémantique :**
```html
<nav>Navigation principale</nav>
<main>
  <h1>Titre principal page</h1>
  <section>
    <h2>Sous-section</h2>
  </section>
</main>
<footer>Footer</footer>
```

**Forms Accessibilité :**
- Labels associés (for="inputId")
- Messages d'erreur clairs et annoncés (aria-live)
- Placeholder ≠ Label (toujours un label visible)

**Audit Automatique :**
- **Lighthouse** (Chrome DevTools) - Score accessibilité ≥90
- **axe DevTools** (extension Chrome) - Audit détaillé
- **WAVE** (WebAIM) - Validation manuelle

**Coût dev :** Quasi-zéro si implémenté dès le début (bonnes pratiques HTML)

---

### Implementation Considerations

#### Architecture Déploiement

**Frontend : Vercel**
- Auto-deploy sur push GitHub (branch `main`)
- Edge Functions (CDN mondial, latency <50ms)
- SSL automatique (HTTPS)
- Preview deployments (branches feature)
- **Plan :** Hobby (gratuit jusqu'à 100GB bandwidth/mois)

**Backend : Railway**
- AdonisJS app + PostgreSQL database
- Auto-deploy sur push GitHub
- SSL automatique
- Environment variables sécurisées
- **Plan :** Developer ($5/mois, scale automatique)

**Domaines :**
- **Frontend :** poster-generator.com → Vercel
- **Backend API :** api.poster-generator.com → Railway

**CORS Configuration :**
```typescript
// AdonisJS config/cors.ts
{
  origin: ['https://poster-generator.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: true
}
```

---

#### Performance Targets

**Métriques Lighthouse (objectifs) :**
- **Performance :** ≥90 (mobile), ≥95 (desktop)
- **SEO :** ≥95
- **Accessibility :** ≥90
- **Best Practices :** ≥90

**Core Web Vitals :**
- **LCP (Largest Contentful Paint) :** <2.5s
- **FID (First Input Delay) :** <100ms
- **CLS (Cumulative Layout Shift) :** <0.1

**Optimisations Next.js :**
- Image optimization automatique (`next/image`)
- Code splitting automatique
- Lazy loading components (`next/dynamic`)
- Font optimization (`next/font`)

**Bundle Size :**
- **Initial JS :** <200KB (gzipped)
- **Total page weight :** <1MB (sans images utilisateur)

---

#### Development Tools & Stack

**Frontend :**
- Next.js 15 (App Router)
- React 18
- TypeScript (optionnel MVP, recommandé Growth)
- Tailwind CSS (styling rapide, responsive utilities)
- Axios/Fetch (API calls)

**Backend :**
- AdonisJS 6
- PostgreSQL (database)
- Lucid ORM (AdonisJS built-in)
- Bull (job queue si async architecture future)

**Testing (Post-MVP) :**
- Jest + React Testing Library (frontend)
- Japa (AdonisJS testing framework)
- Playwright (E2E tests)

**Monitoring (Post-MVP) :**
- Vercel Analytics (frontend performance)
- Sentry (error tracking)
- Google Analytics 4 (user behavior)


## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche : Experience MVP (Produit Fini, Scope Réduit)**

Experience MVP plutôt que Lean MVP ultra-minimaliste : expérience complète et aboutie dès jour 1, scope réduit mais qualité d'exécution élevée.

**Rationale stratégique :**
- **Marché émotionnel :** Le mariage est un événement à forte charge émotionnelle. Un prototype "cheap" ne validera pas la proposition de valeur réelle. Les couples attendent un résultat professionnel.
- **Pricing premium (19.90€) :** Un prix non-gratuit nécessite une UX et une qualité perçue proportionnelles. Un MVP "cassé" à 19.90€ ne convertira pas.
- **First-mover advantage :** Capturer early adopters enthousiastes (pas beta-testers tolérants) nécessite un produit fonctionnel et fiable dès le lancement.
- **Différenciation UX :** Le système de feedback itératif et le SSE real-time sont des éléments différenciants qui créent un moat défendable.

**Compromis accepté :**
- Timeline plus longue (8-10 semaines vs 4-6 semaines Lean MVP)
- Budget dev plus élevé (48h vs 15h)
- **ROI :** Meilleur taux de conversion, satisfaction client, et réduction du churn

**Resource Requirements :**
- Solo developer
- 48h développement
- 8-10 semaines timeline
- 200€ budget infrastructure (hébergement + tests API)

---

### MVP Feature Set (Phase 1 - Juin 2026)

**Timeline :** 8-10 semaines (mi-avril à mi-juin 2026)
**Budget dev :** 48h
**Budget infrastructure :** 200€ (hébergement + tests API)

#### Core User Journeys Supportés

**✅ Journey 1 : Sophie & Thomas (Happy Path)**
- Parcours fluide upload → template → génération → preview → achat → delivery
- UX émotionnelle forte (loading engageant, messages chaleureux)
- Résultat satisfaisant en ≤3 itérations

**✅ Journey 2 : Claire & Marc (Edge Case)**
- Gestion erreurs upload (limite 10MB, photos sombres)
- **Système de feedback itératif intelligent** (checkboxes guidées)
- Recovery path clair (changer photos entre itérations)
- Support client accessible

**✅ Journey 3 : Aldo Admin (Monitoring & Croissance)**
- **Dashboard admin basique** (revenus, commandes, coûts API, marges)
- Logs backend (succès/échec générations)
- Alertes automatiques (taux erreur >5%, quotas API)
- Support client manuel (email, re-send capability)

---

#### Must-Have Capabilities MVP

**1. Templates & Styles (10h dev)**
- **5 templates fixes pré-testés** : Bohème, Moderne, Classique, Vintage, Minimaliste
- Galerie visuelle avec aperçus clairs (inspiration émotionnelle)
- Prompts Gemini API optimisés par template
- **Phase validation prompts hybride** : 10-20 tests rapides (20-30€ budget API)

**2. Workflow Utilisateur Complet (15h dev)**
- **Upload photos** : Drag & drop, 2 photos max, 10MB, JPG/PNG, validation erreurs
- **Sélection template** : Galerie responsive mobile-first
- **Génération IA** : Gemini API, résolution 4K, ~30s avec SSE progress
- **Preview design** : Haute qualité, zoom, détails
- **Itérations** : Max 3 incluses, compteur visible
- **Paiement Stripe** : Checkout fluide <1 min, 19.90€
- **Delivery email** : Fichier haute résolution, message chaleureux

**3. 🎯 Système de Feedback Itératif (10h dev) - INNOVATION DIFFÉRENCIANTE**
- **Feedback guidé après chaque génération** :
  - Checkboxes rapides : "Texte trop grand/petit", "Photos pas assez visibles", "Couleurs pas adaptées", "Style pas assez [X]"
  - Champ libre optionnel : "Autre feedback..."
- **Prompt enrichment automatique** : Feedback utilisateur intégré dans prompt Gemini itération suivante
- **UX transparente** : User comprend pourquoi chaque itération améliore le résultat
- **Validation post-launch** : A/B testing Groupe A (feedback) vs Groupe B (sans) pour mesurer impact

**4. Real-Time Progress (SSE) (5h dev)**
- **Server-Sent Events** pour streaming progress
- Progress bar animée (0% → 100%)
- Messages contextuels : "✨ Analyse de vos photos... (20%)"
- Temps estimé restant : "~15 secondes"
- Fun facts pendant loading (engagement)
- **Fallback :** Polling si SSE non supporté

**5. 🔐 Auth & Login Utilisateurs (8h dev)**
- **OAuth Google** : 1-click signup/login (réduit friction conversion)
- **Authentification Email/Password** : Registration, login, logout (AdonisJS Auth built-in)
- Session management (cookies sécurisés)
- **Bénéfices MVP :**
  - Historique commandes utilisateur
  - Re-téléchargement designs achetés (7 jours)
  - Support client facilité (identification user)
  - Email marketing future (newsletter, promotions)
  - **Conversion optimisée** : OAuth Google élimine friction signup (30% boost conversion attendu)
- **UX Implementation Note :**
  - **Bouton primaire** : "Sign in with Google" (prominent, au-dessus fold)
  - **Bouton secondaire** : "Email signup" (plus petit, en-dessous)
  - Pattern B2C moderne (Notion, Linear, etc.) : OAuth first, email fallback
- **Exclusions MVP :**
  - ❌ Facebook/Apple OAuth → Growth (Google suffit pour validation MVP)
  - ❌ Password reset fancy → Email basique suffit
  - ❌ Profil utilisateur éditable → Growth

**6. 📊 Dashboard Admin Basique (5h dev)**
- **Métriques essentielles :**
  - Revenus cumulés & revenus 24h
  - Nombre de commandes (total, aujourd'hui)
  - Coût API moyen par commande
  - Marge brute (revenus - coûts API)
  - Taux de conversion (visiteurs → commandes)
- **Logs backend :**
  - Historique générations (succès/échec, durée, coût)
  - Erreurs API Gemini (monitoring rate limits)
- **Alertes email automatiques :**
  - Taux d'erreur >5% (alerte qualité)
  - Coûts API dépassent seuil (0.70€/commande)
  - Rate limit Gemini API proche
- **Interface :** Dashboard simple (pas fancy), Google Sheets export OK pour MVP
- **Exclusions MVP :**
  - ❌ Analytics avancés (funnels, cohorts) → Growth
  - ❌ Graphiques temps réel → Growth
  - ❌ Gestion utilisateurs admin → Growth

**7. Infrastructure & Reliability (5h dev)**
- **Error handling robuste** : Retry logic, messages clairs utilisateur
- **Validation inputs** : Photos (format, taille), emails (format, trim spaces)
- **RGPD compliance basique** : Photos supprimées après 7 jours, politique affichée
- **Monitoring uptime** : Healthcheck endpoint (/api/health)
- **Backup database** : PostgreSQL backups automatiques (Railway)

---

#### Scope Sanctuaire - Exclusions MVP

**Ces features sont INTERDITES dans MVP (Growth/Vision uniquement) :**

❌ **Pack complet mariage** (Save Date + Faire-part + Remerciements 49€) → **Growth**
❌ **Pinterest-inspired design** (Vision AI style analysis) → **Growth**
❌ **Édition texte avancée** (modifier wording, fonts, layout) → **Growth**
❌ **Facebook/Apple OAuth** → **Growth** (Google OAuth inclus dans MVP pour conversion)
❌ **Dashboard admin fancy** (graphiques, analytics avancés) → **Growth**
❌ **Multi-événements** (naissances, anniversaires) → **Vision**
❌ **App mobile native** → **Vision**
❌ **Prévisualisation avant upload** ("voir à quoi ça ressemblerait") → Growth
❌ **Comparaison side-by-side** (plusieurs générations simultanées) → Growth
❌ **Partage social direct** (LinkedIn/Instagram share buttons) → Growth
❌ **Système de favoris/wishlist** → Growth

**Règle de décision :** Si une feature n'est pas dans la liste "Must-Have MVP" ci-dessus, elle est **automatiquement exclue** du MVP.

---

### Post-MVP Features

#### Phase 2 : Growth (Mois 4-6 post-MVP, Septembre-Novembre 2026)

**Déclencheur :** Break-even atteint à 3 mois (200€ revenus nets) + validation product-market fit

**Fonctionnalités Growth :**

**1. Expansion Produit (15h dev)**
- **Pack complet mariage 49€** : Save the Date + Faire-part + Remerciements
  - Brand Consistency Engine : Extrait style du premier design (couleurs, fonts, layout)
  - Cohérence graphique garantie sur les 3 pièces
  - Pricing attractif : 49€ pack vs 3×19.90€ = 59.70€ (économie 18%)
- **10-15 templates** (au lieu de 5) - Plus de choix, styles variés
- **Itérations payantes** : 3 incluses, puis packs 2€ = 1 itération OU 6€ = 5 itérations

**2. Différenciation Killer (20h dev)**
- **Pinterest-inspired design** :
  - User paste URL Pinterest ou upload image de style qu'ils aiment
  - Vision AI analyse style (couleurs, layout, fonts, vibe)
  - Prompt Gemini ajusté automatiquement pour "copier" ce style avec photos user
  - **Différenciation massive** vs Canva (personnalisation ultime)

**3. Optimisation Technique (12h dev)**
- **Architecture async** : Bull Queue + Redis + Workers + WebSocket
  - Supporte 50-100 générations simultanées (vs 5-10 sync MVP)
  - UX améliorée : Progress bar temps réel, notifications, pas de blocage
- **Dashboard admin amélioré** :
  - Analytics avancés (funnels, taux conversion par étape)
  - Graphiques revenus/coûts temporels
  - Gestion utilisateurs (voir profils, support proactive)

**4. User Experience (8h dev)**
- **OAuth Social Login** : Google, Facebook (réduction friction signup)
- **Profil utilisateur éditable** : Préférences, historique complet, favoris
- **Email marketing** : Newsletter tips mariages, promotions saisonnières
- **Testimonials showcase** : Galerie designs clients (avec permission)

---

#### Phase 3 : Expansion (Mois 6-12 post-MVP, 2027)

**Déclencheur :** 1K€ net/mois récurrents + validation forte traction marché mariage

**Expansion Vision :**

**1. Multi-Événements Platform (40h dev)**
- **Naissances** : Faire-part de naissance, remerciements bébé
  - TAM France : ~700K naissances/an (3× marché mariages = 210K vs 70K)
  - Templates baby-specific (pastels, doux, cute)
  - Pricing identique : 19.90€ single, 49€ pack
- **Anniversaires** : Invitations personnalisées (18 ans, 30 ans, 50 ans, etc.)
- **Autres événements** : Baptêmes, retraites, fêtes familiales

**Positionnement Vision :** _"De la naissance à la retraite, designez chaque moment important de votre vie"_

**2. B2B Corporate Events (30h dev)**
- **Événements d'entreprise** : Séminaires, vœux, lancements produits
- **Pricing B2B** : 199-499€/mois abonnement illimité
- **Marges 10-50× plus élevées** que B2C
- White-label option pour agences événementielles

**3. Extension Technique (40h dev)**
- **API publique** : Intégration par wedding planners, sites mariages partenaires
- **White-label SaaS** : Partenariats avec plateformes événementielles
- **App mobile native** : iOS/Android si forte demande mobile (>80% traffic)

**4. Exit Strategy Potentielle**
- Construction pour acquisition par acteur majeur (Canva, Adobe, The Knot, Mariages.net)
- Valorisation typique SaaS : 3-5× ARR
  - 100K€ ARR → Acquisition 300-500K€

---

### Risk Mitigation Strategy

#### Technical Risks

**Risque #1 : Qualité prompts inconsistante (générations "moches")**

**Probabilité :** Moyenne-Haute (40%)
**Impact :** Critique (tue le produit si >20% refunds)

**Mitigation :**
- **Phase validation prompts hybride pré-MVP** : 10-20 générations test par template (20-30€ budget API)
- Optimisation iterative des prompts template par template
- **Quality assurance** : Tester avec photos variées (luminosité, composition, résolution)
- **Monitoring post-launch** : Si taux refund >10%, pause marketing + fix prompts
- **Fallback :** Si qualité insuffisante, proposer "Garantie satisfait ou remboursé 48h" pour maintenir confiance

**Risque #2 : API Gemini instable ou rate limits**

**Probabilité :** Moyenne (30%)
**Impact :** Critique (service down = 0 revenus)

**Mitigation :**
- **Upgrade compte Gemini API payant** dès MVP (quotas élevés)
- **Monitoring rate limits** : Alertes automatiques si proche seuil
- **Message users proactive** : "⏱️ Forte demande. Génération peut prendre jusqu'à 60s."
- **Architecture async** : Migration rapide en Growth si >20 commandes/jour
- **Fallback :** Si Gemini down >2h, message site + remboursements automatiques

**Risque #3 : Complexité feedback system (bugs, UX confuse)**

**Probabilité :** Moyenne (35%)
**Impact :** Faible (feature non-critique, fallback facile)

**Mitigation :**
- **A/B testing post-launch** : Groupe A (feedback) vs Groupe B (sans) pour valider impact
- **Métriques success** : Si taux satisfaction Groupe A > Groupe B +15%, garder. Sinon désactiver.
- **Fallback immédiat** : Revenir à bouton "Régénérer" basique si data montre pas d'amélioration
- **Coût échec** : 10h dev "perdues", mais learning précieux

---

#### Market Risks

**Risque #1 : Canva/Adobe lancent feature similaire (gratuit)**

**Probabilité :** Moyenne-Haute (50% dans 6-12 mois)
**Impact :** Critique (tue le business si pricing = 0€)

**Mitigation :**
- **First-mover advantage** : Capturer early adopters juin-décembre 2026 avant réaction gros acteurs
- **Moat défendable** : Prompts optimisés mariages + feedback system = différenciation UX vs feature générique Canva
- **Niche focus** : Vertical mariage profond (templates, messaging, contexte émotionnel) vs tool générique
- **Community & brand** : Testimonials, influenceurs, SEO "Save the Date IA" = brand equity
- **Pivot option** : Si Canva gratuit, pivot vers B2B (wedding planners API, white-label SaaS)

**Risque #2 : Market sizing trop optimiste (pas assez de demande)**

**Probabilité :** Faible-Moyenne (25%)
**Impact :** Critique (revenus insuffisants)

**Mitigation :**
- **Validation rapide** : Objectif break-even 3 mois (5-10 clients) = validation minimale
- **Signal d'échec clair** : Si <200€ revenus à 6 mois → Arrêter ou pivoter
- **Marketing organique** : Groupes Facebook mariages (gratuit), influenceurs (barter), SEO
- **Coût acquisition faible** : CAC ≤10€ = rentable même à faible volume

---

#### Resource Risks

**Risque #1 : Sous-estimation dev time (48h → 60-70h réel)**

**Probabilité :** Haute (60%)
**Impact :** Moyen (retard timeline, pas d'abandon)

**Mitigation :**
- **Timeline flexible** : Mieux vaut juin avec toutes features que mai incomplet (décision stratégique validée)
- **Buffer intégré** : Estimation 48h pure dev, mais timeline 8-10 semaines inclut buffer bugs/imprévus
- **Scope ajustable** : Si en retard critique (>12 semaines), options de coupe :
  1. **Feedback system** → Growth (économie 10h)
  2. **Dashboard admin** → Version ultra-basique Google Sheets (économie 3h)
  3. **SSE real-time** → Spinner simple (économie 5h)
- **Priorités MVP** : OAuth Google + Core workflow + Paiement = non-négociables. Reste = ajustable.

**Risque #2 : Burnout solo dev (motivation, énergie)**

**Probabilité :** Moyenne (40%)
**Impact :** Critique (abandon projet)

**Mitigation :**
- **Checkpoints hebdomadaires** : Review progress, célébrer petites victoires
- **Stratégie anti-abandon** : Se rappeler les succès des user journeys (Sophie heureuse, Claire ambassadrice, Aldo fier)
- **Community support** : Partager progrès dans groupes dev, feedback pairs
- **Pause autorisée** : Si burnout, pause 1-2 semaines OK. Timeline flexible accepte ça.
- **Scope sanctuaire** : Pas de feature creep = protection motivation

**Risque #3 : Coûts infrastructure dépassent budget (>200€)**

**Probabilité :** Faible (20%)
**Impact :** Faible (coûts marginaux)

**Mitigation :**
- **Tests API pré-MVP** : 20-30€ seulement (pas 50€)
- **Hébergement** : Railway $5/mois × 4 mois = 20€. Vercel gratuit.
- **Total estimé** : 20€ Railway + 30€ API tests + 50€ domaine/SSL = 100€ (sous budget)
- **Marge sécurité** : 200€ budget - 100€ réel = 100€ buffer
- **Revenus early** : Premières ventes couvrent coûts infrastructure (break-even 3 mois)

---

### Scoping Summary

**MVP Phase 1 (Juin 2026) :**
- 48h dev, 8-10 semaines, 200€ infrastructure
- Experience MVP : Produit fini, UX forte, différenciation feedback system
- Auth (Email/Password + OAuth Google) + Dashboard admin basiques inclus
- 5 templates, workflow complet, pricing 19.90€
- **Objectif :** Break-even 3 mois (5-10 clients), validation product-market fit

**Growth Phase 2 (Septembre-Novembre 2026) :**
- Si break-even atteint : Pack 49€, Pinterest-inspired, async architecture, 10-15 templates
- 55h dev additionnels
- **Objectif :** Scale à 1K€ net/mois

**Expansion Phase 3 (2027) :**
- Si 1K€ net/mois : Multi-événements (naissances, anniversaires), B2B corporate, API publique
- 110h dev additionnels
- **Objectif :** ARR 100K€, exit strategy potentielle


## Functional Requirements

### User Management

**FR1:** Utilisateurs anonymes peuvent créer un compte avec email et mot de passe
**FR2:** Utilisateurs enregistrés peuvent se connecter avec leurs identifiants email/password
**FR3:** Utilisateurs anonymes peuvent créer un compte en se connectant avec Google OAuth
**FR4:** Utilisateurs peuvent se connecter avec leur compte Google OAuth
**FR5:** Utilisateurs connectés peuvent se déconnecter
**FR6:** Utilisateurs connectés peuvent consulter leur historique de commandes
**FR7:** Utilisateurs connectés peuvent re-télécharger leurs designs achetés dans les 7 jours
**FR8:** Système maintient des sessions sécurisées pour utilisateurs connectés

---

### Design Generation

**FR9:** Utilisateurs peuvent uploader jusqu'à 2 photos au format JPG ou PNG
**FR10:** Utilisateurs peuvent voir une galerie de 5 templates pré-définis (Bohème, Moderne, Classique, Vintage, Minimaliste)
**FR11:** Utilisateurs peuvent sélectionner un template depuis la galerie
**FR12:** Utilisateurs peuvent déclencher la génération d'un design personnalisé avec leurs photos et le template choisi
**FR13:** Système génère un design haute résolution (4K) en utilisant un service de génération d'images par IA
**FR14:** Utilisateurs peuvent prévisualiser le design généré avant achat
**FR15:** Utilisateurs peuvent zoomer et voir les détails du design généré
**FR16:** Utilisateurs peuvent voir le nombre d'itérations utilisées et restantes (max 3 incluses)
**FR17:** Utilisateurs peuvent déclencher une nouvelle génération (itération) si le design ne satisfait pas
**FR18:** Utilisateurs peuvent remplacer leurs photos entre les itérations

---

### Iteration & Feedback

**FR19:** Utilisateurs peuvent donner un feedback structuré après chaque génération via checkboxes guidées
**FR20:** Utilisateurs peuvent spécifier des problèmes précis (texte trop grand/petit, photos pas assez visibles, couleurs inadaptées, style insuffisant)
**FR21:** Utilisateurs peuvent ajouter un feedback libre en texte pour des ajustements spécifiques
**FR22:** Système enrichit automatiquement le prompt de génération avec le feedback utilisateur pour l'itération suivante
**FR23:** Utilisateurs peuvent voir des conseils contextuels pour améliorer la qualité (photos bien éclairées, composition centrée)

---

### Payment & Commerce

**FR24:** Utilisateurs peuvent acheter un design généré pour 19.90€
**FR25:** Utilisateurs peuvent effectuer le paiement via un processeur de paiement sécurisé
**FR26:** Système confirme la transaction après paiement réussi
**FR27:** Système affiche le pricing de manière transparente (19.90€, itérations incluses)

---

### Content Delivery

**FR28:** Système envoie automatiquement le design haute résolution par email après paiement
**FR29:** Utilisateurs reçoivent un email de confirmation avec le fichier attaché
**FR30:** Utilisateurs peuvent télécharger leur design haute résolution depuis l'email
**FR31:** Système supprime automatiquement les photos utilisateur après 7 jours (conformité RGPD)
**FR32:** Système affiche la politique de confidentialité et RGPD clairement

---

### Admin & Monitoring

**FR33:** Admin peut consulter un dashboard avec métriques essentielles (revenus, commandes, coûts API, marges, taux conversion)
**FR34:** Admin peut voir les logs de toutes les générations (succès, échec, durée, coût)
**FR35:** Admin peut voir l'historique des erreurs du service de génération d'images par IA
**FR36:** Système envoie des alertes email automatiques si le taux d'erreur dépasse 5%
**FR37:** Système envoie des alertes email si les coûts API dépassent le seuil défini (0.70€/commande)
**FR38:** Système envoie des alertes email si les rate limits du service de génération d'images par IA sont proches
**FR39:** Admin peut exporter les métriques vers un format exportable standard (CSV, Excel)

---

### System Reliability

**FR40:** Système valide le format et la taille des photos uploadées (max 10MB, formats acceptés: JPG, PNG - autres formats rejetés avec message d'erreur explicite)
**FR41:** Système affiche des messages d'erreur clairs avec solutions si upload échoue
**FR42:** Système valide le format des emails (trim espaces, format correct)
**FR43:** Système gère les erreurs du service de génération d'images par IA avec retry logic
**FR44:** Système affiche des indicateurs de progression pendant la génération incluant: progress bar animée (0-100%), messages rotatifs toutes les 5s (ex: "Analyse de vos photos...", "Création de votre design...", "Finalisation..."), et temps estimé restant
**FR45:** Système fournit un healthcheck endpoint pour monitoring uptime
**FR46:** Système effectue des backups automatiques de la base de données
**FR47:** Système permet à l'admin de renvoyer manuellement un design par email si delivery échoue

---

### User Feedback & Support

**FR48:** Système envoie automatiquement un survey de satisfaction par email 24h après achat (lien vers formulaire 3 questions: satisfaction globale, qualité design, recommandation)
**FR49:** Landing page affiche l'adresse email de support (support@[domain]) de manière visible dans le footer et sur la page de contact
**FR50:** Admin peut gérer les testimonials affichés sur la landing page (ajouter, modifier, supprimer, activer/désactiver)

---

### Analytics & Business Intelligence

**FR51:** Admin peut consulter le coût d'acquisition client (CAC) par canal marketing dans le dashboard (calcul: dépenses marketing / nombre de clients acquis, segmenté par source: Google Ads, Facebook, Organic, Referral)


## Non-Functional Requirements

### Performance

**NFR-P1:** Le système doit générer un design complet en **moins de 30 secondes** dans 95% des cas
- **Méthode de mesure:** Logs backend avec timestamps (start/end génération) agrégés dans dashboard admin. Alertes automatiques si >5% des générations dépassent 30s sur période glissante 24h
**NFR-P2:** Les pages web doivent se charger en **moins de 2 secondes** (LCP < 2.5s selon Core Web Vitals)
- **Méthode de mesure:** Google PageSpeed Insights + Vercel Analytics (Real User Monitoring). Vérifications hebdomadaires sur URLs principales (/, /generate, /dashboard)
**NFR-P3:** Les actions utilisateur (clic, navigation, upload) doivent recevoir un feedback visuel en **moins de 100ms** (FID < 100ms)
- **Méthode de mesure:** Chrome DevTools Performance tab + Web Vitals extension. Tests manuels sur interactions critiques (upload photos, sélection template, paiement)
**NFR-P4:** Le système MVP doit supporter **5-10 générations simultanées** sans dégradation de performance
- **Méthode de mesure:** Tests de charge avec 10 requêtes parallèles simulées (Artillery ou k6). Vérifier que temps génération reste <30s pour chaque requête
**NFR-P5:** Les progrès de génération IA doivent être communiqués à l'utilisateur via communication temps réel côté serveur avec **mise à jour toutes les 2-3 secondes**
**NFR-P6:** Les images uploadées (max 10MB) doivent être traitées et validées en **moins de 5 secondes**
- **Méthode de mesure:** Logs backend timestamp upload start/end. Tests automatisés avec images 10MB pour vérifier temps traitement
**NFR-P7:** Le score Lighthouse Performance doit être **≥90 (mobile)** et **≥95 (desktop)**
- **Méthode de mesure:** Lighthouse CI intégré dans pipeline déploiement. Tests automatiques sur chaque merge vers main. Blocage si score < seuils

---

### Security

**NFR-S1:** Toutes les communications doivent utiliser **HTTPS/TLS 1.3 minimum**
**NFR-S2:** Les mots de passe utilisateurs doivent être hashés avec un **algorithme de hashing sécurisé adaptatif (cost factor ≥12)**
**NFR-S3:** Les sessions utilisateur doivent expirer après **7 jours d'inactivité**
- **Méthode de mesure:** Tests automatisés simulant session idle 7 jours + 1 heure. Vérifier que requête suivante force re-authentification
**NFR-S4:** Les paiements doivent être traités via **Stripe PCI-DSS Level 1 compliant** (aucune donnée bancaire stockée côté serveur)
**NFR-S5:** Les photos utilisateur doivent être **supprimées automatiquement après 7 jours** (conformité RGPD)
**NFR-S6:** Les données personnelles (email, nom) doivent être **chiffrées au repos** dans la base de données
- **Méthode de mesure:** Inspection directe de la base de données (SELECT sur table users). Vérifier que champs email/nom sont chiffrés (non lisibles en clair)
**NFR-S7:** Les tokens OAuth Google doivent être stockés de manière sécurisée et **jamais exposés côté client**
**NFR-S8:** Le système doit afficher une **politique de confidentialité RGPD-compliant** visible avant toute collecte de données
**NFR-S9:** Les uploads de fichiers doivent être validés (format, taille, type MIME) pour **prévenir injection de malware**
**NFR-S10:** Les endpoints API admin doivent être **protégés par authentification forte** (pas d'accès public)

---

### Scalability

**NFR-SC1:** L'architecture MVP (sync) doit supporter jusqu'à **10 utilisateurs simultanés** sans dégradation
- **Méthode de mesure:** Tests de charge avec 10 utilisateurs virtuels concurrents (Artillery/k6). Vérifier que temps réponse reste <30s pour génération, <2s pour pages
**NFR-SC2:** Le système doit pouvoir migrer vers architecture async (Growth) pour supporter **50-100 générations simultanées**
- **Méthode de mesure:** Revue architecture documentée (ADR). Vérifier que job queue (BullMQ/Redis) peut être intégré sans refactoring majeur des controllers
**NFR-SC3:** La base de données relationnelle doit supporter **croissance jusqu'à 10K commandes** sans refactoring schema
- **Méthode de mesure:** Revue schema database + index définis. Tests de performance avec dataset simulé de 10K commandes. Vérifier query time <500ms
**NFR-SC4:** Le système doit gérer les **pics de trafic saisonniers** (juillet-septembre, saison mariages, +300% trafic) via auto-scaling (Vercel/Railway)
- **Méthode de mesure:** Configuration auto-scaling activée et vérifiée dans dashboards Vercel/Railway. Tests de charge simulant 4x trafic normal pendant 1h
**NFR-SC5:** Le service de stockage cloud doit supporter **croissance jusqu'à 100GB** de photos utilisateur (avec suppression 7 jours)
- **Méthode de mesure:** Dashboard stockage cloud (quota, utilisation). Vérifier que quota configuré ≥100GB. Tests cron job suppression automatique (vérifier après 7 jours)
**NFR-SC6:** Le service de génération d'images par IA doit être configuré pour **gérer rate limits avec retry logic exponentiel** (3 tentatives, backoff 2s → 4s → 8s)

---

### Accessibility

**NFR-A1:** Le système doit être conforme **WCAG 2.1 Level AA**
- **Méthode de mesure:** Audit WCAG avec outil axe DevTools sur toutes les pages principales. Vérifier 0 violations Level A et AA
**NFR-A2:** Tous les éléments interactifs doivent être **accessibles via navigation clavier** (Tab, Enter, Esc)
- **Méthode de mesure:** Tests manuels navigation clavier uniquement (sans souris) sur parcours complet (upload → génération → achat). Vérifier tous boutons/inputs accessibles
**NFR-A3:** Les contrastes de couleurs doivent respecter un **ratio minimum 4.5:1** (texte normal) et **3:1** (texte large)
- **Méthode de mesure:** WebAIM Contrast Checker sur palette couleurs définie. Lighthouse Accessibility audit (section contrast). Vérifier 0 violations
**NFR-A4:** Toutes les images doivent avoir des **attributs alt descriptifs** (vides pour décoratives)
- **Méthode de mesure:** Inspection code HTML (toutes balises <img>). Audit axe DevTools. Vérifier 0 images sans attribut alt
**NFR-A5:** Les formulaires doivent avoir des **labels explicites** associés à chaque input
- **Méthode de mesure:** Inspection code HTML (tous <input>, <select>, <textarea>). Audit axe DevTools section forms. Vérifier 0 inputs sans label ou aria-label
**NFR-A6:** Les messages d'erreur doivent être **annoncés via aria-live** pour lecteurs d'écran
- **Méthode de mesure:** Tests avec lecteur d'écran (NVDA/VoiceOver). Déclencher erreurs volontaires (upload invalide, paiement échoué). Vérifier annonce audio claire
**NFR-A7:** Le score Lighthouse Accessibility doit être **≥90**

---

### Integration

**NFR-I1:** L'intégration du service de génération d'images par IA doit avoir un **taux de succès ≥95%** (moins de 5% d'échecs techniques)
- **Méthode de mesure:** Logs backend tracking succès/échecs API. Dashboard admin calculant ratio (succès/total requêtes) sur période glissante 7 jours
**NFR-I2:** L'intégration du processeur de paiement doit supporter les **webhooks pour confirmation paiement asynchrone**
**NFR-I3:** Le service d'envoi d'emails transactionnels doit avoir un **taux de délivrabilité ≥98%**
- **Méthode de mesure:** Dashboard service email (webhooks delivered/bounced/spam). Vérifier ratio (delivered/sent) ≥98% sur période mensuelle
**NFR-I4:** Les erreurs API externes (génération d'images IA, paiement) doivent être **loggées avec contexte complet** (timestamp, user ID, request payload)
**NFR-I5:** Le système doit fonctionner en **mode dégradé** si le service de génération d'images par IA est down (message user + retry automatique)
- **Méthode de mesure:** Tests simulant API down (mock endpoint erreur 503). Vérifier que UI affiche message dégradé clair + retry automatique après backoff
**NFR-I6:** L'intégration OAuth Google doit suivre les **standards OAuth 2.0** et gérer refresh tokens
- **Méthode de mesure:** Revue code implémentation OAuth (flow authorization code, PKCE). Tests expiration access token (1h) + vérifier refresh automatique
**NFR-I7:** Toutes les intégrations API doivent avoir **timeout configuré** (30s max) pour éviter blocages

---

### Reliability

**NFR-R1:** Le système doit avoir un **uptime ≥99%** mesuré mensuellement (accepte ~7h downtime/mois)
- **Méthode de mesure:** Monitoring uptime externe (UptimeRobot ou BetterUptime) pinging healthcheck endpoint toutes les 5 min. Rapport mensuel uptime %
**NFR-R2:** La base de données doit avoir des **backups automatiques quotidiens** avec rétention 30 jours
- **Méthode de mesure:** Configuration backup vérifiée dans dashboard hébergeur database. Tests restauration backup mensuel (restore vers environnement staging)
**NFR-R3:** Le système doit avoir **zero data loss** pour les commandes payées (transactions ACID garanties)
- **Méthode de mesure:** Revue code transactions database (BEGIN/COMMIT/ROLLBACK). Tests simulant crash serveur pendant paiement. Vérifier rollback correct ou commit complet
**NFR-R4:** Les erreurs critiques (taux >5%, coûts API seuil, rate limits) doivent **déclencher alertes email admin en <5 minutes**
**NFR-R5:** Le système doit avoir un **healthcheck endpoint** (/api/health) pour monitoring uptime externe
**NFR-R6:** Les échecs de génération IA doivent être **récupérables** (retry automatique 3×, puis fallback message user)
**NFR-R7:** Les échecs d'envoi email doivent permettre **re-send manuel par admin** via dashboard
**NFR-R8:** Le système doit **loguer toutes les transactions** (générations, paiements, erreurs) pour audit et troubleshooting

