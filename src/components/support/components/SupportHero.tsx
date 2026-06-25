"use client";

import HeroGeneral from "@/components/HeroGeneral";
import AppIcon from "@/components/Primitives/AppIcon";

export function SupportHero() {
  return (
    <HeroGeneral
      title={
        <>
          <span className="mb-[10px] text-32 font-[500] text-white">
            Bem-vindo à página de suporte do{" "}
          </span>
          <span className="text-32 font-[500] text-white">portal dados.gov.pt</span>
        </>
      }
      breadcrumbItems={[
        { label: "Home", url: "/" },
        { label: "Ajuda e contactos", url: "#" },
      ]}
      backgroundImageUrl="/Banner/hero-bg.png"
      subtitle={
        <>
          <label className="mt-48 block text-[20px] font-bold text-white">
            Antes de nos contactar, recomendamos a consulta das Perguntas Frequentes desta página
            ou da área de Recursos do{" "}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-white text-[20px]"
            >
              dados.gov.pt
            </a>
            , onde pode encontrar respostas e informação de apoio sobre dados abertos, publicação e
            reutilização de dados.
          </label>

          <div className="shadow-lg dropdown absolute mb-64 w-full bg-white text-neutral-900"></div>

          <div className="mt-16 flex flex-col gap-16">
            <a
              href="/pages/faqs/about_dadosgov/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-8 text-white hover:underline"
            >
              O que é o dados.gov.pt
              <AppIcon name="agora-line-arrow-right-circle" className="fill-white" />
            </a>

            <a
              href="/pages/faqs/about_opendata/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-8 text-white hover:underline"
            >
              Saber mais sobre dados abertos
              <AppIcon name="agora-line-arrow-right-circle" className="fill-white" />
            </a>
          </div>
        </>
      }
    />
  );
}
