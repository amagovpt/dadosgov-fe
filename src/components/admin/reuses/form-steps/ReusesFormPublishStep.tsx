"use client";

import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, CardLinks, StatusCard } from "@ama-pt/agora-design-system";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { Reuse } from "@/service/types/reuse";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ReusesFormPublishStepProps {
  createdCard?: AdminCard;
  createdReuse: Reuse | null;
  reuseName: string;
  reuseDescription: string;
  apiError: string | null;
  isSubmitting: boolean;
  onPublish: () => void;
}

export default function ReusesFormPublishStep({
  createdCard,
  createdReuse,
  reuseName,
  reuseDescription,
  apiError,
  isSubmitting,
  onPublish,
}: ReusesFormPublishStepProps) {
  const { t } = useTranslation("admin-reuses");

  return (
    <>
      {createdCard ? (
        <div className="mb-24">
          <StatusCard
            variant="success"
            showIcon
            description={
              <>
                <strong>{createdCard.title}</strong>
                <br />
                {formatHtmlParagraphs(createdCard.description)}
              </>
            }
          />
        </div>
      ) : null}

      <div className="agora-card-links-admin-px0">
        <CardLinks
          onClick={() => {}}
          className="cursor-pointer text-neutral-900"
          variant="transparent"
          image={{
            src: createdReuse?.image_thumbnail || createdReuse?.image || "/laptop.png",
            alt: reuseName || t("form.untitled"),
          }}
          category={
            createdReuse?.organization?.name ||
            (createdReuse?.owner
              ? `${createdReuse.owner.first_name} ${createdReuse.owner.last_name}`.trim()
              : t("form.reuseCategory"))
          }
          title={<div className="text-xl-bold underline">{reuseName || t("form.untitled")}</div>}
          description={
            <p className="mt-8 max-w-[592px] text-sm leading-relaxed text-neutral-900 line-clamp-3">
              {reuseDescription || ""}
            </p>
          }
          date={
            <span className="font-[300]">
              {t("form.updatedToday", {
                date: format(new Date(), "dd MM yyyy", { locale: pt }),
              })}
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
              title: t("form.views"),
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
              title: t("columns.datasets"),
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
              title: t("form.metrics"),
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
              title: t("form.favorites"),
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
              <span className="underline">{reuseName || t("form.untitled")}</span>
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
          {isSubmitting ? t("form.publishing") : t("form.publishReuse")}
        </Button>
      </div>
    </>
  );
}
