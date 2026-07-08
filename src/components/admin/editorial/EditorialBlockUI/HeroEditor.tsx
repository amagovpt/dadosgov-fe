import { HERO_COLORS, type HeroData } from "../editorial-blocks";

export function HeroEditor({ data, onChange }: { data: HeroData; onChange: (d: HeroData) => void }) {
  const colorBg = HERO_COLORS.find((c) => c.value === data.color)?.bg ?? "bg-primary-900";

  return (
    <div className={`${colorBg} rounded-8 p-32 text-white`}>
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Título"
        className="text-2xl mb-8 w-full border-none bg-transparent font-bold placeholder-white/60 outline-none"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Adicione uma descrição"
        className="text-sm mb-[20px] w-full border-none bg-transparent placeholder-white/60 outline-none"
      />
      <div className="mb-8">
        <span className="text-sm inline-block rounded-6 border border-white/30 bg-white px-16 py-8 font-medium text-primary-900">
          <input
            type="text"
            value={data.buttonLabel}
            onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
            placeholder="Título do botão"
            className="border-none bg-transparent text-primary-900 placeholder-neutral-400 outline-none"
          />
        </span>
      </div>
      <input
        type="text"
        value={data.buttonUrl}
        onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
        placeholder="URL do botão"
        className="text-sm border-orange-400 mb-16 w-[300px] max-w-full rounded-6 border bg-white px-12 py-6 text-neutral-800 placeholder-neutral-400 outline-none"
      />
      <div className="flex items-center gap-8">
        <span className="text-sm">Cor :</span>
        {HERO_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange({ ...data, color: c.value })}
            className={`h-[28px] w-[28px] rounded-full border-2 ${
              data.color === c.value ? "border-white ring-2 ring-white/50" : "border-white/40"
            } ${c.bg}`}
          />
        ))}
      </div>
    </div>
  );
}
