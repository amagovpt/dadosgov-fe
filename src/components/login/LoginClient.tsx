"use client";

import { Suspense } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { RECAPTCHA_KEY } from "./constants";
import { LoginContent } from "./LoginContent";

export default function LoginClient() {
  const content = (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );

  if (RECAPTCHA_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_KEY} language="pt">
        {content}
      </GoogleReCaptchaProvider>
    );
  }

  return content;
}
