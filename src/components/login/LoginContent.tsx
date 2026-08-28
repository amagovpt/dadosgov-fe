"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Tabs,
  Tab,
  TabHeader,
  TabBody,
} from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { buildSamlEndpoint, sanitizeNextUrl, submitSamlForm } from "./loginUtils";
import { SupportStatusCard } from "./LoginShared";
import { CmdModalContent } from "./CmdModalContent";
import { EidasModalContent } from "./EidasModalContent";
import { CmdTab } from "./CmdTab";
import { EidasTab } from "./EidasTab";
import { EmailTab } from "./EmailTab";
import { Typograph } from "../Shared/Generics/Typograph";

export function LoginContent() {
  const { t } = useTranslation("login");
  const searchParams = useSearchParams();
  const nextUrl = sanitizeNextUrl(searchParams.get("next"));

  const [cmdModalOpen, setCmdModalOpen] = useState(false);
  const [eidasModalOpen, setEidasModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samlEnabled = process.env.NEXT_PUBLIC_SAML_ENABLED === "true";

  const runSamlLogin = async (base: string) => {
    setIsLoading(true);
    setError(null);
    const samlError = await submitSamlForm(buildSamlEndpoint(base, nextUrl), t);
    if (samlError) {
      setError(samlError);
    }
    setIsLoading(false);
  };

  const handleSamlLogin = () => runSamlLogin("/saml/login");
  const handleEidasLogin = () => runSamlLogin("/saml/eidas/login");

  const openCmdModal = () => {
    setCmdModalOpen(true);
    window.scrollTo(0, 0);
  };

  const openEidasModal = () => {
    setEidasModalOpen(true);
    window.scrollTo(0, 0);
  };

  const showMainView = !cmdModalOpen && !eidasModalOpen;

  return (
    <main className="relative min-h-screen flex-grow bg-white">
      <div className="login-page container mx-auto max-w-7xl px-16 pb-64 pt-32">
        {showMainView && (
          <div>
            <BreadcrumbDynamic darkMode={false} />
          </div>
        )}

        {eidasModalOpen ? (
          <EidasModalContent onClose={() => setEidasModalOpen(false)} />
        ) : cmdModalOpen ? (
          <CmdModalContent onClose={() => setCmdModalOpen(false)} />
        ) : (
          <>
            <div className="flex flex-col max-w-1/2 ">
              <Typograph tag="h1" className="mb-16 mt-64 text-2xl-medium text-brand-blue-dark">
                {t("title")}
              </Typograph>
              <Typograph tag="p" className="text-lg mb-32 max-w-2xl text-neutral-700">
                {t("description")}
              </Typograph>
            </div>
            <Tabs vertically className="mt-24">
              <Tab>
                <TabHeader>{t("tabs.cmd")}</TabHeader>
                <TabBody>
                  <CmdTab
                    samlEnabled={samlEnabled}
                    onSamlLogin={handleSamlLogin}
                    onOpenModal={openCmdModal}
                  />
                </TabBody>
              </Tab>
              <Tab>
                <TabHeader>{t("tabs.eidas")}</TabHeader>
                <TabBody>
                  <EidasTab
                    samlEnabled={samlEnabled}
                    onEidasLogin={handleEidasLogin}
                    onOpenModal={openEidasModal}
                  />
                </TabBody>
              </Tab>
              <Tab>
                <TabHeader>{t("tabs.email")}</TabHeader>
                <TabBody>
                  <EmailTab
                    samlEnabled={samlEnabled}
                    isLoading={isLoading}
                    error={error}
                    onSaml={handleSamlLogin}
                    onEidas={handleEidasLogin}
                  />
                </TabBody>
              </Tab>
            </Tabs>

            <SupportStatusCard />
          </>
        )}
      </div>
    </main>
  );
}
