"use client";

import { Trans, useTranslation } from "react-i18next";
import { Typograph } from "../Shared/Generics/Typograph";
import MigrationActions from "./MigrationActions";

export type MigrationInviteSectionI = {
  onDismiss: (goTo?: string) => void;
};

export function MigrationInviteSection({ onDismiss }: MigrationInviteSectionI) {
  const { t } = useTranslation("login");

  return (
    <div className="flex flex-col gap-64">
      <div className="flex flex-col gap-16">
        <Typograph tag="h1" className="text-2xl-bold text-primary-900">
          {t("MigrationInviteSection.title")}
        </Typograph>
        <Typograph
          tag="p"
          className="max-w-[592px] text-m-regular whitespace-pre-line text-primary-900"
        >
          <Trans
            t={t}
            i18nKey="MigrationInviteSection.shortDescription"
            components={{ b: <b /> }}
          />
          <br />
          <br />
          <Trans t={t} i18nKey="MigrationInviteSection.longDescription" components={{ b: <b /> }} />
        </Typograph>
      </div>

      <MigrationActions onDismiss={onDismiss} />
    </div>
  );
}
