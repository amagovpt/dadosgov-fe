"use client";

import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import DiscussionsListClient from "./DiscussionsListClient";

export default function DiscussionsClient() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation("admin-common");

  if (isLoading) return <p>{t("loading")}</p>;
  if (!user) return null;

  return <DiscussionsListClient key={user.id} scope="personal" userId={user.id} />;
}
