import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthProvider from "@/components/auth-provider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { DEFAULT_SITE_NAME, DEFAULT_SITE_ICON } from "@/lib/default-logo";
import prisma from "@/lib/prisma";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    const name = settings.siteName || DEFAULT_SITE_NAME;
    const subtitle = settings.siteSubtitle || "在线评测系统";
    const data: Metadata = {
      title: subtitle ? `${name} - ${subtitle}` : name,
      description: "现代化在线OJ系统，支持代码提交与自动判题",
    };
    if (settings.siteIcon && settings.siteIcon !== DEFAULT_SITE_ICON) {
      data.icons = { icon: settings.siteIcon };
    }
    return data;
  } catch {
    return {
      title: "LOJ - 在线评测系统",
      description: "现代化在线OJ系统，支持代码提交与自动判题",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteName = DEFAULT_SITE_NAME;
  let footerText = "";
  let adsEnabled = false;
  let adsPublisherId = "";
  try {
    const settings = await prisma.settings.findFirst();
    if (settings?.siteName) siteName = settings.siteName;
    if (settings?.footerText) footerText = settings.footerText;
    adsEnabled = settings?.adsEnabled ?? false;
    adsPublisherId = settings?.adsPublisherId || "";
  } catch {}

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        {adsEnabled && adsPublisherId && (
          <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsPublisherId}`} crossOrigin="anonymous" />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer siteName={siteName} footerText={footerText} />
              </div>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
