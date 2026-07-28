import { Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import type { MarkdownData } from "../editorial-blocks";

export function MarkdownEditor({
  data,
  onChange,
}: {
  data: MarkdownData;
  onChange: (d: MarkdownData) => void;
}) {
  const { t } = useTranslation("admin-editorial");

  return (
    <div className="rounded-8 bg-white py-24">
      <div className="overflow-hidden rounded-8 border border-neutral-200">
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-12 py-8">
          {[
            { icon: "agora-line-refresh", title: t("markdown.undo") },
            { icon: "agora-line-refresh", title: t("markdown.redo") },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="rounded p-6 text-neutral-600 hover:bg-neutral-200"
            >
              <Icon name={btn.icon} className="h-16 w-16" />
            </button>
          ))}
          <span className="mx-4 h-[20px] w-[1px] bg-neutral-300" />
          {["B", "I"].map((label) => (
            <button
              key={label}
              type="button"
              title={label === "B" ? t("markdown.bold") : t("markdown.italic")}
              className="rounded text-sm w-[28px] p-6 text-center font-bold text-neutral-600 hover:bg-neutral-200"
            >
              {label}
            </button>
          ))}
          {["H2", "H3", "H4"].map((label) => (
            <button
              key={label}
              type="button"
              title={t("markdown.heading", { level: label })}
              className="rounded text-xs w-[28px] p-6 text-center font-medium text-neutral-500 hover:bg-neutral-200"
            >
              {label}
            </button>
          ))}
          <span className="mx-4 h-[20px] w-[1px] bg-neutral-300" />
          {[
            { icon: "agora-line-layers-menu", title: t("markdown.table") },
            { icon: "agora-line-external-link", title: t("markdown.link") },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="rounded p-6 text-neutral-600 hover:bg-neutral-200"
            >
              <Icon name={btn.icon} className="h-16 w-16" />
            </button>
          ))}
          <span className="mx-4 h-[20px] w-[1px] bg-neutral-300" />
          {[
            { icon: "agora-line-layers-menu", title: t("markdown.list") },
            { icon: "agora-line-layers-menu", title: t("markdown.orderedList") },
            { icon: "agora-line-code", title: t("markdown.code") },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              title={btn.title}
              className="rounded p-6 text-neutral-600 hover:bg-neutral-200"
            >
              <Icon name={btn.icon} className="h-16 w-16" />
            </button>
          ))}
        </div>

        <textarea
          value={data.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder={t("markdown.contentPlaceholder")}
          rows={8}
          className="text-sm w-full resize-y border-none px-16 py-12 text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
        />

        <div className="h-[3px] bg-primary-500" />
      </div>
    </div>
  );
}
