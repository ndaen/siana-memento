"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/lib/api/auth";

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const next: typeof errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Adresse email invalide.";
    }
    if (!password || password.length < 8) {
      next.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }

    setErrors(next);

    if (next.email) {
      emailRef.current?.focus();
    } else if (next.password) {
      passwordRef.current?.focus();
    }

    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    setStatus("loading");

    const result = await registerUser({
      email,
      password,
      fullName: fullName.trim() || undefined,
    });

    if (result.success) {
      onSuccess();
    } else {
      setStatus("idle");

      if (result.errorCode === "DUPLICATE_EMAIL") {
        const next = { email: "Un compte existe déjà avec cet email" };
        setErrors(next);
        emailRef.current?.focus();
      } else {
        toast.error(result.message ?? "Une erreur inattendue s'est produite.", {
          position: "top-right",
        });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="register-full-name" className="text-sm font-medium text-foreground">
          Prénom et nom <span className="text-muted-foreground">(optionnel)</span>
        </label>
        <Input
          id="register-full-name"
          type="text"
          placeholder="Sophie Thomas"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={status === "loading"}
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="register-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="register-email"
          ref={emailRef}
          type="email"
          placeholder="votre@email.fr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          required
          disabled={status === "loading"}
          autoComplete="email"
          aria-describedby={errors.email ? "register-email-error" : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p id="register-email-error" role="alert" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="register-password" className="text-sm font-medium text-foreground">
          Mot de passe
        </label>
        <Input
          id="register-password"
          ref={passwordRef}
          type="password"
          placeholder="8 caractères minimum"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          required
          disabled={status === "loading"}
          autoComplete="new-password"
          aria-describedby={errors.password ? "register-password-error" : undefined}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p id="register-password-error" role="alert" className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={status === "loading"}
        size="lg"
        className="w-full font-semibold"
      >
        {status === "loading" ? "Inscription…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
