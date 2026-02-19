import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
