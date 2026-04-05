import type {Metadata} from "next";
import "./globals.css";
import {ThemeProvider} from "@/components/siana/ThemeProvider";
import {Toaster} from "@/components/ui/sonner";
import {Analytics} from "@vercel/analytics/next"
import SiteHeader from "@/components/siana/SiteHeader"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://siana-memento.com";

export const metadata: Metadata = {
    title: "Créez votre Save the Date unique avec l'IA | Siana Memento",
    description:
        "Créez votre faire-part de mariage personnalisé par IA en 15 minutes. Designs uniques à partir de vos photos. À partir de 19,90€.",
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: "Créez votre Save the Date unique avec l'IA | Siana Memento",
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
        title: "Créez votre Save the Date unique avec l'IA | Siana Memento",
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
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none">
                Aller au contenu principal
            </a>
            <SiteHeader />
            <div id="main-content">
                {children}
            </div>
            <Analytics/>
            <Toaster richColors position="bottom-center"/>
        </ThemeProvider>
        </body>
        </html>
    );
}
