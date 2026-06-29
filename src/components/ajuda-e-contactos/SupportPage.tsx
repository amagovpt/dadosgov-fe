"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { SupportPageContent } from "./SupportPageContent";

const RECAPTCHA_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

const SupportPage = () => {
  if (RECAPTCHA_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_KEY} language="pt">
        <SupportPageContent />
      </GoogleReCaptchaProvider>
    );
  }
  return <SupportPageContent />;
};

export default SupportPage;
