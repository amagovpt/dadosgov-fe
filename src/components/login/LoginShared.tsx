"use client";

import React, { useState } from "react";
import { Checkbox, Icon, StatusCard } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Typograph } from "../Shared/Generics/Typograph";

export function CloseButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation("login");
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="text-sm flex items-center gap-8 text-neutral-900 hover:text-neutral-700"
      >
        {t("common.close")}
        <Icon
          name={hovered ? "agora-solid-x" : "agora-line-x"}
          className="h-20 w-20"
        />
      </button>
    </div>
  );
}

export function HoverArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm flex items-center gap-8 text-primary-600"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <Icon
        name={
          hovered ? "agora-solid-arrow-right-circle" : "agora-line-arrow-right-circle"
        }
        className="h-20 w-20"
      />
    </a>
  );
}

export function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-16">
      <Icon name="agora-line-check" className="mt-2 h-20 w-20 shrink-0 text-primary-600" />
      <span>{children}</span>
    </li>
  );
}

export function TermsSection({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation("login");

  return (
    <div className="mt-8 flex flex-col gap-8">
      <Typograph tag="h3" className="text-l-bold text-brand-blue-dark">
        {t("terms.title")}
      </Typograph>
      <Typograph tag="p" className="text-sm">
        {t("terms.readCarefully")}{" "}
        <TextLink
          href="/termos-de-utilizacao"
          className="hover:text-primary-800 active:decoration-dashed"
        >
          {t("terms.link")}
        </TextLink>
      </Typograph>
      <Checkbox
        id={id}
        className="text-sm leading-relaxed text-neutral-700"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      >
        {t("terms.checkbox")}
      </Checkbox>
    </div>
  );
}

export function SupportStatusCard() {
  const { t } = useTranslation("login");

  return (
    <div className="mt-32 grid gap-32 xl:grid-cols-12">
      <div className="xl:col-span-3" />
      <div className="xl:col-span-9 xl:col-start-4">
        <StatusCard
          variant="informative"
          showIcon
          description={
            <div className="flex flex-col gap-8">
              <Typograph tag="p" className="text-sm font-bold">
                {t("help.title")}
              </Typograph>
              <Typograph tag="p" className="text-sm">
                {t("help.description")}
              </Typograph>
              <Link
                href="/ajuda-e-contactos"
                className="text-sm flex items-center gap-8 text-informative-600"
              >
                {t("help.link")}
                <Icon
                  name="agora-line-arrow-right-circle"
                  className="h-16 w-16 text-informative-600"
                />
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
