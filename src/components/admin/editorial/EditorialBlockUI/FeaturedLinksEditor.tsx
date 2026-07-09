import { Icon } from "@ama-pt/agora-design-system";
import type { FeaturedLinksData } from "../editorial-blocks";

export function FeaturedLinksEditor({
  data,
  onChange,
}: {
  data: FeaturedLinksData;
  onChange: (d: FeaturedLinksData) => void;
}) {
  const addParagraph = () => {
    onChange({ ...data, paragraphs: [...data.paragraphs, ""] });
  };

  const addLink = () => {
    if (data.links.length >= 4) return;
    onChange({ ...data, links: [...data.links, { label: "", url: "" }] });
  };

  return (
    <div className="rounded-8 bg-white py-24">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Os meus links"
        className="text-xl mb-4 w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder="Adicionar legenda"
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="flex gap-32">
        <div className="flex flex-1 flex-col gap-12">
          {data.paragraphs.map((text, index) => (
            <div key={index} className="flex items-start gap-8">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    paragraphs: data.paragraphs.filter((_, i) => i !== index),
                  })
                }
                className="rounded hover:bg-red-100 hover:text-red-600 mt-[2px] p-4 text-neutral-400"
              >
                <Icon name="agora-line-trash" className="h-[14px] w-[14px]" />
              </button>
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  const paragraphs = [...data.paragraphs];
                  paragraphs[index] = e.target.value;
                  onChange({ ...data, paragraphs });
                }}
                placeholder="Texto do parágrafo"
                className="text-sm flex-1 border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addParagraph}
            className="text-xs inline-flex items-center gap-4 font-medium text-neutral-400 hover:text-neutral-600"
          >
            <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
            Adicione um parágrafo
          </button>

          <button
            type="button"
            onClick={addLink}
            className="text-xs inline-flex items-center gap-4 font-medium text-neutral-400 hover:text-neutral-600"
          >
            <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
            Adicionar um link
          </button>

          <div className="mt-8">
            <span className="text-sm inline-block rounded-6 bg-primary-900 px-16 py-8 font-medium text-white">
              <input
                type="text"
                value={data.buttonLabel}
                onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
                placeholder="Título do botão"
                className="border-none bg-transparent text-white placeholder-white/60 outline-none"
              />
            </span>
            <div className="mt-4">
              <input
                type="text"
                value={data.buttonUrl}
                onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
                placeholder="URL do botão"
                className="text-sm border-orange-400 w-[250px] max-w-full rounded-6 border px-12 py-6 placeholder-neutral-400 outline-none"
              />
            </div>
          </div>
        </div>

        {data.links.length > 0 && (
          <div className="flex flex-1 flex-col gap-16">
            {data.links.map((link, index) => (
              <div key={index} className="flex items-start gap-6">
                <span className="mt-4 text-primary-900">&#8226;</span>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => {
                        const links = [...data.links];
                        links[index] = { ...links[index], label: e.target.value };
                        onChange({ ...data, links });
                      }}
                      placeholder="Título do link"
                      className="text-lg border-none font-bold text-primary-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                    />
                    <Icon
                      name="agora-line-external-link"
                      className="h-16 w-16 text-primary-900"
                    />
                  </div>
                  <div className="mt-[2px] flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...data,
                          links: data.links.filter((_, i) => i !== index),
                        })
                      }
                      className="rounded hover:bg-red-100 hover:text-red-600 p-[2px] text-neutral-400"
                    >
                      <Icon name="agora-line-trash" className="h-[14px] w-[14px]" />
                    </button>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => {
                        const links = [...data.links];
                        links[index] = { ...links[index], url: e.target.value };
                        onChange({ ...data, links });
                      }}
                      placeholder="URL"
                      className="text-sm rounded-4 border border-neutral-300 px-8 py-4 text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
                    />
                  </div>
                </div>
              </div>
            ))}

            {data.links.length < 4 && (
              <button
                type="button"
                onClick={addLink}
                className="text-xs inline-flex items-center gap-4 font-medium text-neutral-400 hover:text-neutral-600"
              >
                <Icon name="agora-line-plus-circle" className="h-[14px] w-[14px]" />
                Adicionar um link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
