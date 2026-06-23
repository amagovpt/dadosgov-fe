import { Metadata } from "next";
import HeroGeneral from "@/components/HeroGeneral";

export const metadata: Metadata = {
  title: "Publicações - dados.gov.pt",
  description: "Publicações do dados.gov.pt.",
};

export default function PublicationsPage() {
  return (
    <main className="flex w-full flex-col items-center justify-center bg-primary-50">
      <HeroGeneral
        title="Publicações"
        backgroundImageUrl="/Banner/hero-bg.png"
        breadcrumbItems={[
          { label: "Início", url: "/" },
          { label: "Publicações", url: "/publications" },
        ]}
      />

      {/* Conteúdo a definir */}
      <div className="container flex flex-col items-center justify-center gap-32 py-32" />
    </main>
  );
}
