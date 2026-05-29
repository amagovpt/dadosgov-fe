"use client";

import { useRouter } from "next/navigation";
import { Button, Icon } from "@ama-pt/agora-design-system";

interface ListingErrorBannerProps {
  entity?: string;
}

export default function ListingErrorBanner({ entity = "os resultados" }: ListingErrorBannerProps) {
  const router = useRouter();

  return (
    <div className="col-span-full">
      <div className="mx-auto flex max-w-[592px] flex-col items-center gap-16 rounded-lg border border-red-200 bg-red-50 p-32 text-center">
        <Icon name="agora-line-alert-triangle" className="h-12 w-12 text-red-600" />
        <h3 className="text-xl-bold text-neutral-900">Não foi possível carregar {entity}</h3>
        <p className="text-m-regular text-neutral-700">
          Ocorreu um erro ao contactar o servidor. Tente novamente dentro de momentos.
        </p>
        <Button variant="primary" appearance="outline" onClick={() => router.refresh()}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
