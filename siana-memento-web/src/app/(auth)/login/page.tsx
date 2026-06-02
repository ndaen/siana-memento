"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FocusCard from "@/components/siana/FocusCard";
import LoginForm from "@/components/siana/LoginForm";
import GoogleButton from "@/components/siana/GoogleButton";

// Retour post-login : n'autorise que les chemins internes absolus.
// Rejette les URLs absolues (https://…) et protocol-relative (//host) → anti open-redirect.
function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  // Rejette tout caractère de contrôle (\t \n \r, etc.) qui peut contourner les protections
  // d'URL des navigateurs. (charCodeAt plutôt qu'une regex → évite no-control-regex.)
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return null;
  }
  return raw;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalPath(searchParams.get("redirect"));
  const target = redirectTo ?? "/";

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
          <GoogleButton label="Continuer avec Google" returnTo={redirectTo ?? undefined} />
          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <LoginForm onSuccess={() => router.push(target)} />

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
