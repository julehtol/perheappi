import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";

const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800", "900"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Perheappi",
  description: "Perheen yhteinen ostoslista, ruokalista, reseptit ja kalenteri",
  applicationName: "Perheappi",
  appleWebApp: { capable: true, title: "Perheappi", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8ef",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi" className={nunito.variable} style={{ ["--font-sans" as string]: "var(--font-nunito), ui-rounded, system-ui, sans-serif" }}>
      <body className="min-h-dvh antialiased">
        <div className="app-bg" aria-hidden />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
