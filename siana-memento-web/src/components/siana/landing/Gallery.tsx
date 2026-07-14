import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CtaButton from "@/components/siana/landing/CtaButton";
import ScrollFloat from "@/components/ScrollFloat";
import ScrollReveal from "@/components/siana/landing/ScrollReveal";
import { cn } from "@/lib/utils";

// Les 5 visuels sont le même couple (Camille & Hugo, la photo de référence du hero)
// décliné dans les 5 templates, générés via le vrai pipeline produit —
// cf. siana-memento-api/scripts/generate_gallery_assets.ts pour les regénérer.
// Ratio 27/37 = dimensions natives des assets (864×1184) : ne pas remettre 3/4, ça recadre.
const templates = [
  {
    id: "boheme",
    name: "Bohème",
    image: "/home/gallery-boheme.png",
    palette: [
      { token: "bg-terracotta", label: "Terre cuite" },
      { token: "bg-cream", label: "Crème" },
      { token: "bg-sage-green", label: "Vert sauge" },
    ],
    description:
      "Le style Bohème capture l'émotion d'un mariage en pleine nature, entre jardin sauvage et campagne chic. Votre couple prend vie en aquarelle, avec des contours doux et des couleurs diluées qui rappellent une peinture peinte à la main. La palette terre cuite, crème et vert sauge installe une ambiance chaleureuse et intime. Un choix idéal pour les mariages champêtres, romantiques et décontractés.",
  },
  {
    id: "moderne",
    name: "Moderne",
    image: "/home/gallery-moderne.png",
    palette: [
      { token: "bg-deep-black", label: "Noir" },
      { token: "bg-ice-white", label: "Blanc" },
      { token: "bg-gold", label: "Or" },
    ],
    description:
      "Le style Moderne transforme votre couple en silhouettes épurées, façon affiche éditoriale. Noir, blanc et or composent une palette sophistiquée, structurée autour de lignes fines dorées et de formes géométriques discrètes. La composition centrée, presque minérale, évoque le luxe discret d'un loft urbain. Un rendu graphique fort, pensé pour les couples qui aiment les lignes nettes et l'élégance sans fioritures.",
  },
  {
    id: "classique",
    name: "Classique",
    image: "/home/gallery-classique.png",
    palette: [
      { token: "bg-burgundy", label: "Bordeaux" },
      { token: "bg-cream", label: "Crème" },
      { token: "bg-gold", label: "Or" },
    ],
    description:
      "Le style Classique reprend la tradition du portrait de mariage peint, dans un rendu doux et intemporel. Votre couple est illustré avec soin, sur un fond crème encadré, dans une lumière chaude de fin de journée. Les tons bordeaux et crème structurent le titre et la date, avec une composition symétrique et centrée. Le choix parfait pour une allure sobre, noble et durablement chic.",
  },
  {
    id: "vintage",
    name: "Vintage",
    image: "/home/gallery-vintage.png",
    palette: [
      { token: "bg-ochre", label: "Ocre" },
      { token: "bg-nude", label: "Beige" },
      { token: "bg-olive", label: "Olive" },
    ],
    description:
      "Le style Vintage puise dans l'esthétique des années 70, entre affiche de voyage et cinéma d'animation rétro. Votre couple est illustré en aplats de couleur ocre, olive et beige, aux contours nets et au trait franc, sur un décor de collines dessinées. Les teintes chaudes et légèrement passées ajoutent une touche nostalgique. Idéal pour les mariages rétro chic, groovy et pleins de caractère.",
  },
  {
    id: "minimaliste",
    name: "Minimaliste",
    image: "/home/gallery-minimaliste.png",
    palette: [
      { token: "bg-nude", label: "Nude" },
      { token: "bg-ice-white", label: "Blanc" },
      { token: "bg-taupe", label: "Taupe" },
    ],
    description:
      "Le style Minimaliste réduit votre couple à l'essentiel : un dessin au trait continu, sans remplissage, posé sur un fond nude immaculé. Les visages sont rendus d'une ligne fine et sûre, le décor à peine suggéré par quelques aplats délavés. Ce dessin épuré, presque zen, convient aux mariages sobres et à la sophistication silencieuse, où chaque détail compte parce qu'il est rare.",
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
        id="gallery-heading"
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

      {/* Enfant unique → ScrollReveal anime ce wrapper et non les cartes : pas de
          translate sur les enfants du rail, donc pas de scrollbar verticale parasite. */}
      <ScrollReveal>
        {/* Mobile/tablette : rail scroll-snap natif (le voisin dépasse = affordance).
            Desktop : grille 6 colonnes, 2 grandes + 3 petites → aucune ligne à trou. */}
        <div
          className={cn(
            "-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-6 px-6 pb-4",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-0"
          )}
        >
          {templates.map((t, i) => {
            const featured = i < 2;
            return (
              <article
                key={t.id}
                aria-label={t.name}
                className={cn(
                  "w-[78vw] shrink-0 snap-center sm:w-[46vw] lg:w-auto lg:shrink",
                  featured ? "lg:col-span-3" : "lg:col-span-2"
                )}
              >
                <Card className="h-full gap-0 overflow-hidden rounded-3xl p-0 py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {/* p-4 pb-6 : passe-partout à marge basse élargie (rehaussement optique
                      de l'encadrement — l'œuvre ne « glisse » pas dans son cadre). */}
                  <div className="p-4 pb-6">
                    <div className="relative aspect-[27/37] overflow-hidden rounded-2xl border">
                      <Image
                        src={t.image}
                        alt={`Save the Date généré par IA dans le style ${t.name}, illustration d'un couple`}
                        fill
                        loading="lazy"
                        // 1023px et non 1024 : `lg:` est min-width 1024, donc à 1024 pile
                        // la grille s'applique déjà. Largeurs desktop = tailles réelles
                        // rendues en max-w-6xl/grid-cols-6 (~504px featured, ~315px sinon).
                        sizes={
                          featured
                            ? "(max-width: 640px) 78vw, (max-width: 1023px) 46vw, 504px"
                            : "(max-width: 640px) 78vw, (max-width: 1023px) 46vw, 315px"
                        }
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5">
                    {/* asChild → vrai <h3> : sans lui la section n'a qu'un <h2> et cinq
                        cartes sans titre (plan de document aplati, navigation AT inopérante). */}
                    <Eyebrow asChild className="mb-2">
                      <h3>{t.name}</h3>
                    </Eyebrow>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {t.description}
                    </p>
                    {/* Palette nommée : lisible, restituée aux lecteurs d'écran, et
                        indexable — remplace 3 pastilles aria-hidden de 10px.
                        <ul> et non <dl> : la pastille n'est pas la « définition » du nom
                        de la couleur, et un <dl> dont le seul <dd> est aria-hidden n'a
                        aucun sens pour un lecteur d'écran. */}
                    <ul className="mt-4 mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
                      {t.palette.map((c) => (
                        <li key={c.token} className="flex items-center gap-1.5">
                          <span
                            className={cn("size-3.5 rounded-full border", c.token)}
                            aria-hidden="true"
                          />
                          <span className="text-xs text-muted-foreground">{c.label}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="h-10 w-full rounded-full">
                      <Link href={`/generate/upload?style=${t.id}`}>
                        Créer en {t.name}
                      </Link>
                    </Button>
                  </div>
                </Card>
              </article>
            );
          })}
        </div>
      </ScrollReveal>

      {/* Un seul CTA primaire pour la section : les 5 cartes ne se disputent plus l'attention. */}
      <div className="mt-12 text-center sm:mt-16">
        <CtaButton href="/generate/upload">Créer mon Save the Date</CtaButton>
      </div>
    </section>
  );
}
