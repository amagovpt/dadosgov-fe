"use client";

import type { MouseEvent } from "react";
import { Button, CardLinks, StatusCard } from "@ama-pt/agora-design-system";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { Reuse } from "@/service/types/reuse";

interface ReusesFormPublishStepProps {
  createdReuse: Reuse | null;
  reuseName: string;
  reuseDescription: string;
  apiError: string | null;
  isSubmitting: boolean;
  onPublish: () => void;
}

export default function ReusesFormPublishStep({
  createdReuse,
  reuseName,
  reuseDescription,
  apiError,
  isSubmitting,
  onPublish,
}: ReusesFormPublishStepProps) {
  return (
    <>
      <div className="mb-24">
        <StatusCard
          variant="success"
          showIcon
          description={
            <>
              <strong>A sua reutilização foi criada!</strong>
              <br />
              Foi guardada automaticamente como rascunho. Pode publicá-la agora ou mais tarde, a
              partir da lista de reutilizações.
            </>
          }
        />
      </div>

      <div className="agora-card-links-admin-px0">
        <CardLinks
          onClick={() => {}}
          className="cursor-pointer text-neutral-900"
          variant="transparent"
          image={{
            src: createdReuse?.image_thumbnail || createdReuse?.image || "/laptop.png",
            alt: reuseName || "Sem título",
          }}
          category={
            createdReuse?.organization?.name ||
            (createdReuse?.owner
              ? `${createdReuse.owner.first_name} ${createdReuse.owner.last_name}`.trim()
              : "Reutilização")
          }
          title={<div className="text-xl-bold underline">{reuseName || "Sem título"}</div>}
          description={
            <p className="mt-8 max-w-[592px] text-sm leading-relaxed text-neutral-900 line-clamp-3">
              {reuseDescription || ""}
            </p>
          }
          date={
            <span className="font-[300]">
              {`Atualizado ${format(new Date(), "dd MM yyyy", { locale: pt })}`}
            </span>
          }
          links={[
            {
              href: "#",
              hasIcon: true,
              leadingIcon: "agora-line-eye",
              leadingIconHover: "agora-solid-eye",
              trailingIcon: "",
              trailingIconHover: "",
              trailingIconActive: "",
              children: "0",
              title: "Visualizações",
              onClick: (event: MouseEvent) => event.preventDefault(),
              className: "text-[#034AD8]",
            },
            {
              href: "#",
              hasIcon: true,
              leadingIcon: "agora-line-layers-menu",
              leadingIconHover: "agora-solid-layers-menu",
              trailingIcon: "",
              trailingIconHover: "",
              trailingIconActive: "",
              children: `${createdReuse?.datasets?.length || 0} datasets`,
              title: "Datasets",
              onClick: (event: MouseEvent) => event.preventDefault(),
              className: "text-[#034AD8]",
            },
            {
              href: "#",
              hasIcon: false,
              children: (
                <span className="flex items-center gap-8">
                  <img src="/Icons/bar_chart_primary.svg" alt="" aria-hidden="true" />
                  <span>0</span>
                </span>
              ),
              title: "Métricas",
              onClick: (event: MouseEvent) => event.preventDefault(),
            },
            {
              href: "#",
              hasIcon: true,
              leadingIcon: "agora-line-star",
              leadingIconHover: "agora-solid-star",
              trailingIcon: "",
              trailingIconHover: "",
              trailingIconActive: "",
              children: 0,
              title: "Favoritos",
              onClick: (event: MouseEvent) => event.preventDefault(),
              className: "text-[#034AD8]",
            },
          ]}
          mainLink={
            createdReuse ? (
              <Link href={`/reuses/${createdReuse.slug}`}>
                <span className="underline">{reuseName}</span>
              </Link>
            ) : (
              <span className="underline">{reuseName || "Sem título"}</span>
            )
          }
          blockedLink
        />
      </div>

      <PublicationFeedbackButton />

      {apiError && (
        <div className="mb-16 mt-32">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}

      <div className="admin-page__actions flex justify-end gap-[18px]">
        <Button variant="primary" disabled={isSubmitting} onClick={onPublish}>
          {isSubmitting ? "A publicar..." : "Publicar a reutilização"}
        </Button>
      </div>
    </>
  );
}
