"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface RuntimeConfig {
  /** Whether SAML (Autenticação.gov / eIDAS) is wired up, so its buttons can work. */
  samlEnabled: boolean;
  /** Public reCAPTCHA v3 site key; empty skips reCAPTCHA. */
  recaptchaSiteKey: string;
}

const DISABLED: RuntimeConfig = { samlEnabled: false, recaptchaSiteKey: "" };

const RuntimeConfigContext = createContext<RuntimeConfig>(DISABLED);

export function RuntimeConfigProvider({
  value,
  children,
}: {
  value: RuntimeConfig;
  children: ReactNode;
}) {
  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>;
}

/** Settings read from the container environment by `getRuntimeConfig()`. */
export function useRuntimeConfig(): RuntimeConfig {
  return useContext(RuntimeConfigContext);
}
