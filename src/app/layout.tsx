import type { Metadata } from "next";
import { DM_Sans, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/hooks/useAuth";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "AgentCast — Stream AI Agent Sessions",
  description:
    "Watch, share, and replay AI coding agent sessions in real time. Multi-agent support, live chat, and session highlights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="auto-theme">
      <body
        className={`${dmSans.variable} ${outfit.variable} ${ibmPlexMono.variable} min-h-screen flex flex-col`}
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
