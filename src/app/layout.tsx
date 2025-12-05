import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/frontend/context/AuthContext";
import { ToastProvider } from "@/frontend/components/ui/Toast";
import { ErrorBoundary } from "@/frontend/components/ui/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Voice Task Tracker",
    template: "%s | Voice Task Tracker",
  },
  description: "Manage your tasks effortlessly with voice commands. Add, complete, and organize tasks by simply speaking.",
  keywords: ["task tracker", "voice commands", "productivity", "todo app", "task management"],
  authors: [{ name: "Voice Task Tracker Team" }],
  creator: "Voice Task Tracker",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Voice Task Tracker",
    description: "Manage your tasks effortlessly with voice commands",
    siteName: "Voice Task Tracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice Task Tracker",
    description: "Manage your tasks effortlessly with voice commands",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
