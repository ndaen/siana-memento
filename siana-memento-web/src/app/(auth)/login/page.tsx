"use client";

import { useRouter } from "next/navigation";
import FocusCard from "@/components/siana/FocusCard";
import LoginForm from "@/components/siana/LoginForm";
import GoogleButton from "@/components/siana/GoogleButton";

export default function LoginPage() {
  const router = useRouter();

  return (
    <FocusCard>
      <div className="p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Se connecter
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accédez à votre compte Siana Memento
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <GoogleButton label="Continuer avec Google" />
          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <LoginForm onSuccess={() => router.push("/")} />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <a
            href="/register"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Créer un compte
          </a>
        </p>
      </div>
    </FocusCard>
  );
}
