"use client";

import { useRouter } from "next/navigation";
import FocusCard from "@/components/siana/FocusCard";
import RegisterForm from "@/components/siana/RegisterForm";

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

        <RegisterForm onSuccess={() => router.push("/")} />
      </div>
    </FocusCard>
  );
}
