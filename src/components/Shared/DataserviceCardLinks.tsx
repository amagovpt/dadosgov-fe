"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CardLinks } from "@ama-pt/agora-design-system";
import { Dataservice } from "@/service/types/dataservice";
import { formatDateToDMY } from "@/utils/formatDate";
import { sanitizeUserMarkdown } from "@/utils/sanitizeUserMarkdown";

interface DataserviceCardLinksProps {
  dataservice: Dataservice;
}

export function DataserviceCardLinks({ dataservice }: DataserviceCardLinksProps) {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();
  const href = `/dataservices/${dataservice.slug}`;

  const links = [
    {
      href: "#",
      hasIcon: true,
      leadingIcon: "agora-line-eye",
      leadingIconHover: "agora-solid-eye",
      trailingIcon: "",
      trailingIconHover: "",
      trailingIconActive: "",
      children: dataservice.metrics?.views?.toLocaleString(i18n.language) || "0",
      title: t("card.views"),
      onClick: (e: React.MouseEvent) => e.preventDefault(),
      className: "text-[#034AD8]",
    },
    {
      href: "#",
      hasIcon: true,
      leadingIcon: "agora-line-star",
      leadingIconHover: "agora-solid-star",
      trailingIcon: "",
      trailingIconHover: "",
      trailingIconActive: "",
      children: dataservice.metrics?.followers || 0,
      title: t("card.favorites"),
      onClick: (e: React.MouseEvent) => e.preventDefault(),
      className: "text-[#034AD8]",
    },
  ];

  return (
    <div className="h-full">
      <CardLinks
        onClick={() => router.push(href)}
        className="cursor-pointer text-neutral-900"
        variant="transparent"
        image={{
          src: dataservice.organization?.logo || "/images/placeholders/organization.png",
          alt: dataservice.organization?.name || t("card.organization"),
        }}
        category={
          dataservice.organization?.name ||
          (dataservice.owner
            ? `${dataservice.owner.first_name} ${dataservice.owner.last_name}`.trim()
            : t("card.api"))
        }
        title={
          <div className="text-xl-bold underline">{sanitizeUserMarkdown(dataservice.title)}</div>
        }
        description={
          dataservice.description ? (
            <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
              {sanitizeUserMarkdown(dataservice.description)}
            </p>
          ) : undefined
        }
        date={
          <span className="font-[300]">
            {t("card.updated", {
              date: formatDateToDMY(dataservice.last_modified || dataservice.created_at),
            })}
          </span>
        }
        links={links}
        mainLink={
          <Link href={href}>
            <span className="underline">{sanitizeUserMarkdown(dataservice.title)}</span>
          </Link>
        }
        blockedLink={true}
      />
    </div>
  );
}
