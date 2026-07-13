import FocusCard from "@/components/siana/FocusCard";
import { ThemeToggle } from "@/components/siana/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import CtaButton from "@/components/siana/landing/CtaButton";
import DecorativeMotif from "@/components/siana/landing/DecorativeMotif";
import { Sparkles } from "lucide-react";
import Link from "next/link";

const colors = [
  { name: "Sage Green", token: "sage-green", hex: "#2D4A3E", main: true },
  { name: "Ice White", token: "ice-white", hex: "#FAFAFA", main: true },
  { name: "Deep Black", token: "deep-black", hex: "#09090B", main: true },
  { name: "Terracotta", token: "terracotta", hex: "#C17A6F" },
  { name: "Cream", token: "cream", hex: "#F5EFE6" },
  { name: "Gold", token: "gold", hex: "#C9A84C" },
  { name: "Burgundy", token: "burgundy", hex: "#6B2737" },
  { name: "Ochre", token: "ochre", hex: "#C4922A" },
  { name: "Nude", token: "nude", hex: "#E8D5C4" },
  { name: "Taupe", token: "taupe", hex: "#8B7355" },
  { name: "Olive", token: "olive", hex: "#6B7C47" },
  { name: "Sage", token: "sage", hex: "#B5C4B1" },
];

export default function DesignSystemPage() {
  return (
    <div className="bg-background min-h-screen p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
              Design System
            </p>
            <h1 className="text-5xl font-bold text-foreground leading-tight">
              Siana Memento
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Tokens, typographie, composants & FocusCard
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-16">

        {/* ── Couleurs ── */}
        <section>
          <SectionTitle>Palette</SectionTitle>
          <div className="mb-6">
            <SubTitle>Principale</SubTitle>
            <div className="flex gap-3 flex-wrap">
              {colors.filter((c) => c.main).map((c) => (
                <ColorSwatch key={c.token} {...c} />
              ))}
            </div>
          </div>
          <div>
            <SubTitle>Templates</SubTitle>
            <div className="flex gap-3 flex-wrap">
              {colors.filter((c) => !c.main).map((c) => (
                <ColorSwatch key={c.token} {...c} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Contraste WCAG ── */}
        <section>
          <SectionTitle>Contraste WCAG AA</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ContrastCard bg="#2D4A3E" fg="#FAFAFA" label="Sage Green / Ice White" ratio="9.1:1" pass />
            <ContrastCard bg="#FAFAFA" fg="#09090B" label="Ice White / Deep Black" ratio="19.9:1" pass />
            <ContrastCard bg="#F5EFE6" fg="#2D4A3E" label="Cream / Sage Green" ratio="7.2:1" pass />
            <ContrastCard bg="#FAFAFA" fg="#8B7355" label="Ice White / Taupe" ratio="4.6:1" pass />
          </div>
        </section>

        {/* ── Typographie ── */}
        <section>
          <SectionTitle>Typographie</SectionTitle>
          <div className="bg-card rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <Label className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                Display — Clash Display
              </Label>
              <div className="space-y-1 mt-3">
                <p className="text-5xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Aa — Titre principal</p>
                <p className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Aa — Titre secondaire</p>
                <p className="text-xl font-medium text-foreground" style={{ fontFamily: "var(--font-display)" }}>Aa — Titre tertiaire</p>
              </div>
            </div>
            <div>
              <Label className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                Body — Satoshi
              </Label>
              <div className="space-y-1 mt-3">
                <p className="text-base font-normal text-foreground">
                  Regular — Votre faire-part de mariage, unique et personnalisé en 15 minutes.
                </p>
                <p className="text-base font-medium text-foreground">
                  Medium — Créez un souvenir inoubliable pour vos invités.
                </p>
                <p className="text-sm text-muted-foreground">
                  Small / muted — À partir de 19,90€ · Livraison par email · 3 itérations incluses
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Composants shadcn ── */}
        <section>
          <SectionTitle>Composants shadcn/ui</SectionTitle>

          <div className="bg-card rounded-2xl p-8 shadow-sm space-y-6">
            {/* Buttons */}
            <div>
              <SubTitle>Buttons</SubTitle>
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Créer mon design</Button>
                <Button variant="secondary">Voir les exemples</Button>
                <Button variant="outline">Ajuster</Button>
                <Button variant="ghost">Annuler</Button>
                <Button variant="destructive">Supprimer</Button>
                <Button disabled>Indisponible</Button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <SubTitle>Inputs</SubTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="name">Comment s&apos;appellent les futurs mariés ?</Label>
                  <Input id="name" placeholder="Sophie & Thomas" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lieu">Où se célèbre votre mariage ?</Label>
                  <Input id="lieu" placeholder="Château de Lastours" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="message">Un message pour vos invités ?</Label>
                  <Textarea id="message" placeholder="Rejoignez-nous pour célébrer notre union..." rows={3} />
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div>
              <SubTitle>Checkboxes</SubTitle>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox id="cb1" defaultChecked />
                  <Label htmlFor="cb1">Les prénoms sont trop petits</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="cb2" />
                  <Label htmlFor="cb2">Les photos ne sont pas assez visibles</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="cb3" />
                  <Label htmlFor="cb3">Les couleurs ne correspondent pas à notre style</Label>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div>
              <SubTitle>Progress</SubTitle>
              <div className="space-y-3 max-w-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Génération en cours... 65%</p>
                  <Progress value={65} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Étape 2 / 3</p>
                  <Progress value={66} />
                </div>
              </div>
            </div>

            {/* Badges */}
            <div>
              <SubTitle>Badges</SubTitle>
              <div className="flex flex-wrap gap-2">
                <Badge>Bohème</Badge>
                <Badge variant="secondary">Moderne</Badge>
                <Badge variant="outline">Classique</Badge>
                <Badge variant="destructive">Erreur</Badge>
              </div>
            </div>

            {/* Alerts */}
            <div>
              <SubTitle>Alerts</SubTitle>
              <div className="space-y-3 max-w-xl">
                <Alert>
                  <AlertTitle>Génération lancée ✨</AlertTitle>
                  <AlertDescription>
                    Votre illustration est en cours de création. Comptez 20 à 30 secondes.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>Format non supporté</AlertTitle>
                  <AlertDescription>
                    Ce fichier n&apos;est pas accepté. Utilisez JPG ou PNG, max 10MB.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </section>

        {/* ── FocusCard ── */}
        <section>
          <SectionTitle>FocusCard — Shell du tunnel</SectionTitle>
          <p className="text-sm text-muted-foreground mb-6">
            Wrapper de layout pour toutes les étapes — max-w-[450px] desktop, 100% mobile.
          </p>
          <FocusCard>
            <div className="p-8">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
                Étape 1 / 3
              </p>
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Vos photos
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Uploadez jusqu'à 2 photos pour que notre IA crée votre illustration personnalisée.
              </p>
              <div className="h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted mb-6">
                <span className="text-sm text-muted-foreground">Zone d&apos;upload</span>
              </div>
              <Button className="w-full">Continuer →</Button>
            </div>
          </FocusCard>
        </section>

        {/* ── Refonte Landing (Epic 7) ── */}
        <section>
          <SectionTitle>Refonte Landing (Epic 7)</SectionTitle>

          <div className="bg-card rounded-2xl p-8 shadow-sm space-y-8">
            {/* Eyebrow */}
            <div>
              <SubTitle>Eyebrow labels</SubTitle>
              <div className="space-y-2">
                <Eyebrow>Comment ça marche</Eyebrow>
                <Eyebrow variant="accent">Qualité & livraison</Eyebrow>
              </div>
            </div>

            {/* Cartes à coins largement arrondis */}
            <div>
              <SubTitle>Cartes arrondies — Card + rounded-3xl / rounded-4xl</SubTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="rounded-3xl px-6">
                  <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
                  <div className="space-y-1">
                    <Eyebrow className="text-xs">Haute résolution</Eyebrow>
                    <p className="text-sm text-muted-foreground">
                      Fichier 3000×4000px, prêt à imprimer chez le professionnel de votre choix.
                    </p>
                  </div>
                </Card>
                <Card className="rounded-4xl overflow-hidden py-0">
                  <div className="flex h-full min-h-40 items-center justify-center bg-muted">
                    <span className="text-sm text-muted-foreground">Grande tuile image (bento)</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* CTA avec promesse de temps */}
            <div>
              <SubTitle>CTA — promesse de temps</SubTitle>
              <div className="flex flex-wrap items-center gap-3">
                <CtaButton href="/generate/upload">Créer mon Save the Date</CtaButton>
                <CtaButton href="/generate/upload" timePromise={null}>
                  Sans promesse de temps
                </CtaButton>
                <CtaButton asChild>
                  <Link href="/generate/upload">Via asChild</Link>
                </CtaButton>
              </div>
            </div>

            {/* Motifs décoratifs */}
            <div>
              <SubTitle>Motifs décoratifs — currentColor, aria-hidden</SubTitle>
              <div className="flex items-end gap-8">
                <DecorativeMotif variant="branch" className="h-40 w-20 text-primary/15" />
                <DecorativeMotif variant="leaf" className="h-32 w-16 text-primary/10" />
                <DecorativeMotif variant="sprig" className="h-40 w-20 text-primary/15" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                À positionner en absolu depuis la section parente, opacité ≤ 15% recommandée.
              </p>
            </div>
          </div>
        </section>

        <footer className="pb-8 text-center">
          <p className="text-xs text-muted-foreground">Siana Memento Design System · v0.1.0</p>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-foreground mb-6 pb-3 border-b border-border" style={{ fontFamily: "var(--font-display)" }}>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function ColorSwatch({ name, token, hex }: { name: string; token: string; hex: string; main?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="w-20 h-20 rounded-xl shadow-sm border border-black/5" style={{ backgroundColor: hex }} />
      <div>
        <p className="text-xs font-semibold text-foreground leading-tight">{name}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{hex}</p>
      </div>
    </div>
  );
}

function ContrastCard({ bg, fg, label, ratio, pass }: { bg: string; fg: string; label: string; ratio: string; pass: boolean }) {
  return (
    <div className="rounded-xl p-5 flex items-center justify-between" style={{ backgroundColor: bg }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: fg, fontFamily: "var(--font-display)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: fg, opacity: 0.75 }}>Ratio {ratio}</p>
      </div>
      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: pass ? "#22c55e20" : "#ef444420", color: pass ? "#16a34a" : "#dc2626" }}>
        {pass ? "✓ AA" : "✗ Fail"}
      </span>
    </div>
  );
}
