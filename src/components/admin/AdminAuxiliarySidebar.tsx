"use client";

import React from "react";
import { Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import AuxiliarList, { type AuxiliarItem } from "@/components/admin/AuxiliarList";

interface AdminAuxiliarySidebarProps {
  items: AuxiliarItem[];
}

export default function AdminAuxiliarySidebar({ items }: AdminAuxiliarySidebarProps) {
  const { t } = useTranslation("admin-common");

  return (
    <aside className="w-[360px] max-w-full shrink-0">
      <div className="bg-neutral-100 p-32">
        <div className="admin-page__auxiliar-header">
          <Icon name="agora-line-question-mark" className="h-24 w-24" />
          <h2 className="admin-page__auxiliar-title">{t("auxiliary.title")}</h2>
        </div>
        <AuxiliarList items={items} />
      </div>
    </aside>
  );
}
