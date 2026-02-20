"use client";

import React, {useState} from "react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {subscribeToWaitlist} from "@/app/actions";

export default function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
    const [fieldError, setFieldError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFieldError("");

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError("Adresse email invalide.");
            return;
        }

        setStatus("loading");
        const result = await subscribeToWaitlist(email);

        if (result.success) {
            setStatus("success");
            setEmail("");
        } else {
            setStatus("idle");
            toast.error(result.error, {
                position: 'top-right'
            });
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
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2" noValidate>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
                <label htmlFor="waitlist-email" className="sr-only">
                    Adresse email
                </label>
                <Input
                    id="waitlist-email"
                    type="email"
                    placeholder="votre@email.fr"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldError) setFieldError("");
                    }}
                    required
                    disabled={status === "loading"}
                    aria-describedby={fieldError ? "waitlist-field-error" : undefined}
                    aria-invalid={!!fieldError}
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
            </div>
            {fieldError && (
                <p
                    id="waitlist-field-error"
                    role="alert"
                    className="text-sm text-destructive"
                >
                    {fieldError}
                </p>
            )}
        </form>
    );
}
