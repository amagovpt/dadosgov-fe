import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Footer } from "@/components/Footer";
import { PopupProviderWrapper } from "@/components/PopupProviderWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { siteConfig } from "@/config/site";
import ScrollTop from "@/components/ScrollTop";
import { ApolloWrapper } from "@/providers/ApolloProvider";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <body className={`${notoSans.variable} antialiased font-sans`}>
        <AuthProvider>
          <ApolloWrapper>
            <PopupProviderWrapper>
              <ScrollTop />
              <div className="min-h-screen w-full flex flex-col">
                <HeaderWrapper />
                <div className="">
                  {children}
                </div>
                <Footer />
              </div>
            </PopupProviderWrapper>
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
