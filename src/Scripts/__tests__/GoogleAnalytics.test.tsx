/**
 * GA runs in Consent Mode "basic": gtag.js must not be requested until the
 * visitor consents to the GA service in Usercentrics. QA saw cookieless pings
 * after "Rejeitar" because gtag.js used to load unconditionally from <head>.
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import GoogleAnalytics, { isAnalyticsConsented } from "../GoogleAnalytics";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GA_ID = "G-TEST123";
const gtagScripts = () => document.head.querySelectorAll('script[src*="googletagmanager.com"]');
const commands = () => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));

const details = (gaGiven: boolean) => ({
  services: {
    HkocEodjb7: { name: "Google Analytics", consent: { given: gaGiven } },
    BJ59EidsWQ: { name: "Google reCAPTCHA", consent: { given: true } },
  },
});

const fireConsent = (detail: ReturnType<typeof details>) =>
  act(() => {
    window.dispatchEvent(new CustomEvent("UC_CONSENT", { detail }));
  });

describe("GoogleAnalytics", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GoogleAnalytics gaId={GA_ID} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    gtagScripts().forEach((s) => s.remove());
    delete window.dataLayer;
    delete window.gtag;
    delete window.__ucCmp;
  });

  it("requests nothing from Google before consent", () => {
    expect(gtagScripts()).toHaveLength(0);
    expect(window.dataLayer ?? []).toEqual([]);
  });

  it("requests nothing when the visitor refuses GA", () => {
    fireConsent(details(false));
    expect(gtagScripts()).toHaveLength(0);
    expect(commands()).toEqual([]);
  });

  it("loads gtag.js once, granting analytics_storage first, when GA is consented", () => {
    fireConsent(details(true));
    fireConsent(details(true));

    expect(gtagScripts()).toHaveLength(1);
    expect(commands()[0]).toEqual(["consent", "update", { analytics_storage: "granted" }]);
    expect(commands().filter((c) => c[0] === "config")).toEqual([["config", GA_ID]]);
  });

  it("denies analytics_storage again when consent is withdrawn", () => {
    fireConsent(details(true));
    fireConsent(details(false));

    expect(commands().at(-1)).toEqual(["consent", "update", { analytics_storage: "denied" }]);
  });
});

describe("isAnalyticsConsented", () => {
  it("matches both the GA and GA4 Usercentrics templates by name", () => {
    const ga4 = { services: { x: { name: "Google Analytics 4", consent: { given: true } } } };
    expect(isAnalyticsConsented(ga4)).toBe(true);
    expect(isAnalyticsConsented(details(true))).toBe(true);
  });

  it("is false without consent details or without a GA service", () => {
    expect(isAnalyticsConsented(undefined)).toBe(false);
    expect(
      isAnalyticsConsented({ services: { y: { name: "Google reCAPTCHA", consent: { given: true } } } })
    ).toBe(false);
  });
});
