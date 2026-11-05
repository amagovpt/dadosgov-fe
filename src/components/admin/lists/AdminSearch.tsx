"use client";

import type { ComponentProps } from "react";
import { InputSearch, InputSearchBar } from "@ama-pt/agora-design-system";

export function AdminSearch(props: ComponentProps<typeof InputSearch>) {
  return (
    <div>
      <InputSearch {...props} />
    </div>
  );
}

export function AdminSearchBar(props: ComponentProps<typeof InputSearchBar>) {
  return (
    <div>
      <InputSearchBar {...props} />
    </div>
  );
}
