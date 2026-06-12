import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "sonner";
import { ThemeProvider, NO_FLASH_THEME_SCRIPT } from "@/components/shell/ThemeProvider";
import { Sidebar } from "@/components/shell/Sidebar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { GA_ID, isAnalyticsEnabled } from "@/lib/analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const serifDisplay = Source_Serif_4({
  variable: "--font-serif-display",
  subsets: ["latin"],
});

const monoCode = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "claudeai",
    template: "%s — claudeai",
  },
  description:
    "Chat, projects, artifacts, skills, connectors — claude.ai reproduced as a Next 16 fleet site.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#262624" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${serifDisplay.variable} ${monoCode.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
        {isAnalyticsEnabled() && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
              id="ga-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });
`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex min-h-screen flex-1 flex-col">{children}</main>
          </div>
          <CommandPalette />
          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
