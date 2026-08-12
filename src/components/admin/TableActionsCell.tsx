"use client";

import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import AppIcon, { AppIconI } from "../Primitives/AppIcon";

type Action = {
  icon?: AppIconI["name"];
  href?: string;
  className?: string;
};

type ActionDelete = {
  ariaLabel?: string;
  disabled?: boolean;
  icon?: AppIconI["name"];
  handler: () => void;
  className?: string;
};

export interface TableActionsCellI {
  className?: string;
  viewAction?: Action;
  editAction?: Action;
  deleteAction?: ActionDelete;
}

export default function TableActionsCell({
  className,
  viewAction,
  editAction,
  deleteAction,
}: TableActionsCellI) {
  const { t } = useTranslation("admin-common");

  return (
    <div className={twMerge("flex gap-8", className)}>
      {viewAction && (
        <a href={viewAction?.href}>
          <AppIcon
            name={viewAction?.icon ?? "agora-line-eye"}
            className={twMerge("h-[20px] w-[20px]", viewAction?.className)}
          />
        </a>
      )}
      {editAction && (
        <a href={editAction?.href}>
          <AppIcon
            name={editAction?.icon ?? "agora-line-edit"}
            className={twMerge("h-[20px] w-[20px]", editAction?.className)}
          />
        </a>
      )}
      {deleteAction && (
        <button
          aria-label={deleteAction?.ariaLabel ?? t("actions.delete")}
          disabled={deleteAction?.disabled}
          onClick={() => deleteAction.handler()}
          className={"text-danger-600 disabled:opacity-50"}
        >
          <AppIcon
            name={deleteAction?.icon ?? "agora-line-trash"}
            className={twMerge("h-[20px] w-[20px]", deleteAction.className)}
          />
        </button>
      )}
    </div>
  );
}
