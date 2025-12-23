import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Só Hoje",
  description: "Defina até 3 prioridades e foque no que importa hoje.",
  manifest: "/manifest.json",
  themeColor: "#0b1220"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" />
        <meta name="theme-color" content="#0b1220" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
