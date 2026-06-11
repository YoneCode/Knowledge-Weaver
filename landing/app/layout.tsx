import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jbm = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jbm",
});

export const metadata: Metadata = {
  title: "KnowledgeWeaver",
  description:
    "Every contribution is judged independently by a quorum of GenLayer validators. Only their semantic agreement writes to chain.",
  metadataBase: new URL("https://knowledgeweaver.example"),
  openGraph: {
    title: "KnowledgeWeaver",
    description:
      "An on-chain knowledge graph governed by independent AI judgment. Built on GenLayer Bradbury.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jbm.variable}`}>
      <body className="font-sans antialiased text-md text-ink bg-canvas selection:bg-accent-tint">
        {children}
      </body>
    </html>
  );
}
