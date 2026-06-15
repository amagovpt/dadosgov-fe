"use client";

import React, { useState } from "react";
import { Checkbox, Icon, StatusCard } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import { TERMS_CHECKBOX_TEXT } from "./constants";

export function CloseButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="text-sm flex items-center gap-8 text-neutral-900 hover:text-neutral-700"
      >
        Fechar
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
  return (
    <div className="mt-8 flex flex-col gap-8">
      <h3 className="text-l-bold text-brand-blue-dark">Termos e condições</h3>
      <p className="text-sm">
        Deve ler atentamente os{" "}
        <TextLink
          href="/pages/faqs/terms"
          className="hover:text-primary-800 active:decoration-dashed"
        >
          Termos e condições para o tratamento dos seus dados
        </TextLink>
      </p>
      <Checkbox
        id={id}
        className="text-sm leading-relaxed text-neutral-700"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      >
        {TERMS_CHECKBOX_TEXT}
      </Checkbox>
    </div>
  );
}

export function SupportStatusCard() {
  return (
    <div className="mt-32 grid gap-32 xl:grid-cols-12">
      <div className="xl:col-span-3" />
      <div className="xl:col-span-9 xl:col-start-4">
        <StatusCard
          variant="informative"
          showIcon
          description={
            <div className="flex flex-col gap-8">
              <p className="text-sm font-bold">Tem dúvidas?</p>
              <p className="text-sm">
                Se precisar de ajuda, fale connosco através do nosso formulário.
              </p>
              <a
                href="/pages/support"
                className="text-sm flex items-center gap-8 text-informative-600"
              >
                Formulário de contacto
                <Icon
                  name="agora-line-arrow-right-circle"
                  className="h-16 w-16 text-informative-600"
                />
              </a>
            </div>
          }
        />
      </div>
    </div>
  );
}
