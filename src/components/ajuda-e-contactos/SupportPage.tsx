"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { SupportPageContent } from "./SupportPageContent";
import type { SupportPageContent as SupportPageContentType } from "@/service/types/support";
import { useRuntimeConfig } from "@/providers/RuntimeConfigProvider";

interface SupportPageProps {
  locale: string;
  pageContent: SupportPageContentType;
}

const SupportPage = ({ locale, pageContent }: SupportPageProps) => {
  const { recaptchaSiteKey } = useRuntimeConfig();
  if (recaptchaSiteKey) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey} language={locale}>
        <SupportPageContent pageContent={pageContent} />
      </GoogleReCaptchaProvider>
    );
  }
  return <SupportPageContent pageContent={pageContent} />;
};

export default SupportPage;
