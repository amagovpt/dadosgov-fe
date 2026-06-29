"use client";

import React from "react";
import { Icon } from "@ama-pt/agora-design-system";
import AuxiliarList, { type AuxiliarItem } from "@/components/admin/AuxiliarList";

interface AdminAuxiliarySidebarProps {
  items: AuxiliarItem[];
}

export default function AdminAuxiliarySidebar({ items }: AdminAuxiliarySidebarProps) {
  return (
    <aside className="admin-page__auxiliar">
      <div className="admin-page__auxiliar-inner">
        <div className="admin-page__auxiliar-header">
          <Icon name="agora-line-question-mark" className="h-24 w-24" />
          <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
        </div>
        <AuxiliarList items={items} />
      </div>
    </aside>
  );
}
