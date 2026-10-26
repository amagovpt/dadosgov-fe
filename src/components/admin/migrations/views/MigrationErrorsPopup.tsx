"use client";

import { useTranslation } from "react-i18next";

import type { MigrationAuditEntry } from "@/service/types/migrations-audit";

/**
 * What went wrong inside one migration, in a dialog rather than in the table.
 *
 * 🚩 It started as an expanded row, which is what the harvest job detail does.
 * The design-system table would not have it: a cell spanning the columns made
 * the whole table collapse to a single column, twice, in two different shapes.
 * That table is a shared component used by a dozen admin lists, and bending it
 * for one page was buying risk for everybody to save a click here.
 *
 * A dialog also suits the content better. A traceback is tall and wide, and a
 * row that holds one pushes the rest of the table off the screen -- the thing
 * somebody came to read competes with the thing they came to read it from.
 */
export default function MigrationErrorsPopup({ entry }: { entry: MigrationAuditEntry }) {
  const { t } = useTranslation("admin-migrations");

  return (
    <div className="flex flex-col gap-24">
      <p className="text-sm text-neutral-700">{entry.filename}</p>

      {entry.messages.length > 0 && (
        <div className="flex flex-col gap-8">
          <h3 className="text-base-bold text-neutral-900">{t("detail.errorsTitle")}</h3>
          <ul className="flex max-h-[280px] flex-col gap-4 overflow-auto rounded-4 border border-neutral-200 p-12">
            {entry.messages.map((message, index) => (
              <li key={index} className="font-mono text-xs break-all text-danger-700">
                {message}
              </li>
            ))}
          </ul>
          {/* The count is the real total and the list is capped. Saying so
              stops "30 errors" showing twenty from reading as a contradiction. */}
          {entry.errors > entry.messages.length && (
            <p className="text-xs text-neutral-700">
              {t("detail.truncated", {
                shown: entry.messages.length,
                total: entry.errors,
              })}
            </p>
          )}
        </div>
      )}

      {entry.traceback && (
        <div className="flex flex-col gap-8">
          <h3 className="text-base-bold text-neutral-900">{t("detail.tracebackTitle")}</h3>
          <pre className="max-h-[320px] overflow-auto rounded-4 border border-neutral-200 bg-neutral-50 p-12 font-mono text-xs leading-5">
            {entry.traceback}
          </pre>
        </div>
      )}
    </div>
  );
}
