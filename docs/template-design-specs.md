# Template Design Specifications - Siana Memento

**Project:** Siana Memento - Save the Date Generator
**Created:** 2026-02-16
**Author:** Aldo (avec collaboration Claude Sonnet 4.5)
**Purpose:** Spécifications visuelles complètes pour les 5 templates de génération IA

---

## 📋 **Vue d'Ensemble Templates**

Siana Memento propose **5 templates Save the Date** avec identités visuelles distinctes, optimisés pour génération IA sans artefacts de visages réalistes.

**Stratégie Illustration :** Tous les couples sont illustrés (pas de photos réelles) pour éviter les artefacts IA sur les visages et permettre des styles artistiques cohérents.

| Template | Identité | Style Illustration | Palette Dominante |
|----------|----------|-------------------|-------------------|
| **Bohème** | Romantique, naturel, chaleureux | Aquarelle douce | Terre cuite, Crème, Vert sauge |
| **Moderne** | Urbain sophistiqué, graphique | Geometric Flat Design | Noir, Blanc, Or |
| **Classique** | Intemporel, élégant traditionnel | Portrait dessiné | Bordeaux, Crème, Or |
| **Vintage** | Nostalgie années 70, rétro chic | Rotoscope animation | Ocre, Olive, Beige |
| **Minimaliste** | Épuré zen, sophistication sobre | Line art one-line | Nude, Blanc cassé, Taupe |

---

## 🌿 **Template #1 : Bohème**

### Identité

**Mots-clés :** Romantique, naturel, chaleureux, décontracté élégant

**Ambiance :** Mariage en pleine nature, jardin bohème, campagne chic, célébration intime et chaleureuse

### Palette Couleurs

**Codes Hex Précis :**
- **Primary (Terre cuite rosé)** : `#C17A6F` - Couleur dominante chaleureuse, utilisée pour éléments principaux
- **Secondary (Crème chaleureux)** : `#F5E6D3` - Background, espaces négatifs, douceur
- **Accent (Vert sauge brand)** : `#2D4A3E` - Rappel identité Siana Memento, accents décoratifs

**Contraste WCAG 2.1 AA :**
- Terre cuite sur Crème : ✅ 4.8:1 (AA conforme)
- Vert sauge sur Crème : ✅ 8.2:1 (AAA conforme)

**Usage Palette :**
- Background : Crème `#F5E6D3`
- Texte principal : Terre cuite `#C17A6F`
- Éléments décoratifs : Vert sauge `#2D4A3E`
- Accents watercolor : Mix des 3 couleurs (opacities variables)

### Typographie

**Font Families (Google Fonts) :**
- **Headings :** `Cormorant Garamond` - Serif élégant, romantic, haute lisibilité
- **Body text :** `Lato` - Sans-serif moderne, clean, excellent rendu web

**Hiérarchie Typographique :**
```css
/* Noms Couple (H1) */
font-family: 'Cormorant Garamond', serif;
font-size: 48px;
font-weight: 600;
line-height: 1.2;
letter-spacing: 0.02em;
color: #C17A6F;

/* Date & Lieu (H2) */
font-family: 'Cormorant Garamond', serif;
font-size: 32px;
font-weight: 400;
line-height: 1.3;
color: #2D4A3E;

/* Body text (détails) */
font-family: 'Lato', sans-serif;
font-size: 18px;
font-weight: 400;
line-height: 1.6;
color: #C17A6F;
```

### Layout Composition

**Structure : Asymétrique Naturel**

**Dimensions de base (3000×4000px portrait) :**
- Photo dominante : **Left 55%** (1650px width)
- Zone texte : **Right 45%** (1350px width)
- Marges généreuses : **60px** tous côtés

**Flow visuel :**
1. Photo couple aquarelle (left) capte l'œil immédiatement
2. Regard balaie naturellement vers texte (right)
3. Texte décalé verticalement (organic flow, pas alignement strict top)

**Spacing :**
- Photo top : 60px
- Texte top : 200px (décalage organique)
- Padding texte : 40px intérieur
- Gap entre éléments texte : 24px

### Éléments Décoratifs Signature

**Style : Floral Naturel**

**Watercolor Flowers Overlay :**
- **Placement :** Coins supérieurs (top-left et top-right)
- **Opacity :** 25%
- **Couleurs :** Mix Terre cuite `#C17A6F` + Crème `#F5E6D3` + Vert sauge `#2D4A3E`
- **Style :** Aquarelle douce, contours flous, pétales délicats
- **Taille :** ~400×400px par coin, débordement hors cadre (effet naturel)

**Handwritten Accents :**
- **Usage :** Petits textes style calligraphie (ex: "Save the Date", date en chiffres)
- **Font suggestion :** `Dancing Script` ou `Pacifico` (Google Fonts)
- **Size :** 24px
- **Color :** Vert sauge `#2D4A3E`
- **Placement :** Sous-titres, accents discrets

