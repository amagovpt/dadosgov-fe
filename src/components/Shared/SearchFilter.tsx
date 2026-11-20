"use client";

import { InputSearch } from "@ama-pt/agora-design-system";

interface SearchFilterProps {
  id: string;
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  examplesText?: string;
  contained?: boolean;
}

export default function SearchFilter({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  examplesText,
  contained = true,
}: SearchFilterProps) {
  return (
    <form
      className={contained ? "container" : undefined}
      role="search"
      aria-label={label}
      onKeyDown={(event) => {
        // Agora already calls requestSubmit on Enter; prevent a second implicit submit.
        if (event.key === "Enter") event.preventDefault();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <div className="max-w-[592px]">
        <InputSearch
          label={label}
          placeholder={placeholder}
          id={id}
          value={value}
          required={false}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        {examplesText && <div className="mt-8 text-s-regular text-neutral-900">{examplesText}</div>}
      </div>
    </form>
  );
}
