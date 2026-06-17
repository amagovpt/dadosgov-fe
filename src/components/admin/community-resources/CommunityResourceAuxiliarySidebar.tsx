"use client";

import React from "react";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";

interface CommunityResourceAuxiliarySidebarProps {
  items: AuxiliarItem[];
}

export default function CommunityResourceAuxiliarySidebar({
  items,
}: CommunityResourceAuxiliarySidebarProps) {
  return <AdminAuxiliarySidebar items={items} />;
}
