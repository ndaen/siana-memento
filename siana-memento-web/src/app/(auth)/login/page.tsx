"use client";

import { useRouter } from "next/navigation";
import FocusCard from "@/components/siana/FocusCard";
import LoginForm from "@/components/siana/LoginForm";

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

        <LoginForm onSuccess={() => router.push("/")} />
      </div>
    </FocusCard>
  );
}
