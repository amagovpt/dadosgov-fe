import { Icon, usePopupContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse } from "@/service/types/reuse";
import type { BlockData, ContentBlock } from "../editorial-blocks";
import { BlockEditor } from "./BlockEditor";
import { DeleteBlockPopupContent } from "./DeleteBlockPopupContent";

export function BlockWrapper({
  block,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdate,
  datasetNameMap,
  reuseNameMap,
  onDatasetNameMapUpdate,
  onReuseNameMapUpdate,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (data: BlockData) => void;
  datasetNameMap?: Record<string, Dataset>;
  reuseNameMap?: Record<string, Reuse>;
  onDatasetNameMapUpdate?: (dataset: Dataset) => void;
  onReuseNameMapUpdate?: (reuse: Reuse) => void;
}) {
  const { t } = useTranslation(["admin-common", "admin-editorial"]);
  const { show, hide } = usePopupContext();

  const handleRemove = () => {
    show(
      <DeleteBlockPopupContent
        onClose={hide}
        onConfirm={() => {
          hide();
          onRemove();
        }}
      />,
      {
        title: t("admin-editorial:blockActions.deleteBlockTitle"),
        closeAriaLabel: t("admin-common:fileUpload.popup.close"),
        dimensions: "m",
      }
    );
  };

  return (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-8 pt-24">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded p-4 text-neutral-500 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
          title={t("admin-editorial:blockActions.moveUp")}
        >
          <Icon name="agora-line-chevron-up" className="h-16 w-16" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="rounded p-4 text-neutral-500 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
          title={t("admin-editorial:blockActions.moveDown")}
        >
          <Icon name="agora-line-chevron-down" className="h-16 w-16" />
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded group p-4"
          title={t("admin-editorial:blockActions.remove")}
        >
          <Icon
            name="agora-line-trash"
            className="block h-16 w-16 !fill-[var(--color-danger-600)] group-hover:hidden"
          />
          <Icon
            name="agora-solid-trash"
            className="hidden h-16 w-16 !fill-[var(--color-danger-600)] group-hover:block"
          />
        </button>
      </div>

      <div className="flex-1">
        <BlockEditor
          block={block}
          onUpdate={onUpdate}
          datasetNameMap={datasetNameMap}
          reuseNameMap={reuseNameMap}
          onDatasetNameMapUpdate={onDatasetNameMapUpdate}
          onReuseNameMapUpdate={onReuseNameMapUpdate}
        />
      </div>
    </div>
  );
}
