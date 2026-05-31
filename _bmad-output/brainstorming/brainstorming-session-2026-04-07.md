---
stepsCompleted: [1]
inputDocuments: []
session_topic: 'Retours utilisateur (sœur Aldo) sur Siana Memento'
session_goals: 'Débat critique des retours avec point de vue externe, décisions actionnables'
selected_approach: 'discussion-libre'
techniques_used: ['analyse-critique', 'priorisation']
ideas_generated: []
context_file: ''
---

# Brainstorming Session — Retours Utilisateur

**Facilitateur :** Aldo
**Date :** 2026-04-07
**Source feedback :** Sœur d'Aldo (à l'initiative du projet)

---

## Retours bruts

1. Animations landing page bien, page simple et pas chargée
2. Propositions de catchline alternative ("qui vous ressemble")
3. Détails optionnels sur le save the date
4. Baisser le prix à 12,99 € pour le lancement
5. Publicité réseaux sociaux + réseau familial
6. Inclusivité prénoms (pas d'exemples genrés)
7. Plus de mascottes pour que l'utilisateur associe mascotte = IA
8. Plus d'animations dans le formulaire

---

## Analyse & Décisions

### 1. Catchline hero — VALIDÉ, À FAIRE

**Actuel :** "Générez votre Save the Date unique avec vos photos en 15 minutes"
**Nouveau :** "Générez le Save the Date qui vous ressemble avec vos propres photos"

Raison : l'angle émotionnel ("qui vous ressemble") est plus fort que l'argument logistique ("15 minutes") pour un produit mariage. Le "15 minutes" peut rester ailleurs (badge, sous-texte).

### 2. Inclusivité prénoms — VALIDÉ, À FAIRE

Retirer les exemples genrés des placeholders du formulaire.
- `"Prénom 1 (ex : Sophie)"` → `"Prénom 1"`
- `"Prénom 2 (ex : Thomas)"` → `"Prénom 2"`

Les labels actuels ("futurs mariés", "second marié") sont déjà neutres.

### 3. Mascotte = IA — VALIDÉ, À PLANIFIER

Renforcer l'association mascotte ↔ IA. Pas d'en mettre partout, mais la rendre plus présente aux moments où l'IA travaille (preview, progression). L'utilisateur doit comprendre : mascotte visible = l'IA est en action.

### 4. Prix promo lancement — VALIDÉ, DÉCISION BUSINESS

- Prix normal : 19,90 €
- Prix promo early adopters : 12,99 € (premiers inscrits newsletter)
- Implémentation : coupon Stripe ou prix séparé
- Ne PAS baisser le prix permanent — risque de dévalorisation

### 5. Détails optionnels — VALIDÉ, INTÉGRÉ AU SPIKE IA

À intégrer au spike qualité génération IA (prompt Gemini). Permettre au couple d'ajouter des détails libres sur le save the date (thème mariage, éléments déco, etc.) sans complexifier le formulaire.

### 6. Animations formulaire — VALIDÉ, MICRO-INTERACTIONS

Micro-interactions GSAP sur le form conversationnel (transitions entre étapes, feedback visuel).
L'idée de la mascotte qui vole d'un champ à l'autre est créative mais trop coûteuse en effort vs impact → rejetée.

### 7. Publicité réseaux sociaux — NOTÉ, HORS SCOPE DEV

- Réseau familial : gratuit, immédiat, à faire dès que le produit est prêt
- Pub payante : nécessite budget + créa, décision business post-lancement

### 8. Landing page simple — CONFIRMÉ

Pas d'action, c'est une validation du travail existant.

---

## Actions à réaliser

| # | Action | Priorité | Effort |
|---|--------|----------|--------|
| 1 | Changer la catchline hero | Haute | ~5 min |
| 2 | Retirer exemples genrés des placeholders | Haute | ~5 min |
| 3 | Spike qualité IA : régénération + prompt + palettes + détails optionnels | Haute | Session dédiée |
| 4 | Renforcer présence mascotte aux moments IA | Moyenne | À estimer |
| 5 | Micro-interactions GSAP sur le formulaire | Moyenne | À estimer |
| 6 | Implémenter prix promo 12,99 € (coupon Stripe) | Moyenne | À estimer |
| 7 | Feedback utilisateur landing page (2-3 couples cible) | Basse | Aldo |
| 8 | Stratégie pub réseaux sociaux | Basse | Aldo |
