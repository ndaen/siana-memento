import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import CtaButton from "@/components/siana/landing/CtaButton";
import ScrollFloat from "@/components/ScrollFloat";
import ScrollReveal from "@/components/siana/landing/ScrollReveal";

// TODO(assets) : images actuelles = 5 couples DIFFÉRENTS (un par template), utilisées ici
// comme placeholders temporaires. AC1 demande le MÊME couple décliné dans les 5 styles —
// swap dès que ces 5 assets sont livrés (dépendance signalée à Aldo, story 7.4 D2).
const templates = [
  {
    id: "boheme",
    name: "Bohème",
    image: "/home/sophie&thomas.png",
    palette: ["bg-terracotta", "bg-cream", "bg-sage-green"],
    description:
      "Le style Bohème capture l'émotion d'un mariage en pleine nature, entre jardin sauvage et campagne chic. Votre couple prend vie en aquarelle, avec des contours doux et des couleurs diluées qui rappellent une peinture peinte à la main. La palette terre cuite, crème et vert sauge installe une ambiance chaleureuse et intime. Un choix idéal pour les mariages champêtres, romantiques et décontractés.",
  },
  {
    id: "moderne",
    name: "Moderne",
    image: "/home/lea&antoine.png",
    palette: ["bg-deep-black", "bg-ice-white", "bg-gold"],
    description:
      "Le style Moderne transforme votre couple en silhouettes épurées, façon affiche éditoriale. Noir, blanc et or composent une palette sophistiquée, structurée autour de lignes fines dorées et de formes géométriques discrètes. La composition centrée, presque minérale, évoque le luxe discret d'un loft urbain. Un rendu graphique fort, pensé pour les couples qui aiment les lignes nettes et l'élégance sans fioritures.",
  },
  {
    id: "classique",
    name: "Classique",
    image: "/home/marie&hugo.png",
    palette: ["bg-burgundy", "bg-cream", "bg-gold"],
    description:
      "Le style Classique s'inspire du portrait dessiné au crayon, dans la tradition des faire-part de mariage intemporels. Votre couple est esquissé avec soin, dans des tons bordeaux et crème rehaussés d'un monogramme doré. La composition symétrique et les ornements discrets évoquent l'élégance d'un mariage de château. Le choix parfait pour une allure sobre, noble et durablement chic.",
  },
  {
    id: "vintage",
    name: "Vintage",
    image: "/home/camille&julien.png",
    palette: ["bg-ochre", "bg-nude", "bg-olive"],
    description:
      "Le style Vintage puise dans l'esthétique rotoscope des années 70, entre pochettes de vinyle et cinéma d'animation rétro. Votre couple est illustré en aplats de couleur ocre, olive et beige, contours nets, dans une mise en page façon couverture de magazine. Un grain photographique discret ajoute une touche nostalgique. Idéal pour les mariages rétro chic, groovy et pleins de caractère.",
  },
  {
    id: "minimaliste",
    name: "Minimaliste",
    image: "/home/emma&lucas.png",
    palette: ["bg-nude", "bg-ice-white", "bg-taupe"],
    description:
      "Le style Minimaliste réduit votre couple à l'essentiel : une ligne continue, tracée d'un seul trait, sur un fond nude immaculé. Aucune fioriture, juste un large espace blanc et une fine ligne taupe qui structure la composition. Ce dessin épuré, presque zen, convient aux mariages sobres et à la sophistication silencieuse, où chaque détail compte parce qu'il est rare.",
  },
];

export default function Gallery() {
  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="scroll-mt-20 mx-auto max-w-6xl px-6 py-16 sm:py-24"
    >
      <ScrollFloat
        containerClassName="font-display mb-4 text-center font-bold tracking-tight text-foreground"
        textClassName="text-3xl sm:text-4xl leading-[1.2]"
      >
        Un couple, cinq interprétations
      </ScrollFloat>
      <p className="mx-auto mb-12 max-w-2xl text-center text-base text-muted-foreground sm:mb-16 sm:text-lg">
        Les mêmes photos, réinterprétées par notre IA dans cinq univers artistiques
        distincts. Bohème, Moderne, Classique, Vintage ou Minimaliste : chaque style
        raconte votre histoire différemment. Découvrez celui qui vous ressemble.
      </p>

      <ScrollReveal className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <article key={t.id} aria-label={`Exemple de Save the Date style ${t.name}`}>
            <Card className="h-full gap-0 overflow-hidden rounded-3xl p-0 py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="p-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border">
                  <Image
                    src={t.image}
                    alt={`Save the Date généré par IA dans le style ${t.name}, illustration d'un couple`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col px-5 pb-5">
                <Eyebrow className="mb-2">{t.name}</Eyebrow>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
                <div className="mt-4 mb-4 flex gap-1.5" aria-hidden="true">
                  {t.palette.map((c) => (
                    <span key={c} className={`h-2.5 w-2.5 rounded-full border ${c}`} />
                  ))}
                </div>
                <CtaButton href="/generate/upload" timePromise={null} className="w-full">
                  Créer avec ce style
                </CtaButton>
              </div>
            </Card>
          </article>
        ))}
      </ScrollReveal>
    </section>
  );
}
