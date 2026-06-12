import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Noto_Serif_Ethiopic } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QuoteProvider } from "@/components/providers/QuoteProvider";
import { OnlineStatusProvider } from "@/components/providers/OnlineStatusProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import "./globals.css";

// ── Load Google Fonts ────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSerifEthiopic = Noto_Serif_Ethiopic({
  subsets: ["latin"],
  variable: "--font-noto-serif-ethiopic",
  display: "swap",
  weight: ["400", "700"],
});

// ── Page Metadata (SEO) ─────────────────────────
export const metadata: Metadata = {
  title: "መንገዱ — The Way",
  description:
    "A bilingual spiritual tracking app for daily discipline and growth.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "The Way",
    statusBarStyle: "default",
  },
};

// ── Viewport (Theme Color & Scale Lock) ─────────
export const viewport: Viewport = {
  themeColor: "#F0E6D4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ── Root Layout ─────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSerifEthiopic.variable} font-sans bg-parchment-light text-umber-deep antialiased`}
      >
        <AuthProvider>
          <OnlineStatusProvider>
            <LocaleProvider>
              <QuoteProvider>{children}</QuoteProvider>
            </LocaleProvider>
          </OnlineStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
