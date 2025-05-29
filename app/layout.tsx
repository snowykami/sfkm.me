import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AudioProvider } from '@/contexts/AudioContext';
import "./globals.css";

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
  title: "Snowykami OS",
  description: "Welcome~",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={getLang()}>
      <head>
        <link rel="icon" href="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
