# Siana Memento

Générateur de Save the Date personnalisés propulsé par l'IA. En partant de 2 photos du couple et d'un template au choix, la plateforme produit une illustration sur-mesure en 15 minutes — qualité professionnelle pour 19,90 €.

## Le projet

**Problème :** les couples passent 2-3h sur Canva avec des templates génériques, ou paient 300€+ à un designer, sans obtenir un résultat qui leur ressemble vraiment.

**Solution :** un SaaS B2C qui automatise la génération d'illustrations personnalisées via l'API Gemini, avec un système d'itération guidée (jusqu'à 3 retours inclus) et une livraison par email dès le paiement.

**Marché :** couples français 25-35 ans, ~210 000 mariages/an en France.

## Monorepo

```
siana-memento/
├── siana-memento-web/   # Frontend Next.js 16 (TypeScript, Tailwind CSS, shadcn/ui)
└── siana-memento-api/   # Backend AdonisJS 6 (TypeScript, PostgreSQL)
```

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | AdonisJS 6, TypeScript, PostgreSQL |
| IA | Google Gemini API |
| Paiement | Stripe |
| Stockage | S3 / Cloudinary |
| Auth | OAuth Google + email/password |
| Déploiement | Vercel (web) · Railway (api) |

## Flux utilisateur

1. Upload de 1 à 2 photos (JPG/PNG, 10 Mo max)
2. Choix d'un template parmi 5 styles
3. Génération IA (< 30s, progression en temps réel)
4. Jusqu'à 3 itérations avec retours guidés
5. Paiement Stripe — 19,90 €
6. Livraison par email (3000 × 4000 px minimum)

## Templates disponibles

| Nom | Style | Palette principale |
|---|---|---|
| Bohème | Aquarelle | Terracotta · Crème · Vert sauge |
| Moderne | Géométrique flat | Noir · Blanc · Or |
| Classique | Esquisse crayon | Bordeaux · Crème · Or |
| Vintage | Rotoscope 70s | Ocre · Beige · Olive |
| Minimaliste | One-line art | Nude · Crème · Taupe |

## Objectifs MVP (Juin 2026)

- Break-even à 3 mois (5-10 clients)
- ≥ 1 000 € net/mois à 12 mois
- ≥ 80 % de satisfaction en ≤ 3 itérations
- < 10 % de taux de remboursement
- ≥ 95 % de taux de succès API

## Documentation

Les spécifications complètes sont dans `_bmad-output/planning-artifacts/` :

- [`prd.md`](_bmad-output/planning-artifacts/prd.md) — PRD complet (51 exigences fonctionnelles)
- [`architecture.md`](_bmad-output/planning-artifacts/architecture.md) — Décisions d'architecture
- [`ux-design-specification.md`](_bmad-output/planning-artifacts/ux-design-specification.md) — Spécifications UX
- [`epics.md`](_bmad-output/planning-artifacts/epics.md) — Epics et stories
- [`docs/template-design-specs.md`](docs/template-design-specs.md) — Specs visuelles des 5 templates
