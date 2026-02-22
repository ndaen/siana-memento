"use client";

import { useRouter } from "next/navigation";
import FocusCard from "@/components/siana/FocusCard";
import RegisterForm from "@/components/siana/RegisterForm";
import GoogleButton from "@/components/siana/GoogleButton";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <FocusCard>
      <div className="p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Créer un compte
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rejoignez Siana Memento
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <GoogleButton label="S'inscrire avec Google" />
          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <RegisterForm onSuccess={() => router.push("/")} />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <a
            href="/login"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Se connecter
          </a>
        </p>
      </div>
    </FocusCard>
  );
}
