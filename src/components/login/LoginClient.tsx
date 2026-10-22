"use client";

import { Suspense } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { LoginContent } from "./LoginContent";
import { useRuntimeConfig } from "@/providers/RuntimeConfigProvider";

export default function LoginClient() {
  const { recaptchaSiteKey } = useRuntimeConfig();
  const content = (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );

  if (recaptchaSiteKey) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey} language="pt">
        {content}
      </GoogleReCaptchaProvider>
    );
  }

  return content;
}
