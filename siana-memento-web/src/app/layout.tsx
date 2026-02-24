import type {Metadata} from "next";
import "./globals.css";
import {ThemeProvider} from "@/components/siana/ThemeProvider";
import {Toaster} from "@/components/ui/sonner";
import {Analytics} from "@vercel/analytics/next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://siana-memento.com";

export const metadata: Metadata = {
    title: "Siana Memento — Save the Date en 15 minutes",
    description:
        "Créez votre faire-part de mariage personnalisé par IA en 15 minutes. Designs uniques à partir de vos photos. À partir de 19,90€.",
    openGraph: {
        title: "Siana Memento — Save the Date en 15 minutes",
        description:
            "Créez votre faire-part de mariage personnalisé par IA en 15 minutes. Designs uniques à partir de vos photos. À partir de 19,90€.",
        url: siteUrl,
        siteName: "Siana Memento",
        images: [
            {
                url: `${siteUrl}/og-image.jpg`,
                width: 1200,
                height: 630,
                alt: "Siana Memento — Save the Date personnalisé par IA",
            },
        ],
        locale: "fr_FR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Siana Memento — Save the Date en 15 minutes",
        description:
            "Créez votre faire-part de mariage personnalisé par IA en 15 minutes. À partir de 19,90€.",
        images: [`${siteUrl}/og-image.jpg`],
    },
    metadataBase: new URL(siteUrl),
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
        <body className="antialiased">
        <ThemeProvider>
            {children}
            <Analytics/>
            <Toaster richColors position="bottom-center"/>
        </ThemeProvider>
        </body>
        </html>
    );
}
