import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Siana Memento",
  description:
    "Découvrez comment Siana Memento protège vos données personnelles. Politique RGPD, durée de conservation, droits des utilisateurs.",
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <h1 className="font-display mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Politique de confidentialité
      </h1>

      <p className="mb-8 text-sm text-muted-foreground">
        Dernière mise à jour : 5 avril 2026
      </p>

      <div className="space-y-10 text-base leading-relaxed text-muted-foreground">
        {/* Introduction */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Introduction
          </h2>
          <p>
            Siana Memento s&apos;engage à protéger la vie privée de ses
            utilisateurs. La présente politique de confidentialité décrit les
            données personnelles que nous collectons, comment nous les utilisons,
            et les droits dont vous disposez conformément au Règlement Général
            sur la Protection des Données (RGPD).
          </p>
        </section>

        {/* Responsable de traitement */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Responsable de traitement
          </h2>
          <p>
            Le responsable du traitement des données personnelles est Siana
            Memento. Pour toute question relative à vos données, vous pouvez
            nous contacter à l&apos;adresse suivante&nbsp;:{" "}
            <a
              href="mailto:support@siana-memento.fr"
              className="text-primary underline underline-offset-2 hover:text-foreground"
            >
              support@siana-memento.fr
            </a>
          </p>
        </section>

        {/* Données collectées */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Données collectées
          </h2>
          <p className="mb-4">
            Dans le cadre de notre service, nous collectons les données
            suivantes&nbsp;:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Photos</strong> — Jusqu&apos;à
              2 photos de couple (JPG ou PNG, max 10 Mo chacune), utilisées
              comme référence pour la génération de votre illustration
              personnalisée.
            </li>
            <li>
              <strong className="text-foreground">Prénoms du couple</strong> —
              Les prénoms des deux personnes figurant sur le Save the Date.
            </li>
            <li>
              <strong className="text-foreground">Adresse email</strong> —
              Utilisée pour la création de compte, la livraison du design et les
              communications liées à votre commande.
            </li>
            <li>
              <strong className="text-foreground">
                Date et lieu du mariage
              </strong>{" "}
              — Informations intégrées dans le design du Save the Date.
            </li>
            <li>
              <strong className="text-foreground">Données de paiement</strong> —
              Traitées directement par Stripe (PCI-DSS Level 1). Siana Memento
              ne stocke aucune donnée bancaire.
            </li>
          </ul>
        </section>

        {/* Durée de conservation */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Durée de conservation
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Photos uploadées</strong> —
              Supprimées automatiquement <strong>7 jours</strong> après
              l&apos;upload, que la commande ait été finalisée ou non.
            </li>
            <li>
              <strong className="text-foreground">Designs générés</strong> —
              Disponibles au re-téléchargement pendant{" "}
              <strong>7 jours</strong> après l&apos;achat, puis supprimés
              automatiquement.
            </li>
            <li>
              <strong className="text-foreground">Données de compte</strong> —
              Conservées tant que le compte est actif. Vous pouvez demander la
              suppression à tout moment.
            </li>
          </ul>
        </section>

        {/* Utilisation des données */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Utilisation des données
          </h2>
          <p className="mb-4">
            Vos données sont utilisées exclusivement pour&nbsp;:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Générer votre illustration personnalisée via notre service d&apos;IA
            </li>
            <li>
              Livrer votre design par email après paiement
            </li>
            <li>
              Gérer votre compte et votre historique de commandes
            </li>
            <li>
              Vous contacter en cas de problème avec votre commande
            </li>
          </ul>
          <p className="mt-4">
            Nous ne vendons, ne louons et ne partageons jamais vos données
            personnelles avec des tiers à des fins commerciales.
          </p>
        </section>

        {/* Sous-traitants */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Sous-traitants
          </h2>
          <p className="mb-4">
            Pour assurer le fonctionnement du service, nous faisons appel aux
            sous-traitants suivants&nbsp;:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Stripe</strong> — Traitement
              des paiements (PCI-DSS Level 1)
            </li>
            <li>
              <strong className="text-foreground">Cloudinary</strong> — Stockage
              temporaire des photos
            </li>
            <li>
              <strong className="text-foreground">Google (Gemini API)</strong> —
              Génération d&apos;illustrations par IA
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> — Hébergement
              du site web
            </li>
            <li>
              <strong className="text-foreground">Railway</strong> — Hébergement
              du serveur applicatif
            </li>
          </ul>
        </section>

        {/* Droits des utilisateurs */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Vos droits
          </h2>
          <p className="mb-4">
            Conformément au RGPD, vous disposez des droits suivants&nbsp;:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Droit d&apos;accès</strong> —
              Obtenir une copie de toutes les données personnelles que nous
              détenons vous concernant.
            </li>
            <li>
              <strong className="text-foreground">
                Droit de rectification
              </strong>{" "}
              — Corriger des données inexactes ou incomplètes.
            </li>
            <li>
              <strong className="text-foreground">
                Droit à l&apos;effacement
              </strong>{" "}
              — Demander la suppression de vos données personnelles.
            </li>
            <li>
              <strong className="text-foreground">
                Droit à la portabilité
              </strong>{" "}
              — Recevoir vos données dans un format structuré et lisible par
              machine.
            </li>
            <li>
              <strong className="text-foreground">
                Droit d&apos;opposition
              </strong>{" "}
              — Vous opposer au traitement de vos données dans certains cas.
            </li>
            <li>
              <strong className="text-foreground">
                Droit de limitation
              </strong>{" "}
              — Demander la limitation du traitement de vos données.
            </li>
          </ul>
          <p className="mt-4">
            Pour exercer l&apos;un de ces droits, contactez-nous à{" "}
            <a
              href="mailto:support@siana-memento.fr"
              className="text-primary underline underline-offset-2 hover:text-foreground"
            >
              support@siana-memento.fr
            </a>
            . Nous nous engageons à répondre dans un délai de 30 jours.
          </p>
        </section>

        {/* Sécurité */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Sécurité des données
          </h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données personnelles contre tout accès
            non autorisé, perte ou altération. Les communications sont chiffrées
            via HTTPS, les paiements sont traités par Stripe (certifié PCI-DSS
            Level 1), et les photos sont automatiquement supprimées après 7
            jours.
          </p>
        </section>

        {/* Réclamation */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Réclamation
          </h2>
          <p>
            Si vous estimez que le traitement de vos données personnelles
            constitue une violation du RGPD, vous avez le droit d&apos;introduire
            une réclamation auprès de la{" "}
            <strong className="text-foreground">CNIL</strong> (Commission
            Nationale de l&apos;Informatique et des Libertés) —{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-foreground"
            >
              www.cnil.fr
            </a>
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-foreground">
            Contact
          </h2>
          <p>
            Pour toute question concernant cette politique de confidentialité ou
            le traitement de vos données, contactez-nous&nbsp;:
          </p>
          <p className="mt-4">
            <a
              href="mailto:support@siana-memento.fr"
              className="text-primary underline underline-offset-2 hover:text-foreground"
            >
              support@siana-memento.fr
            </a>
          </p>
        </section>
      </div>

      <div className="mt-16 border-t border-border pt-8 text-center">
        <Link
          href="/"
          className="text-sm text-primary underline underline-offset-2 hover:text-foreground"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
