/**
 * Usercentrics manages GA: gtag.js is rendered inert (`type="text/plain"`) and
 * the CMP activates it on consent to the "Google Analytics 4" service. Nothing
 * may reach Google before that, and React must not preload the script.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GoogleAnalytics, { GA_USERCENTRICS_SERVICE } from "../GoogleAnalytics";
import GoogleConsentDefault from "../GoogleConsentDefault";

const GA_ID = "G-TEST123";

const parse = (html: string) => {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = html;
  return doc;
};

describe("GoogleAnalytics", () => {
  it("renders gtag.js blocked, for Usercentrics to activate", () => {
    const doc = parse(renderToString(<GoogleAnalytics gaId={GA_ID} />));
    const script = doc.querySelector("script");

    expect(script?.getAttribute("type")).toBe("text/plain");
    expect(script?.getAttribute("data-usercentrics")).toBe(GA_USERCENTRICS_SERVICE);
    expect(script?.getAttribute("src")).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    expect(doc.querySelector('link[rel="preload"]')).toBeNull();
  });

  it("renders nothing without a measurement id", () => {
    expect(renderToString(<GoogleAnalytics gaId="" />)).toBe("");
  });
});

describe("GoogleConsentDefault", () => {
  const run = (html: string) => {
    window.dataLayer = [];
    delete window.gtag;
    new Function(parse(html).querySelector("script")!.textContent!)();
    return window.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>));
  };

  it("denies everything by default and waits for the CMP's update", () => {
    const [consent] = run(renderToString(<GoogleConsentDefault gaId={GA_ID} />));
    expect(consent).toEqual([
      "consent",
      "default",
      expect.objectContaining({ analytics_storage: "denied", wait_for_update: 500 }),
    ]);
  });

  it("queues the GA config behind the consent default", () => {
    const commands = run(renderToString(<GoogleConsentDefault gaId={GA_ID} />));
    expect(commands.map((c) => c[0])).toEqual(["consent", "js", "config"]);
    expect(commands[2]).toEqual(["config", GA_ID]);
  });

  it("queues no config without a measurement id", () => {
    expect(run(renderToString(<GoogleConsentDefault />)).map((c) => c[0])).toEqual(["consent"]);
  });
});

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