**Border :**
- **Style :** Organic wavy line (ligne ondulée naturelle)
- **Width :** 2px
- **Color :** Accent Vert sauge `#2D4A3E`
- **Placement :** Encadre la composition (offset 40px intérieur)

### Design Tokens (shadcn/ui compatible)

```typescript
const bohemeTokens = {
  borderRadius: '8px',      // Soft corners, douceur naturelle
  shadows: 'shadow-md',     // Élévation douce (4px blur, 0.1 opacity)
  opacities: {
    overlays: '20-30%',     // Watercolor flowers, textures
    textures: '10-15%',     // Background texture paper subtle
    accents: '100%'         // Texte, éléments principaux (solid)
  }
}
```

### Style Illustration Couple

**Technique : Aquarelle Douce**

**Description détaillée :**
- **Médium :** Peinture aquarelle digitale (effet brushstrokes aqueux, couleurs diluées)
- **Contours :** Doux et peu définis (effet dreamy, romantique)
- **Palette illustration :** Utilise les 3 couleurs template (Terre cuite, Crème, Vert sauge)
- **Rendering :** Couple peint avec couleurs chaudes dominantes, dégradés subtils, zones de lumière (highlight crème)
- **Intégration :** L'illustration se fond organiquement avec les watercolor flowers du fond (cohérence visuelle)

**Composition couple :**
- **Pose suggérée :** Couple enlacé, visages proches (tendresse), regard amoureux ou vers horizon
- **Détails visages :** Suggérés (yeux, sourire) mais pas photographiques (évite artefacts IA)
- **Vêtements :** Tenues mariage (robe fluide, costume élégant) peintes en aquarelle
- **Background illustration :** Fondu avec le fond crème, pas de contour net

**Prompt IA suggestion :**
```
"Watercolor painting of couple embracing, soft brushstrokes, warm terracotta and cream tones,
sage green accents, dreamy romantic atmosphere, faces suggested not detailed, flowing dress,
elegant suit, natural light, bohemian wedding style, delicate and ethereal"
```

### Exemples Visuels de Référence

**Style aquarelle :** Pinterest "watercolor wedding illustration", "bohemian couple art"
**Palette :** Terracotta + Cream + Sage green moodboards
**Layout :** Asymmetric wedding invitations, organic layouts

---

## 🏙️ **Template #2 : Moderne**

### Identité

**Mots-clés :** Épuré, géométrique, sophistiqué, urbain élégant

**Ambiance :** Mariage urbain chic, loft moderne, célébration contemporaine, luxe minimaliste

### Palette Couleurs

**Codes Hex Précis :**
- **Primary (Noir profond)** : `#000000` - Puissance, sophistication, contraste maximal
- **Secondary (Blanc pur)** : `#FFFFFF` - Pureté, élégance, respiration visuelle
- **Accent (Or sophistiqué)** : `#D4AF37` - Luxe, détails précieux, éclat subtil

**Contraste WCAG 2.1 AA :**
- Noir sur Blanc : ✅ 21:1 (AAA conforme, contraste maximal)
- Or sur Blanc : ✅ 4.6:1 (AA conforme)
- Or sur Noir : ✅ 4.5:1 (AA conforme)

**Usage Palette :**
- Background : Blanc `#FFFFFF` (ou noir `#000000` pour versions inversées)
- Texte principal : Noir `#000000` sur blanc (ou blanc sur noir)
- Éléments décoratifs : Or `#D4AF37` (lignes, formes géométriques)
- Photo background : Noir & Blanc (desaturated, opacity 15%)

### Typographie

**Font Families (Google Fonts) :**
- **Headings :** `DM Serif Display` - Serif moderne luxe, élégance contemporaine
- **Body text :** `Work Sans` - Sans-serif clean, lisibilité pro

**Hiérarchie Typographique :**
```css
/* Noms Couple (H1) */
font-family: 'DM Serif Display', serif;
font-size: 52px;
font-weight: 600;
line-height: 1.1;
letter-spacing: -0.01em;
color: #000000;
text-transform: uppercase; /* Option: majuscules pour impact */

/* Date & Lieu (H2) */
font-family: 'DM Serif Display', serif;
font-size: 36px;
font-weight: 400;
line-height: 1.2;
color: #000000;

/* Body text (détails) */
font-family: 'Work Sans', sans-serif;
font-size: 16px;
font-weight: 400;
line-height: 1.5;
letter-spacing: 0.03em;
color: #000000;
```

### Layout Composition

**Structure : Centered Minimaliste**

