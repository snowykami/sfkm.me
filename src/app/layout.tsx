import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

// Context
import { DeviceProvider } from "@/contexts/DeviceContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { TerminalProvider } from "@/contexts/TerminalCommandContext";
import { WindowManagerProvider } from "@/contexts/WindowManagerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Script from "next/script";
import config from "@/config";

function getLang() {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.split("-")[0];
  }
  if (typeof window !== "undefined" && window.navigator.language) {
    return window.navigator.language.split("-")[0];
  }
  // fallback
  return "en";
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: config.meta.title,
  description: config.meta.description,
  keywords: config.meta.keywords,
  icons: {
    icon: config.meta.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={getLang()}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script src="https://cdn.liteyuki.org/js/cdn_info.js" />
        <MusicProvider>
          <TerminalProvider>
            <DeviceProvider>
              <WindowManagerProvider>
                <ThemeProvider>{children}</ThemeProvider>
              </WindowManagerProvider>
            </DeviceProvider>
          </TerminalProvider>
        </MusicProvider>
      </body>
    </html>
  );
}
