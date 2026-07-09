import { useState } from "react";
import { Icon } from "@ama-pt/agora-design-system";
import type { AccordionData } from "../editorial-blocks";

export function AccordionEditor({
  data,
  onChange,
}: {
  data: AccordionData;
  onChange: (d: AccordionData) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const addItem = () => {
    onChange({ ...data, items: [...data.items, { title: "", content: "" }] });
  };

  const updateItem = (index: number, field: "title" | "content", value: string) => {
    const items = [...data.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...data, items });
  };

  const removeItem = (index: number) => {
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="rounded-8 bg-white py-24">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Os meus acordeões"
        className="text-xl mb-4 w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Adicione uma descrição"
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="flex flex-col">
        {data.items.map((item, index) => (
          <div key={index} className="border-b border-neutral-200">
            <div className="flex items-center justify-between py-12">
              <div className="flex flex-1 items-center gap-8">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Título do item"
                  className="text-sm flex-1 border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded hover:bg-red-100 text-red-600 p-4"
                >
                  <Icon name="agora-line-trash" className="h-[14px] w-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="rounded p-4 text-neutral-500 hover:bg-neutral-100"
                >
                  <Icon
                    name={openIndex === index ? "agora-line-chevron-up" : "agora-line-chevron-down"}
                    className="h-16 w-16"
                  />
                </button>
              </div>
            </div>
            {openIndex === index && (
              <div className="pb-12">
                <textarea
                  value={item.content}
                  onChange={(e) => updateItem(index, "content", e.target.value)}
                  placeholder="Conteúdo do item..."
                  rows={3}
                  className="text-sm w-full resize-y rounded-6 border border-neutral-200 px-12 py-8 text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="text-xs mt-12 inline-flex items-center gap-4 font-medium text-primary-600 hover:text-primary-800"
      >
        <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
        Adicionar item
      </button>
    </div>
  );
}
