"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser, type User } from "@/lib/api/auth";

interface LoginFormProps {
  onSuccess: (user: User) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setGeneralError("");

    const emailToSubmit = email.trim();

    if (!emailToSubmit || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSubmit)) {
       setEmailError("Adresse email invalide.");
       emailRef.current?.focus();
       return;
    }

    setStatus("loading");

    const result = await loginUser({ email: emailToSubmit, password });

    if (result.success) {
      onSuccess(result.user);
    } else {
      setStatus("idle");

      if (result.errorCode === "INVALID_CREDENTIALS") {
        setGeneralError("Email ou mot de passe incorrect");
      } else {
        toast.error(result.message ?? "Une erreur inattendue s'est produite.", {
          position: "top-right",
        });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {generalError && (
        <p role="alert" className="text-sm text-destructive text-center">
          {generalError}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="login-email"
          ref={emailRef}
          type="email"
          placeholder="votre@email.fr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
            if (generalError) setGeneralError("");
          }}
          required
          disabled={status === "loading"}
          autoComplete="email"
          aria-describedby={emailError ? "login-email-error" : undefined}
          aria-invalid={!!emailError}
        />
        {emailError && (
          <p id="login-email-error" role="alert" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-sm font-medium text-foreground">
          Mot de passe
        </label>
        <Input
          id="login-password"
          type="password"
          placeholder="Votre mot de passe"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (generalError) setGeneralError("");
          }}
          required
          disabled={status === "loading"}
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        disabled={status === "loading"}
        size="lg"
        className="w-full font-semibold"
      >
        {status === "loading" ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
