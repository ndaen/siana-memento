import { cn } from "@/lib/utils";

interface FocusCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FocusCard — Shell de layout pour toutes les pages du tunnel.
 *
 * Centré horizontalement, max-width 450px desktop, pleine largeur mobile.
 * Utilisé comme wrapper de base pour les étapes de création :
 * upload, sélection template, formulaire, génération, paiement.
 */
export default function FocusCard({ children, className }: FocusCardProps) {
  return (
    <div className="min-h-screen bg-ice-white flex items-center justify-center px-4 py-8">
      <div
        className={cn(
          "w-full max-w-[450px]",
          "bg-white rounded-2xl",
          "shadow-[0_4px_24px_rgba(9,9,11,0.08)]",
          "overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
