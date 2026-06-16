"use client";

import { useState } from "react";
import NextImage from "next/image";
import { Button } from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS, TEXT_LINK_BUTTON_CLASS } from "./constants";
import { TermsSection } from "./LoginShared";

export function EidasTab({
  samlEnabled,
  onEidasLogin,
  onOpenModal,
}: {
  samlEnabled: boolean;
  onEidasLogin: () => void;
  onOpenModal: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="rounded-8">
      <div className="flex flex-col gap-40">
        <div className="flex items-center justify-between gap-32">
          <div className="flex flex-col gap-8">
            <h2 className="text-base font-bold text-brand-blue-dark">Antes de começar...</h2>
            <p className="text-[#2B363C]">
              Precisa de ter um meio de autenticação digital disponibilizado pelo seu país de origem
              na União Europeia (UE). Este meio de autenticação está disponível para a qualquer
              cidadã/o da UE.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-32">
            <NextImage src="/eidas.svg" alt="eIDAS" width={64} height={64} />
            <NextImage src="/Logos/your_europe.svg" alt="Your Europe" width={120} height={48} />
          </div>
        </div>
        <div className="mt-32 flex items-center gap-8">
          <p className="text-sm text-neutral-900">
            <strong>Não tem Autenticação Europeia?</strong>
          </p>
          <button className={TEXT_LINK_BUTTON_CLASS} onClick={onOpenModal}>
            Descubra como criar conta
          </button>
        </div>
        <div className="my-32 h-[2px] w-full bg-neutral-400" />
        <p className="text-sm text-neutral-900">
          Precisa <strong>fornecer documentos</strong> que foram emitidos por uma entidade pública de{" "}
          <strong>outro Estado-Membro</strong> da UE? Agora já é possível recupera-los diretamente do
          portal emissor entrando com a sua autenticação Europeia.
        </p>
        <TermsSection
          id="terms-eidas"
          checked={termsAccepted}
          onChange={setTermsAccepted}
        />
        <div className="mt-16">
          <Button
            variant="primary"
            className={PRIMARY_BUTTON_CLASS}
            hasIcon={true}
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            onClick={onEidasLogin}
            disabled={!samlEnabled || !termsAccepted}
          >
            Autenticar com eIDAS
          </Button>
        </div>
      </div>
    </div>
  );
}