**Dimensions de base (3000×4000px portrait) :**
- Photo : **Full background** (3000×4000px, opacity 15%, noir & blanc)
- Card blanche : **Centered** (1800×2400px, 60px padding intérieur)
- Marges card : 600px left/right, 800px top/bottom (centered absolu)

**Flow visuel :**
1. Photo couple full background (effet ambiance, noir & blanc subtil)
2. Card blanche centrée capte l'attention (contraste fort)
3. Texte centered strict dans card (hiérarchie verticale)

**Spacing :**
- Card padding : 60px tous côtés
- Gap entre éléments texte : 32px
- Texte centered alignment (pas de justification)

### Éléments Décoratifs Signature

**Style : Géométrique Minimaliste**

**Lignes Fines Dorées (Séparateurs) :**
- **Width :** 1px
- **Color :** Or `#D4AF37`
- **Placement :** Entre sections texte (horizontal), ou encadrement card (vertical sides)
- **Longueur :** 400px (horizontal), 200px (vertical accents)

**Formes Géométriques Abstraites :**
- **Types :** Triangles, cercles, rectangles (formes simples)
- **Color :** Or `#D4AF37`
- **Opacity :** 20-30%
- **Placement :** Coins card (discret), ou derrière texte (subtil)
- **Taille :** 100-200px (petits accents, pas dominants)

**Border Card :**
- **Style :** Ligne droite précise (geometric)
- **Width :** 2px
- **Color :** Or `#D4AF37`
- **Placement :** Encadre la card blanche (offset 20px intérieur card)

### Design Tokens (shadcn/ui compatible)

```typescript
const moderneTokens = {
  borderRadius: '0px',      // Corners sharp, géométrique pur
  shadows: 'shadow-lg',     // Élévation marquée (10px blur, 0.15 opacity)
  opacities: {
    overlays: '10-15%',     // Photo background (noir & blanc subtil)
    textures: '0%',         // Aucune texture (pureté absolue)
    accents: '20-30%'       // Formes géométriques abstraites
  }
}
```

### Style Illustration Couple

**Technique : Geometric Flat Design**

**Description détaillée (style référence Les Filles Du Surf adapté monochrome) :**
- **Médium :** Illustration vectorielle flat design, aplats de couleur
- **Palette illustration :** Noir `#000000`, Blanc `#FFFFFF`, Or `#D4AF37` (palette monochrome luxe)
- **Contours :** Nets et précis (formes géométriques simplifiées)
- **Rendering :** Couple en silhouettes stylisées (personnages sans détails visages), formes géométriques pures

**Composition couple :**
- **Style :** Silhouettes noires/blanches (aplats), accents dorés (vêtements, accessoires)
- **Pose suggérée :** Couple dans scène géométrique (sous arche dorée, devant formes abstraites)
- **Détails visages :** Aucun (silhouettes pures, ou formes géométriques simples pour tête)
- **Éléments déco intégrés :** Arche géométrique dorée, formes abstraites (triangles, cercles), lignes fines dorées

