import type { Metadata } from "next";
import { notoSans, notoSansMono } from "../fonts";
import "./globals.css";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import Footer from "@/components/Footer";
import { PopupProviderWrapper } from "@/components/PopupProviderWrapper";
import { ToastProviderWrapper } from "@/providers/ToastProviderWrapper";
import { ApiErrorProvider } from "@/providers/ApiErrorProvider";
import { AuthProvider } from "@/context/AuthContext";
import { siteConfig } from "@/config/site";
import ScrollTop from "@/components/ScrollTop";
import NewAccountNotice from "@/components/login/NewAccountNotice";
import ConfirmEmailNotice from "@/components/login/ConfirmEmailNotice";
import CompleteRegistrationGate from "@/components/login/CompleteRegistrationGate";
import { ApolloWrapper } from "@/providers/ApolloProvider";
import { headers } from "next/headers";
import { ReactNode, Suspense } from "react";
import { loadShellData } from "@/service/commom/shell";
import { i18nConfig } from "@/config/i18nConfig";
import initTranslations from "../i18n";
import TranslationsProvider from "@/providers/TranslationProvider";

const namespaces = [
  "common",
  "footer",
  "datastories",
  "datasets",
  "login",
  "learning",
  "documentation",
  "profile",
  "reuses",
  "organizations",
  "dataservices",
  "support",
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
  const { resources } = await initTranslations({
    locale,
    namespaces,
  });

  // Throws when both halves of the shell are unavailable, which sends the
  // request to `app/global-error.tsx` rather than serving an empty frame.
  const { headerNavigation, footerData } = await loadShellData(locale);

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={`${notoSans.variable} ${notoSansMono.variable} antialiased`}>
        <AuthProvider>
          <ApolloWrapper>
            <TranslationsProvider locale={locale} namespaces={namespaces} resources={resources}>
              <ToastProviderWrapper>
                <ApiErrorProvider>
                  <PopupProviderWrapper>
                    <ScrollTop />
                    <div className="flex min-h-screen w-full flex-col">
                      <HeaderWrapper data={headerNavigation} />
                      <Suspense fallback={null}>
                        <NewAccountNotice />
                      </Suspense>
                      <Suspense fallback={null}>
                        <ConfirmEmailNotice />
                      </Suspense>
                      <Suspense fallback={null}>
                        <CompleteRegistrationGate />
                      </Suspense>
                      <div className="">{children}</div>
                      <Footer data={footerData} />
                    </div>
                  </PopupProviderWrapper>
                </ApiErrorProvider>
              </ToastProviderWrapper>
            </TranslationsProvider>
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
