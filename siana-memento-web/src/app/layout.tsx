import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/siana/ThemeProvider";

export const metadata: Metadata = {
  title: "Siana Memento — Save the Date en 15 minutes",
  description:
    "Créez votre faire-part de mariage personnalisé par IA en 15 minutes. Designs uniques à partir de vos photos. À partir de 19,90€.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
