import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Talko Console",
  description: "Enterprise console for talko-service: voice, CDR, analytics and configuration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${mono.variable} min-h-full bg-mist font-sans text-zinc-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
