"use server";

import {Resend} from "resend";

export type WaitlistResult =
    | { success: true }
    | { success: false; error: string };

export async function subscribeToWaitlist(
    email: string
): Promise<WaitlistResult> {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {success: false, error: "Adresse email invalide."};
    }

    const apiKey = process.env.RESEND_API_KEY;
    const segmentId = process.env.RESEND_SEGMENT_ID;

    if (!apiKey || !segmentId) {
        console.error("Resend env vars manquantes");
        return {success: false, error: "Service indisponible. Réessayez plus tard."};
    }

    const resend = new Resend(apiKey);

    try {
        await resend.contacts.create({
            email,
            unsubscribed: false,
            segments: [{id: segmentId}],
        });
        return {success: true};
    } catch (err) {
        console.error("Resend error:", err);
        return {success: false, error: "Une erreur est survenue. Réessayez plus tard."};
    }
}