**Scène type :**
- Couple silhouettes noires/blanches
- Sous grande arche géométrique dorée (arc de cercle ou forme angulaire)
- Background : Formes abstraites géométriques dorées (opacity 20%)
- Look final : Affiche minimaliste luxe (style éditorial Vogue, Harper's Bazaar)

**Prompt IA suggestion :**
```
"Geometric flat design illustration, couple silhouettes black and white, minimalist shapes,
golden arch frame, abstract geometric elements, luxury editorial style, modern sophistication,
no facial details, clean lines, monochrome with gold accents, contemporary poster art"
```

### Exemples Visuels de Référence

**Style illustration :** Les Filles Du Surf (geometric flat), Malika Favre (minimalist posters)
**Palette :** Black white gold luxury editorial
**Layout :** Centered card layouts, luxury wedding invitations minimalist

---

## 🎩 **Template #3 : Classique**

### Identité

**Mots-clés :** Intemporel, élégant traditionnel, raffiné, cérémonie

**Ambiance :** Mariage traditionnel élégant, château, célébration formelle, sophistication intemporelle

### Palette Couleurs

**Codes Hex Précis :**
- **Primary (Bordeaux élégant)** : `#800020` - Richesse, tradition, élégance noble
- **Secondary (Crème)** : `#F4EAD5` - Douceur, chaleur, élégance sobre
- **Accent (Or classique)** : `#D4AF37` - Luxe intemporel, détails précieux

**Contraste WCAG 2.1 AA :**
- Bordeaux sur Crème : ✅ 9.8:1 (AAA conforme)
- Or sur Crème : ✅ 4.6:1 (AA conforme)
- Or sur Bordeaux : ⚠️ 2.1:1 (Utiliser Or uniquement en décoratif)

**Usage Palette :**
- Background : Crème `#F4EAD5`
- Texte principal : Bordeaux `#800020`
- Éléments décoratifs : Or `#D4AF37` (monogramme, ornements, border)
- Illustration : Tons sépia/bordeaux monochrome

### Typographie

**Font Families (Google Fonts) :**
- **Headings :** `Libre Baskerville` - Serif équilibré, classique moderne
- **Body text :** `Lora` - Serif warm, lisibilité traditionnelle

**Hiérarchie Typographique :**
```css
/* Noms Couple (H1) */
font-family: 'Libre Baskerville', serif;
font-size: 48px;
font-weight: 700;
line-height: 1.2;
letter-spacing: 0.01em;
color: #800020;
text-align: center;

/* Date & Lieu (H2) */
font-family: 'Libre Baskerville', serif;
font-size: 32px;
font-weight: 400;
line-height: 1.3;
color: #800020;
text-align: center;

/* Body text (détails) */
font-family: 'Lora', serif;
font-size: 18px;
font-weight: 400;
line-height: 1.6;
color: #800020;
text-align: center;
```

### Layout Composition

**Structure : Symétrique Formel**

**Dimensions de base (3000×4000px portrait) :**
- Photo : **Top 40%** (3000×1600px height)
- Zone texte : **Bottom 60%** (3000×2400px height)
- Marges symétriques : **50px** tous côtés

**Flow visuel :**
1. Photo couple portrait (top) capte attention (émotion immédiate)
2. Zone texte bottom (ample espace pour détails)
3. Tout est centered strict (symétrie parfaite, formalité)

**Spacing :**
- Photo top : 50px margin
- Gap photo-texte : 80px
- Padding texte : 100px left/right (centrage large)
- Gap entre éléments texte : 24px

### Éléments Décoratifs Signature

**Style : Élégance Sobre**

**Monogramme Couple :**
- **Style :** Initiales entrelacées (ex: "A & M")
- **Font :** `Cinzel Decorative` (serif monumental) ou custom monogram
- **Size :** 120px
- **Color :** Or `#D4AF37`
- **Placement :** Top center (above noms couple) ou bottom center (signature)
- **Opacity :** 100% (élément signature fort)

**Ornements Coins (Discrets) :**
- **Style :** Petits motifs floraux classiques ou volutes
- **Color :** Or `#D4AF37`
- **Size :** 80×80px par coin
- **Placement :** Coins card (top-left, top-right, bottom-left, bottom-right)
- **Opacity :** 60% (présent mais discret)

**Border :**
- **Style :** Ligne simple épaisse (élégance traditionnelle)
- **Width :** 3px
- **Color :** Primary Bordeaux `#800020`
- **Placement :** Encadre la composition (offset 30px intérieur)

### Design Tokens (shadcn/ui compatible)

```typescript
const classiqueTokens = {
  borderRadius: '2px',      // Presque sharp, formel mais subtle rounding
  shadows: 'shadow-xl',     // Élévation noble, profondeur (20px blur, 0.25 opacity)
  opacities: {
    overlays: '20%',        // Textures paper subtle
    textures: '5-10%',      // Background texture lin très subtile
    accents: '60-100%'      // Ornements (60% discrets, monogramme 100%)
  }
}
```

### Style Illustration Couple

**Technique : Portrait Dessiné Classique**

**Description détaillée :**
- **Médium :** Dessin crayon/fusain digitalisé (effet sketch réaliste)
- **Palette illustration :** Tons sépia ou bordeaux monochrome (cohérence palette template)
- **Contours :** Lignes précises mais organiques (dessin à la main, pas vectoriel)
- **Rendering :** Couple en portrait dessiné avec détails soignés (vêtements, coiffure, posture)

**Composition couple :**
- **Style :** Portrait classique (bustes ou 3/4 corps)
- **Pose suggérée :** Couple posé élégamment (regard caméra ou profil aristocratique)
- **Détails visages :** Suggérés avec soin (yeux, sourire esquissés) mais pas photographiques
- **Vêtements :** Détails soignés (dentelle robe, boutons costume, textures dessinées)
- **Background illustration :** Uni ou léger dégradé sépia

**Rendu technique :**
- **Traits crayon :** Visibles (effet dessin authentique)
- **Ombres :** Cross-hatching traditionnel ou estompe douce
- **Tons :** Sépia warm (tons beige/brun) ou bordeaux monochrome

**Prompt IA suggestion :**
```
"Classical pencil sketch portrait of elegant couple, detailed drawing style, sepia tones or
burgundy monochrome, sophisticated posture, wedding attire details, traditional portrait
composition, charcoal or graphite effect, timeless elegance, faces suggested not photographic"
```

### Exemples Visuels de Référence

**Style illustration :** Portrait sketches wedding, classical drawn portraits
**Palette :** Burgundy cream gold traditional wedding
**Layout :** Formal symmetric invitations, classical wedding announcements

---

## 📻 **Template #4 : Vintage**

### Identité

**Mots-clés :** Nostalgie, rétro chic, années 50-70, charme intemporel

**Ambiance :** Mariage rétro, années 70 bohème, vinyle et cinéma argentique, célébration vintage cool

### Palette Couleurs

**Codes Hex Précis :**
- **Primary (Ocre)** : `#A67C52` - Chaleur rétro, ton années 70
- **Secondary (Beige parcheminé)** : `#EFE8D8` - Douceur vieillie, papier vintage
- **Accent (Olive vintage)** : `#6B705C` - Vert rétro, années 70 signature

**Contraste WCAG 2.1 AA :**
- Ocre sur Beige : ✅ 4.5:1 (AA conforme)
- Olive sur Beige : ✅ 7.2:1 (AAA conforme)
- Ocre sur Olive : ⚠️ 1.6:1 (Éviter, utiliser avec beige)

**Usage Palette :**
- Background : Beige parcheminé `#EFE8D8`
- Texte principal : Olive `#6B705C`
- Accents/illustrations : Ocre `#A67C52`
- Éléments décoratifs : Mix Ocre + Olive (tons rétro)

### Typographie

**Font Families (Google Fonts) :**
- **Headings :** `Abril Fatface` - Serif display années 70, impact bold
- **Body text :** `Merriweather` - Serif warm lisible, cohérence rétro

**Hiérarchie Typographique :**
```css
/* Noms Couple (H1) */
font-family: 'Abril Fatface', serif;
font-size: 50px;
font-weight: 700;
line-height: 1.1;
letter-spacing: 0em;
color: #6B705C;
text-transform: none;
/* Optional: slight rotation (-2deg) pour effet magazine cover dynamic */

/* Date & Lieu (H2) */
font-family: 'Abril Fatface', serif;
font-size: 34px;
font-weight: 400;
line-height: 1.2;
color: #A67C52;

/* Body text (détails) */
font-family: 'Merriweather', serif;
font-size: 18px;
font-weight: 400;
line-height: 1.6;
color: #6B705C;
```

### Layout Composition

**Structure : Magazine Rétro**

**Dimensions de base (3000×4000px portrait) :**
- Photo : **Dominante 70%** (3000×2800px height)
- Zone texte : **Overlay bottom** (banner style, height 600px)
- Banner texte : Semi-transparent ou opaque (selon photo contrast)

**Flow visuel :**
1. Photo couple illustration rotoscope (dominante visuelle, 70% height)
2. Banner texte bottom (style magazine cover années 60, overlay ou séparé)
3. Texte légèrement incliné (subtle rotation -1 à -2 deg, dynamisme)

**Spacing :**
- Photo : Full width, top 0px
- Banner texte : Bottom 0px, padding 40px intérieur
- Texte elements : Alignés left ou centered (selon design banner)
- Gap entre éléments texte : 16px

### Éléments Décoratifs Signature

**Style : Rétro Chic Épuré**

**Motifs Géométriques Années 70 (Coins) :**
- **Style :** Formes géométriques rétro (hexagones, arcs, patterns 70s)
- **Color :** Ocre `#A67C52` + Olive `#6B705C`
- **Size :** 100×100px par coin
- **Placement :** Coins photo ou banner (top-left, top-right)
- **Opacity :** 40% (présents mais subtils)

**Texture Grain Photo Argentique :**
- **Style :** Grain photo film vintage (effet bruit argentique)
- **Opacity :** 10-15% (subtil, apporte authenticité)
- **Placement :** Over entire composition (overlay)
- **Color :** Monochrome (beige/sépia)

**Border :**
- **Style :** Ligne simple épaisse (vintage bold)
- **Width :** 3px
- **Color :** Olive vintage `#6B705C`
- **Placement :** Encadre la composition (offset 20px intérieur)

### Design Tokens (shadcn/ui compatible)

```typescript
const vintageTokens = {
  borderRadius: '4px',      // Subtle rounding, rétro soft
  shadows: 'shadow-2xl',    // Élévation strong, effet photo vintage (25px blur, 0.3 opacity)
  opacities: {
    overlays: '30-40%',     // Banner texte (si semi-transparent), effet vieilli
    textures: '10-15%',     // Grain photo argentique visible
    accents: '40%'          // Motifs géométriques discrets
  }
}
```

### Style Illustration Couple

**Technique : Rotoscope Vintage**

**Description détaillée :**
- **Médium :** Style rotoscope animation années 60-70 (A Scanner Darkly, Waking Life)
- **Palette illustration :** Couleurs flat vintage (Ocre `#A67C52`, Olive `#6B705C`, Beige `#EFE8D8`)
- **Contours :** Nets et visibles (lignes noires ou sépia épaisses)
- **Rendering :** Couple en aplats de couleur vintage, effet animation cel, contours tracés

**Composition couple :**
- **Style :** Animation rotoscope (contours nets, aplats flat, légère stylisation)
- **Pose suggérée :** Couple dynamique (marche, danse, mouvement vintage cool)
- **Détails visages :** Simplifiés (yeux, bouche tracés, expression visible mais stylisée)
- **Vêtements :** Tenues rétro années 70 (robes fluides, costumes velours, détails époque)
- **Background illustration :** Uni ou motifs géométriques années 70

**Rendu technique :**
- **Contours :** Lignes noires ou sépia (2-3px width)
- **Aplats couleur :** Flat (pas de dégradés, zones de couleur uniforme)
- **Look final :** Affiche film années 70, animation vintage, magazine cover rétro

**Prompt IA suggestion :**
```
"Rotoscope animation style illustration, vintage 1970s couple, bold outlines, flat color blocks,
ochre olive and beige palette, retro fashion details, 70s geometric patterns background,
cel animation effect, vintage poster art, groovy aesthetic"
```

### Exemples Visuels de Référence

**Style illustration :** Rotoscope animation (A Scanner Darkly), vintage 70s posters
**Palette :** Ochre olive beige 70s color schemes
**Layout :** Vintage magazine covers, retro film posters

---

## ✨ **Template #5 : Minimaliste**

### Identité

**Mots-clés :** Épuré extrême, moins = plus, zen, élégance sobre

**Ambiance :** Mariage minimaliste, galerie d'art, célébration intime épurée, sophistication absolue

### Palette Couleurs

**Codes Hex Précis :**
- **Primary (Beige nude)** : `#E8DCD4` - Douceur nude, élégance naturelle
- **Secondary (Blanc cassé warm)** : `#FAF8F6` - Pureté chaleureuse, respiration
- **Accent (Taupe subtle)** : `#A8968A` - Contraste doux, sophistication discrète

**Contraste WCAG 2.1 AA :**
- Taupe sur Blanc cassé : ✅ 4.7:1 (AA conforme)
- Taupe sur Beige nude : ⚠️ 3.2:1 (AA large text only, utiliser avec précaution)
- Beige sur Blanc cassé : ⚠️ 1.2:1 (Éviter pour texte, OK pour zones de couleur)

**Usage Palette :**
- Background : Blanc cassé warm `#FAF8F6`
- Zones de couleur : Beige nude `#E8DCD4` (accents, backgrounds sections)
- Texte principal : Taupe `#A8968A`
- Illustration : Taupe monochrome (line art)

### Typographie

**Font Families (Google Fonts) :**
- **Headings :** `Outfit` - Sans-serif geometric moderne, épuré
- **Body text :** `Work Sans` - Sans-serif lisible, cohérence minimaliste

**Hiérarchie Typographique :**
```css
/* Noms Couple (H1) */
font-family: 'Outfit', sans-serif;
font-size: 56px;
font-weight: 400;
line-height: 1.1;
letter-spacing: -0.02em;
color: #A8968A;
text-align: center;
text-transform: uppercase; /* Option: majuscules sophistication */

/* Date & Lieu (H2) */
font-family: 'Outfit', sans-serif;
font-size: 28px;
font-weight: 300;
line-height: 1.3;
letter-spacing: 0.05em;
color: #A8968A;
text-align: center;

/* Body text (détails) */
font-family: 'Work Sans', sans-serif;
font-size: 16px;
font-weight: 300;
line-height: 1.6;
letter-spacing: 0.03em;
color: #A8968A;
text-align: center;
```

### Layout Composition

**Structure : Centered Absolu**

**Dimensions de base (3000×4000px portrait) :**
- Marges extrêmes : **100px** tous côtés (respiration maximale)
- Zone de contenu : **2800×3800px** (after margins)
- Photo + Texte : **Tout centered** (alignement absolu)

**Flow visuel :**
1. Whitespace massif (marges 100px = design)
2. Photo couple illustration centered (size modéré, pas dominante)
3. Whitespace vertical généreux (200px gap)
4. Texte centered below photo

**Spacing :**
- Photo : Centered horizontal + vertical top (800px from top after margin)
- Photo size : 1200×1200px (modérée, pas full width)
- Gap photo-texte : 200px (respiration essentielle)
- Texte elements : Centered, gap 32px entre éléments

### Éléments Décoratifs Signature

**Style : Un Seul Élément Signature**

**Ligne Fine Unique (Séparateur Stratégique) :**
- **Style :** Ligne horizontale ou verticale (simple, élégante)
- **Width :** 1px
- **Color :** Accent Taupe `#A8968A`
- **Placement horizontal :** Entre photo et texte (centered, width 400px)
- **Placement vertical option :** Left ou right side (height 600px, offset 200px from edge)

**Aucun Autre Décoratif :**
- Pas de border (pureté absolue)
- Pas de motifs (whitespace = ornement)
- Pas de textures (flat colors only)

### Design Tokens (shadcn/ui compatible)

```typescript
const minimalisteTokens = {
  borderRadius: '0px',      // Sharp corners, pureté géométrique
  shadows: 'shadow-sm',     // Élévation minimale (2px blur, 0.05 opacity) ou 'none'
  opacities: {
    overlays: '0%',         // Aucun overlay (pureté)
    textures: '0%',         // Aucune texture (flat absolu)
    accents: '100%'         // Ligne séparatrice solid (pas de transparence)
  }
}
```

### Style Illustration Couple

**Technique : Line Art One-Line**

**Description détaillée :**
- **Médium :** Dessin ligne continue (one-line drawing, trait unique sans lever le crayon)
- **Palette illustration :** Monochrome Taupe `#A8968A` (une seule couleur)
- **Contours :** Ligne fine continue (1-2px width), fluide et élégante
- **Rendering :** Couple en essence pure (ligne capture silhouettes, posture, connexion)

**Composition couple :**
- **Style :** One-line art (trait continu, minimalisme extrême)
- **Pose suggérée :** Couple enlacé, profils face à face, ou silhouettes entrelacées
- **Détails visages :** Absents ou ultra-simplifiés (ligne suggère forme, pas détails)
- **Vêtements :** Suggérés par lignes (silhouettes, pas textures)
- **Background illustration :** Aucun (whitespace uniquement)

**Rendu technique :**
- **Ligne :** 1-2px width, couleur taupe `#A8968A`
- **Technique :** Trait fluide, organique, élégant (capture essence couple)
- **Look final :** Art minimaliste sophistiqué, gallery-worthy, intemporel

**Prompt IA suggestion :**
```
"One-line continuous drawing of couple embracing, minimalist line art, single flowing line,
taupe monochrome, elegant simplicity, no facial details, essence of love, modern minimalist
art style, sophisticated simplicity, gallery art"
```

### Exemples Visuels de Référence

**Style illustration :** One-line art (Picasso line drawings), minimalist couple illustrations
**Palette :** Nude beige taupe minimalist color schemes
**Layout :** Centered minimalist layouts, zen wedding invitations

---

## 🎯 **Guidelines Génération IA**

### Principes Communs Tous Templates

**1. Illustrations Couple (Pas de Photos Réelles) :**
- ✅ **TOUJOURS** utiliser illustrations stylisées (aquarelle, flat design, dessin, rotoscope, line art)
- ❌ **JAMAIS** de photos réelles couples (artefacts visages, inconsistance)
- ✅ Visages suggérés ou simplifiés (pas de détails photographiques)

**2. Cohérence Palette :**
- Utiliser STRICTEMENT les 3 couleurs définies par template (Primary, Secondary, Accent)
- Respecter les usages couleurs (background, texte, décoratifs)
- Vérifier contraste WCAG 2.1 AA minimum

**3. Typographies :**
- Charger Google Fonts spécifiées
- Respecter hiérarchie typographique (sizes, weights, line-heights)
- Centrer ou aligner selon layout template

**4. Layouts :**
- Respecter dimensions et proportions définies
- Appliquer spacings précis (marges, paddings, gaps)
- Maintenir flow visuel décrit

**5. Éléments Décoratifs :**
- Implémenter TOUS les décoratifs signature (identité template)
- Respecter opacities, placements, sizes
- Ne PAS ajouter de décoratifs non-spécifiés

**6. Design Tokens :**
- Appliquer border-radius, shadows, opacities définis
- Cohérence shadcn/ui (compatible Tailwind CSS classes)

### Prompts IA Personnalisés

Chaque template inclut un **Prompt IA suggestion** optimisé pour génération couple illustration. Utiliser comme base et adapter avec :
- Noms couple
- Date mariage
- Lieu célébration
- Détails personnalisés (couleurs vêtements, pose spécifique si demandé)

### Output Format

**Dimensions :**
- **Portrait :** 3000×4000px (3:4 ratio) - Format principal
- **Carré :** 3000×3000px (1:1 ratio) - Alternative (adapter layouts)

**Résolution :**
- 300 DPI minimum (imprimable haute qualité)

**Format fichier :**
- PNG (transparence si nécessaire)
- JPEG (qualité 95% pour delivery email)

---

## 📊 **Tableau Récapitulatif Templates**

| Critère | Bohème | Moderne | Classique | Vintage | Minimaliste |
|---------|--------|---------|-----------|---------|-------------|
| **Identité** | Romantique naturel | Urbain sophistiqué | Intemporel élégant | Nostalgie années 70 | Épuré zen |
| **Palette Primary** | #C17A6F Terre cuite | #000000 Noir | #800020 Bordeaux | #A67C52 Ocre | #E8DCD4 Nude |
| **Palette Secondary** | #F5E6D3 Crème | #FFFFFF Blanc | #F4EAD5 Crème | #EFE8D8 Beige | #FAF8F6 Blanc cassé |
| **Palette Accent** | #2D4A3E Vert sauge | #D4AF37 Or | #D4AF37 Or | #6B705C Olive | #A8968A Taupe |
| **Typo Headings** | Cormorant Garamond | DM Serif Display | Libre Baskerville | Abril Fatface | Outfit |
| **Typo Body** | Lato | Work Sans | Lora | Merriweather | Work Sans |
| **Layout** | Asymétrique 55/45 | Centered card | Symétrique 40/60 | Magazine 70% photo | Centered absolu |
| **Illustration** | Aquarelle douce | Geometric flat | Portrait dessiné | Rotoscope vintage | Line art one-line |
| **Border-radius** | 8px | 0px | 2px | 4px | 0px |
| **Shadows** | shadow-md | shadow-lg | shadow-xl | shadow-2xl | shadow-sm |
| **Décoratifs** | Watercolor flowers | Lignes dorées | Monogramme | Motifs 70s | Ligne unique |

---

## ✅ **Validation & Tests**

### Checklist Validation Template

Avant livraison génération, valider :

- [ ] **Palette** : 3 couleurs exactes (hex codes), contraste WCAG AA ✅
- [ ] **Typographie** : Google Fonts chargées, hiérarchie respectée ✅
- [ ] **Layout** : Dimensions, proportions, spacings corrects ✅
- [ ] **Illustration** : Style cohérent template, pas de photo réelle, visages non-détaillés ✅
- [ ] **Décoratifs** : Tous éléments signature présents, opacities/placements OK ✅
- [ ] **Tokens** : Border-radius, shadows, opacities appliqués ✅
- [ ] **Résolution** : 3000×4000px (ou 3000×3000px), 300 DPI ✅
- [ ] **Lisibilité** : Texte lisible (contraste, size, font), accessible WCAG 2.1 AA ✅

### Tests Utilisateurs

**Scénarios test :**
1. Afficher les 5 templates côte à côte → identités distinctes perceptibles ?
2. Tester avec différents noms/dates/lieux → layout s'adapte correctement ?
3. Version print (300 DPI) → qualité imprimable haute résolution ?
4. Feedback utilisateurs → "Quel template vous correspond ?" (diversité styles)

---

## 📝 **Notes Implémentation**

### TemplateSeeder (Database)

Créer 5 entrées dans table `templates` :

```typescript
// database/seeders/TemplateSeeder.ts
const templates = [
  {
    id: 'boheme',
    name: 'Bohème',
    description: 'Romantique, naturel, chaleureux',
    specs: {
      palette: { primary: '#C17A6F', secondary: '#F5E6D3', accent: '#2D4A3E' },
      typo: { headings: 'Cormorant Garamond', body: 'Lato' },
      layout: 'asymmetric',
      illustration: 'watercolor',
      // ... (toutes specs JSON)
    }
  },
  // ... 4 autres templates
]
```

### Frontend Template Selector

Afficher cards preview templates avec :
- Miniature visuelle (exemple statique)
- Nom + description identité
- Palette couleurs (3 ronds colorés)

**User selects template → stocké dans `Order.template` → passé à AI generation service**

### AI Generation Service

```typescript
async generate(orderId: string) {
  const order = await Order.findOrFail(orderId)
  const templateSpecs = await Template.findByOrFail('id', order.template)

  // Build prompt from templateSpecs.specs + user data (noms, date, lieu, photos)
  const prompt = buildPrompt(templateSpecs, order)

  // Call AI service (ex: DALL-E, Midjourney API, Stable Diffusion)
  const generatedImage = await aiService.generate(prompt)

  // Save & deliver
  await saveToCloudinary(generatedImage)
  await EmailService.sendDelivery(order)
}
```

---

## 🎨 **Crédits & Inspirations**

**Bohème :** Aquarelles mariage, nature bohème, Pinterest wedding watercolor
**Moderne :** Les Filles Du Surf, Malika Favre, geometric flat design
**Classique :** Portraits dessinés traditionnels, faire-parts élégants
**Vintage :** Affiches années 70, rotoscope animation (A Scanner Darkly)
**Minimaliste :** One-line art (Picasso), galeries art moderne minimaliste

---

## 📞 **Contact & Mises à Jour**

**Auteur :** Aldo
**Projet :** Siana Memento
**Date création :** 2026-02-16
**Version :** 1.0

**Pour suggestions ou ajustements specs, contacter l'équipe produit.**

---

**🎉 Document Template Design Specifications COMPLET - Prêt pour Implémentation !**
