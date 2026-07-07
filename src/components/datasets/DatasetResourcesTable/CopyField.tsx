"use client";

import React, { useState } from "react";

export const CopyField: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center gap-8">
        <h5 className="font-bold text-sm text-neutral-900">{label}</h5>
        <button
          type="button"
          onClick={handleCopy}
          className="text-primary-600 hover:text-primary-800 cursor-pointer shrink-0"
          aria-label={`Copiar ${label}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "16px", height: "16px", minWidth: "16px" }}
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        {copied && <span className="text-xs text-green-600">Copiado!</span>}
      </div>
      <code
        className={`block bg-neutral-100 px-12 py-8 rounded text-sm text-neutral-900 break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </code>
    </div>
  );
};
