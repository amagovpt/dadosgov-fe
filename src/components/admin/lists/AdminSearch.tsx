"use client";

import type { ComponentProps } from "react";
import { InputSearch, InputSearchBar } from "@ama-pt/agora-design-system";

const staticIconClasses = [
  "[&_:is(.search-icon,.magnifier-icon)_svg]:hidden!",
  "[&_:is(.search-icon,.magnifier-icon)_svg:first-child]:inline-block!",
  "[&_:is(.search-icon,.magnifier-icon)_svg]:fill-neutral-900!",
].join(" ");

export function AdminSearch(props: ComponentProps<typeof InputSearch>) {
  return (
    <div className={staticIconClasses}>
      <InputSearch {...props} />
    </div>
  );
}

export function AdminSearchBar(props: ComponentProps<typeof InputSearchBar>) {
  return (
    <div className={staticIconClasses}>
      <InputSearchBar {...props} />
    </div>
  );
}
