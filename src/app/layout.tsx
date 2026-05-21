import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Footer } from "@/components/Footer";
import { PopupProviderWrapper } from "@/components/PopupProviderWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { siteConfig } from "@/config/site";
import ScrollTop from "@/components/ScrollTop";
import { ApolloWrapper } from "@/providers/ApolloProvider";
import { headers } from "next/headers";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const host = (await headers()).get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const siteUrl = `${protocol}://${host}`;

  return {
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.title}`,
    },
    description: siteConfig.description,
    icons: {
      icon: "/favicon.png",
    },
    openGraph: {
      title: siteConfig.title,
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [`${siteUrl}/og-images/metadados_dadosgov.jpg`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <body className={`${notoSans.variable} ${notoSansMono.variable} antialiased`}>
        <AuthProvider>
          <ApolloWrapper>
            <PopupProviderWrapper>
              <ScrollTop />
              <div className="flex min-h-screen w-full flex-col">
                <HeaderWrapper />
                <div className="">{children}</div>
                <Footer />
              </div>
            </PopupProviderWrapper>
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
