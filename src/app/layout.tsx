import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-bricolage", display: "swap",
});
const figtree = Figtree({
  subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree", display: "swap",
});

export const metadata: Metadata = {
  title: "HigFlow",
  description: "Ordens de serviço, agenda, clientes e financeiro da LavCri.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
