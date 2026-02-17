# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Siana Memento** is an AI-powered SaaS that generates personalized wedding save-the-date poster designs in 15 minutes at €19.90. Target market: French couples aged 25-35.

**Status:** Pre-implementation phase. All planning artifacts are complete; no application code exists yet.

**Key constraints:** Solo developer (Aldo), 160h budget, €200 infrastructure budget, MVP launch June 2026.

## Build Commands

No implementation code exists yet. Commands will be added here as the project is built.

## Architecture

### Tech Stack (from architecture docs)

**Frontend:** React SPA, Tailwind CSS, shadcn/ui (copied & customized), Radix UI, Clash Display + Satoshi fonts

**Backend:** AdonisJS (Node.js), PostgreSQL, JWT sessions

**External Services:**
- Google Gemini API — AI image generation (~€0.31–0.55/design)
- Stripe — payments (PCI-DSS Level 1)
- S3/Cloudinary — photo storage
- OAuth Google — authentication

**Infrastructure:** Vercel (frontend), Railway (backend)

### Core User Flow

1. Upload ≤2 photos (JPG/PNG, max 10MB each)
2. Select 1 of 5 templates (Bohème, Moderne, Classique, Vintage, Minimaliste)
3. AI generates personalized illustration via Gemini API (min 3000×3000px)
4. User iterates up to 3 times with feedback
5. Pay €19.90 via Stripe
6. Design delivered by email (3000×4000px minimum)

### Key Functional Requirements

- **Auth:** OAuth Google + email/password, 7-day session expiration
- **Generation:** Gemini API with retry logic (3 attempts, exponential backoff: 2s→4s→8s), progress updates every 2-3s
- **Iterations:** Max 3 included; structured feedback checkboxes (Growth phase)
- **RGPD:** Auto-delete photos after 7 days, 7-day design re-download window
- **Admin dashboard:** Real-time revenue, orders, API costs, margins, conversion; alerts when error rate >5%
- **Target performance:** <30s generation (95th percentile), LCP <2.5s, Lighthouse ≥90 mobile

### 5 Templates Visual Reference

Full specs in `docs/template-design-specs.md`:
- **Bohème:** Watercolor, Terracotta (#C17A6F) + Cream + Sage Green, asymmetric 55/45 layout
- **Moderne:** Geometric flat, Black + White + Gold, centered minimal
- **Classique:** Pencil sketch, Burgundy + Cream + Gold, symmetric formal
- **Vintage:** Rotoscope style, Ochre + Beige + Olive, magazine 70s layout
- **Minimaliste:** One-line art, Nude + Cream + Taupe, absolute whitespace

### Design System

- **Colors:** Sage Green botanical (#2D4A3E) accent, monochrome palette
- **Fonts:** Clash Display (headings), Satoshi (body)
- **Components:** shadcn/ui copied into project and customized (not used as external dep)
- **Accessibility:** WCAG 2.1 Level AA, keyboard navigation, ≥4.5:1 contrast

## Planning Artifacts

All specs in `_bmad-output/planning-artifacts/`:
- `prd.md` — Full PRD (51 functional + 38 non-functional requirements)
- `architecture.md` — Technical architecture decisions
- `ux-design-specification.md` — UX patterns and emotional journey mapping
- `epics.md` — Story breakdown with acceptance criteria

Template visual specs: `docs/template-design-specs.md`

## BMAD Framework

This project uses BMAD v6.0.0-Beta.7 for workflow management. Agents and workflows are in `_bmad/`. All documentation and AI communication should be in **French**.

The BMAD workflow phases:
1. `_bmad/bmm/workflows/1-analysis/` — Research
2. `_bmad/bmm/workflows/2-plan-workflows/` — PRD, UX, solutioning
3. `_bmad/bmm/workflows/3-solutioning/`
4. `_bmad/bmm/workflows/4-implementation/` — Sprint stories, QA
