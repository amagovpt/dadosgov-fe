import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { getBlockDefinitions, type BlockDefinition, type BlockType } from "../editorial-blocks";

export function BlockPicker({ onSelect }: { onSelect: (type: BlockType) => void }) {
  const { t } = useTranslation("admin-editorial");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const blockDefinitions = getBlockDefinitions(t);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = blockDefinitions.reduce(
    (acc, block) => {
      if (!acc[block.category]) acc[block.category] = [];
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<string, BlockDefinition[]>
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        appearance="outline"
        variant="primary"
        hasIcon
        leadingIcon="agora-line-plus-circle"
        leadingIconHover="agora-solid-plus-circle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {t("blockPicker.addBlock")}
      </Button>

      {isOpen && (
        <div className="shadow-lg absolute left-1/2 z-20 mt-4 w-[320px] -translate-x-1/2 rounded-8 border border-neutral-200 bg-white">
          <ul role="menu">
            {Object.entries(categories).map(([category, blocks]) => (
              <li key={category}>
                <p className="text-xs px-16 pb-4 pt-12 font-bold uppercase tracking-wide text-neutral-900">
                  {category}
                </p>
                <ul>
                  {blocks.map((block) => (
                    <li key={block.type}>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full px-16 py-8 text-left transition-colors hover:bg-neutral-50"
                        onClick={() => {
                          onSelect(block.type);
                          setIsOpen(false);
                        }}
                      >
                        <span className="flex items-center gap-8">
                          {block.iconImg ? (
                            <img src={block.iconImg} alt="" className="h-[18px] w-[18px]" />
                          ) : (
                            <Icon
                              name={block.icon}
                              className="h-[18px] w-[18px] text-neutral-700"
                            />
                          )}
                          <span className="text-sm font-semibold text-neutral-900">
                            {block.label}
                          </span>
                        </span>
                        <p className="text-xs ml-[26px] mt-[2px] text-neutral-900">
                          {block.description}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
