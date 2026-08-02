import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import { BgmProvider } from "@/components/BgmProvider";
import BgmConsentModal from "@/components/BgmConsentModal";
import AnimatedBackground from "@/components/AnimatedBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gachaly",
  description: "Gacha x Daily | 日常のマンネリをランダムミッションで突破するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AnimatedBackground />
        <BgmProvider>
          <BgmConsentModal />
          {children}
        </BgmProvider>
        <Footer />
      </body>
    </html>
  );
}