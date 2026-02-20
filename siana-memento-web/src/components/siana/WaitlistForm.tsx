"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToWaitlist } from "@/app/actions";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const result = await subscribeToWaitlist(email);

    if (result.success) {
      setStatus("success");
      setEmail("");
    } else {
      setStatus("error");
      setErrorMsg(result.error);
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-2 py-4 text-center"
      >
        <span className="text-2xl" aria-hidden="true">🌿</span>
        <p className="font-display text-lg font-semibold text-foreground">
          Vous êtes sur la liste&nbsp;!
        </p>
        <p className="text-sm text-muted-foreground">
          Nous vous préviendrons dès le lancement de Siana Memento.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row"
      noValidate
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Adresse email
      </label>
      <Input
        id="waitlist-email"
        type="email"
        placeholder="votre@email.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
        aria-describedby={status === "error" ? "waitlist-error" : undefined}
        aria-invalid={status === "error"}
        className="h-11 flex-1 bg-white/80 text-foreground placeholder:text-muted-foreground/60 backdrop-blur-sm"
      />
      <Button
        type="submit"
        disabled={status === "loading" || !email}
        size="lg"
        className="h-11 shrink-0 px-8 font-semibold"
      >
        {status === "loading" ? "Inscription…" : "Rejoindre la liste"}
      </Button>
      {status === "error" && (
        <p
          id="waitlist-error"
          role="alert"
          aria-live="assertive"
          className="w-full text-center text-sm text-destructive sm:text-left"
        >
          {errorMsg}
        </p>
      )}
    </form>
  );
}
