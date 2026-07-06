"use client";

import React from "react";
import { InputSearch } from "@ama-pt/agora-design-system";

interface SearchFilterProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  examplesText?: string;
}

export default function SearchFilter({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  examplesText = 'Exemplos: "educação", "saúde pública", "ambiente"',
}: SearchFilterProps) {
  return (
    <div className="container">
      <div className="max-w-[592px]">
        <InputSearch
          label={label}
          placeholder={placeholder}
          id={id}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") onSearch();
          }}
        />
        <div className="mt-8 text-s-regular text-neutral-900">{examplesText}</div>
      </div>
    </div>
  );
}
