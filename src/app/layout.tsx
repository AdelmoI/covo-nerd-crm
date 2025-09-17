// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Il Covo del Nerd - CRM System",
  description: "Sistema CRM per la gestione delle chat clienti e ordini di Il Covo del Nerd",
  keywords: ["CRM", "Il Covo del Nerd", "gestione clienti", "chat", "ordini"],
  authors: [{ name: "Il Covo del Nerd Team" }],
  creator: "Il Covo del Nerd",
  publisher: "Il Covo del Nerd",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  robots: {
    index: false, // CRM interno, non indicizzare
    follow: false,
  },
  openGraph: {
    title: "Il Covo del Nerd - CRM System",
    description: "Sistema CRM per la gestione delle chat clienti e ordini",
    type: "website",
    locale: "it_IT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <meta name="theme-color" content="#1D70B3" />
        <meta name="msapplication-TileColor" content="#1D70B3" />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        {children}
      </body>
    </html>
  );
}