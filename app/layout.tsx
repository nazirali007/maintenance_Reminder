import type { Metadata } from "next";
import { Comic_Relief } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const comicRelief = Comic_Relief({
  variable: "--font-comic-relief",
  weight: ["400", "700"],
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

const siteUrl = getSiteUrl();
const title = "CarSalhakar";
const description =
  "Track every vehicle's service history and get reminded — by estimate, not just when you remember to check — before maintenance falls due.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s — ${title}`,
  },
  description,
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico", sizes: "any" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
  },
  manifest: "/favicon_io/site.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    title,
    description,
    siteName: title,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
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
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
