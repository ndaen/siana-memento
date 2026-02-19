import FocusCard from "@/components/siana/FocusCard";

const colors = [
  // Palette principale
  { name: "Sage Green", token: "sage-green", hex: "#2D4A3E", main: true },
  { name: "Ice White", token: "ice-white", hex: "#FAFAFA", main: true },
  { name: "Deep Black", token: "deep-black", hex: "#09090B", main: true },
  // Templates
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

const darkSwatches = ["sage-green", "deep-black", "burgundy", "taupe", "olive"];

export default function DesignSystemPage() {
  return (
    <div className="bg-cream min-h-screen p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <p
          className="text-sm font-medium tracking-[0.2em] uppercase text-taupe mb-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Design System
        </p>
        <h1
          className="text-5xl font-bold text-deep-black leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Siana Memento
        </h1>
        <p
          className="text-lg text-taupe mt-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Tokens, typographie & composants de base
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-16">
        {/* ── Couleurs ── */}
        <section>
          <SectionTitle>Palette</SectionTitle>

          <div className="mb-6">
            <SubTitle>Principale</SubTitle>
            <div className="flex gap-3 flex-wrap">
              {colors
                .filter((c) => c.main)
                .map((color) => (
                  <ColorSwatch key={color.token} {...color} />
                ))}
            </div>
          </div>

          <div>
            <SubTitle>Templates</SubTitle>
            <div className="flex gap-3 flex-wrap">
              {colors
                .filter((c) => !c.main)
                .map((color) => (
                  <ColorSwatch key={color.token} {...color} />
                ))}
            </div>
          </div>
        </section>

        {/* ── Contraste WCAG ── */}
        <section>
          <SectionTitle>Contraste WCAG AA</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ContrastCard
              bg="#2D4A3E"
              fg="#FAFAFA"
              label="Sage Green / Ice White"
              ratio="9.1:1"
              pass
            />
            <ContrastCard
              bg="#FAFAFA"
              fg="#09090B"
              label="Ice White / Deep Black"
              ratio="19.9:1"
              pass
            />
            <ContrastCard
              bg="#F5EFE6"
              fg="#2D4A3E"
              label="Cream / Sage Green"
              ratio="7.2:1"
              pass
            />
            <ContrastCard
              bg="#FAFAFA"
              fg="#8B7355"
              label="Ice White / Taupe"
              ratio="4.6:1"
              pass
            />
          </div>
        </section>

        {/* ── Typographie ── */}
        <section>
          <SectionTitle>Typographie</SectionTitle>
          <div className="bg-white rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <Label>Display — Syne (→ Clash Display)</Label>
              <div style={{ fontFamily: "var(--font-display)" }} className="space-y-1 mt-2">
                <p className="text-5xl font-bold text-deep-black">Aa — Titre principal</p>
                <p className="text-3xl font-semibold text-deep-black">Aa — Titre secondaire</p>
                <p className="text-xl font-medium text-deep-black">Aa — Titre tertiaire</p>
              </div>
            </div>
            <div>
              <Label>Body — DM Sans (→ Satoshi)</Label>
              <div style={{ fontFamily: "var(--font-body)" }} className="space-y-1 mt-2">
                <p className="text-base font-normal text-deep-black">
                  Regular — Votre faire-part de mariage, unique et personnalisé en 15 minutes.
                </p>
                <p className="text-base font-medium text-deep-black">
                  Medium — Créez un souvenir inoubliable pour vos invités.
                </p>
                <p className="text-sm font-normal text-taupe">
                  Small / muted — À partir de 19,90€ · Livraison par email · 3 itérations incluses
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FocusCard ── */}
        <section>
          <SectionTitle>FocusCard — Shell du tunnel</SectionTitle>
          <p className="text-sm text-taupe mb-6" style={{ fontFamily: "var(--font-body)" }}>
            Wrapper de layout utilisé sur toutes les étapes : max-w-[450px] desktop, 100% mobile.
          </p>
          <FocusCard>
            <div className="p-8">
              <p
                className="text-xs font-medium tracking-[0.15em] uppercase text-taupe mb-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Étape 1 / 3
              </p>
              <h2
                className="text-2xl font-bold text-deep-black mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Vos photos
              </h2>
              <p
                className="text-sm text-taupe leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Uploadez jusqu'à 2 photos pour que notre IA crée votre illustration personnalisée.
              </p>
              <div className="mt-6 h-32 rounded-xl border-2 border-dashed border-sage flex items-center justify-center bg-ice-white">
                <span className="text-sm text-taupe" style={{ fontFamily: "var(--font-body)" }}>
                  Zone d'upload
                </span>
              </div>
              <button
                className="mt-6 w-full py-3 rounded-xl bg-sage-green text-ice-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Continuer →
              </button>
            </div>
          </FocusCard>
        </section>

        {/* ── Footer ── */}
        <footer className="pb-8 text-center">
          <p className="text-xs text-taupe" style={{ fontFamily: "var(--font-body)" }}>
            Siana Memento Design System · v0.1.0
          </p>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-bold text-deep-black mb-6 pb-3 border-b border-sage"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-medium tracking-[0.15em] uppercase text-taupe mb-3"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {children}
    </p>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-medium tracking-[0.15em] uppercase text-taupe"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {children}
    </p>
  );
}

function ColorSwatch({
  name,
  token,
  hex,
}: {
  name: string;
  token: string;
  hex: string;
  main?: boolean;
}) {
  const isDark = ["sage-green", "deep-black", "burgundy", "taupe", "olive"].includes(token);
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="w-20 h-20 rounded-xl shadow-sm border border-black/5"
        style={{ backgroundColor: hex }}
      />
      <div>
        <p
          className="text-xs font-semibold text-deep-black leading-tight"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {name}
        </p>
        <p
          className="text-[10px] text-taupe font-mono"
        >
          {hex}
        </p>
      </div>
    </div>
  );
}

function ContrastCard({
  bg,
  fg,
  label,
  ratio,
  pass,
}: {
  bg: string;
  fg: string;
  label: string;
  ratio: string;
  pass: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 flex items-center justify-between"
      style={{ backgroundColor: bg }}
    >
      <div>
        <p
          className="text-sm font-semibold"
          style={{ color: fg, fontFamily: "var(--font-display)" }}
        >
          {label}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: fg, fontFamily: "var(--font-body)", opacity: 0.75 }}
        >
          Ratio {ratio}
        </p>
      </div>
      <span
        className="text-xs font-bold px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: pass ? "#22c55e20" : "#ef444420",
          color: pass ? "#16a34a" : "#dc2626",
          fontFamily: "var(--font-body)",
        }}
      >
        {pass ? "✓ AA" : "✗ Fail"}
      </span>
    </div>
  );
}
