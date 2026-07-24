import type { Metadata } from "next";
import { Comic_Relief } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const comicRelief = Comic_Relief({
  variable: "--font-comic-relief",
  weight: ["400", "700"],
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Maintenance Reminder",
  description: "Track and stay on top of your vehicle maintenance.",
  icons: {
    icon: [
      { url: "/webFevicon192x192.png", sizes: "16x16", type: "image/png" },
      { url: "/webFevicon192x192.png", sizes: "32x32", type: "image/png" },
      { url: "/webFevicon192x192.png", sizes: "any" },
    ],
    apple: "/webFevicon192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${comicRelief.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
