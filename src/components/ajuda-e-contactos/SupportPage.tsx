"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { SupportPageContent } from "./SupportPageContent";
import type { SupportPageContent as SupportPageContentType } from "@/service/types/support";

const RECAPTCHA_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

interface SupportPageProps {
  locale: string;
  pageContent: SupportPageContentType;
}

const SupportPage = ({ locale, pageContent }: SupportPageProps) => {
  if (RECAPTCHA_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_KEY} language={locale}>
        <SupportPageContent pageContent={pageContent} />
      </GoogleReCaptchaProvider>
    );
  }
  return <SupportPageContent pageContent={pageContent} />;
};

export default SupportPage;
