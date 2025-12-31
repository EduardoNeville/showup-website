import type { Metadata } from "next";
import { Geist, Geist_Mono, Crimson_Text } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const crimsonText = Crimson_Text({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Showup - Personal Challenges with Real Stakes",
  description: "Create accountable challenges with deposits and friends. Fiat or crypto-backed escrow for motivation.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/showup-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/showup-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/showup-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/showup-icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${crimsonText.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
