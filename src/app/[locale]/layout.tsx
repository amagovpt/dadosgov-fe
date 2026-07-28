import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import Footer from "@/components/Footer";
import { PopupProviderWrapper } from "@/components/PopupProviderWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { siteConfig } from "@/config/site";
import ScrollTop from "@/components/ScrollTop";
import { ApolloWrapper } from "@/providers/ApolloProvider";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { getHeaderNavigation } from "@/service/commom/header";
import type { HeaderNavigationData } from "@/service/types/header";
import { Footer as FooterType } from "@/service/types/header/footer";
import { getFooter } from "@/service/commom/footer";
import { i18nConfig } from "@/config/i18nConfig";
import initTranslations from "../i18n";
import TranslationsProvider from "@/providers/TranslationProvider";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
});

const namespaces = [
  "common",
  "footer",
  "home",
  "datastories",
  "datasets",
  "login",
  "reuses",
  "organizations",
  "dataservices",
  "admin-common",
  "admin-harvesters",
  "admin-dataservices",
  "admin-datasets",
  "admin-community-resources",
  "admin-organizations",
  "admin-reuses",
  "admin-discussions",
  "admin-notifications",
  "admin-users",
  "admin-members",
  "admin-profile",
  "admin-posts",
  "admin-topics",
  "admin-logs",
  "admin-editorial",
  "admin-statistics"
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const host = (await headers()).get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const siteUrl = `${protocol}://${host}`;
  const { t } = await initTranslations({
    locale,
    namespaces,
  });

  return {
    title: {
      default: t("title"),
      template: `%s | ${siteConfig.title}`,
    },
    description: t("description"),
    icons: {
      icon: "/favicon.png",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: siteConfig.url,
      siteName: t("name"),
      locale: locale,
      type: "website",
      images: [`${siteUrl}/og-images/metadados_dadosgov.jpg`],
    },
    other: {
      "google-site-verification": "D63gacp78VxL2YWR2JTOYCE25ZpsdIazq4IR4ojc57k",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = i18nConfig.locales.includes(rawLocale) ? rawLocale : i18nConfig.defaultLocale;
  const { resources, t } = await initTranslations({
    locale,
    namespaces,
  });

  let headerNavigation: HeaderNavigationData;
  try {
    headerNavigation = await getHeaderNavigation("pt");
  } catch (error) {
    console.error("Error fetching header navigation:", error);
    headerNavigation = {} as HeaderNavigationData;
  }

  let footerData: FooterType;
  try {
    footerData = await getFooter(locale);
  } catch (error) {
    console.error("Error fetching footer data:", error);
    footerData = {} as FooterType;
  }

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={`${notoSans.variable} ${notoSansMono.variable} antialiased`}>
        <AuthProvider>
          <ApolloWrapper>
            <TranslationsProvider locale={locale} namespaces={namespaces} resources={resources}>
              <PopupProviderWrapper>
                <ScrollTop />
                <div className="flex min-h-screen w-full flex-col">
                  <HeaderWrapper data={headerNavigation} />
                  <div className="">{children}</div>
                  <Footer data={footerData} />
                </div>
              </PopupProviderWrapper>
            </TranslationsProvider>
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
