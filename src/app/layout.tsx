import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "AnchorMind",
  title: "AnchorMind — one small step, right now",
  description:
    "A calm, supportive tool for moments of anxiety, panic, or rumination: a gentle breathing or grounding exercise, or a short CBT/ACT-informed reflection. Not a diagnostic tool or a substitute for professional or emergency care.",
  appleWebApp: { capable: true, title: "AnchorMind", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="bg-slate-950 font-sans text-slate-100 antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
