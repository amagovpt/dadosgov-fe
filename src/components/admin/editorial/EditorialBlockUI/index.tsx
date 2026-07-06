"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse } from "@/service/types/reuse";
import { getDefaultData, type BlockType, type BlockData, type ContentBlock } from "../editorial-blocks";
import { BlockPicker } from "./BlockPicker";
import { BlockWrapper } from "./BlockWrapper";

export function EditorialBlockList({
  blocks,
  setBlocks,
  setHasChanges,
  datasetNameMap,
  reuseNameMap,
  onDatasetNameMapUpdate,
  onReuseNameMapUpdate,
}: {
  blocks: ContentBlock[];
  setBlocks: Dispatch<SetStateAction<ContentBlock[]>>;
  setHasChanges: (v: boolean) => void;
  datasetNameMap?: Record<string, Dataset>;
  reuseNameMap?: Record<string, Reuse>;
  onDatasetNameMapUpdate?: (dataset: Dataset) => void;
  onReuseNameMapUpdate?: (reuse: Reuse) => void;
}) {
  const addBlock = (type: BlockType, atIndex?: number) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      data: getDefaultData(type),
    };
    setBlocks((prev) => {
      if (atIndex !== undefined) {
        const next = [...prev];
        next.splice(atIndex, 0, newBlock);
        return next;
      }
      return [...prev, newBlock];
    });
    setHasChanges(true);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setHasChanges(true);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setHasChanges(true);
  };

  const updateBlock = (id: string, data: BlockData) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } : b)));
    setHasChanges(true);
  };

  if (blocks.length === 0) {
    return (
      <div className="flex justify-center py-32">
        <BlockPicker onSelect={(type) => addBlock(type)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {blocks.map((block, index) => (
        <div key={block.id}>
          <div className="flex justify-center py-8">
            <BlockPicker onSelect={(type) => addBlock(type, index)} />
          </div>

          <BlockWrapper
            block={block}
            index={index}
            total={blocks.length}
            onRemove={() => removeBlock(block.id)}
            onMoveUp={() => moveBlock(index, "up")}
            onMoveDown={() => moveBlock(index, "down")}
            onUpdate={(data) => updateBlock(block.id, data)}
            datasetNameMap={datasetNameMap}
            reuseNameMap={reuseNameMap}
            onDatasetNameMapUpdate={onDatasetNameMapUpdate}
            onReuseNameMapUpdate={onReuseNameMapUpdate}
          />

          {index === blocks.length - 1 && (
            <div className="flex justify-center py-8">
              <BlockPicker onSelect={(type) => addBlock(type, index + 1)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
