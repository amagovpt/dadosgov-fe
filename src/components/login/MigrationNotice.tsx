"use client";

import { Button, Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { PRIMARY_BUTTON_CLASS } from "./constants";
import { Typograph } from "../Shared/Generics/Typograph";

export function MigrationNotice({
  onSaml,
  onEidas,
}: {
  onSaml: () => void;
  onEidas: () => void;
}) {
  const { t } = useTranslation("login");

  return (
    <>
      <div>
        <Typograph tag="h2" className="mb-8 text-xl-bold text-brand-blue-dark">
          {t("migration.title")}
        </Typograph>
        <Typograph tag="p" className="text-neutral-900">
          {t("migration.description")}
        </Typograph>
      </div>
      <div className="bg-amber-50 border-amber-200 rounded-8 border p-24">
        <div className="flex items-start gap-12">
          <Icon
            name="agora-line-info-mark"
            className="text-amber-600 mt-2 h-24 w-24 shrink-0"
          />
          <div>
            <Typograph tag="p" className="text-sm-bold text-amber-800 mb-4">
              {t("migration.howToTitle")}
            </Typograph>
            <Typograph tag="p" className="text-sm text-amber-700">
              {t("migration.howToDescription")}
            </Typograph>
          </div>
        </div>
      </div>
      <div className="flex gap-16">
        <Button variant="primary" className={PRIMARY_BUTTON_CLASS} onClick={onSaml}>
          {t("migration.migrateCmd")}
        </Button>
        <Button variant="neutral" className={PRIMARY_BUTTON_CLASS} onClick={onEidas}>
          {t("migration.migrateEidas")}
        </Button>
      </div>
    </>
  );
}
