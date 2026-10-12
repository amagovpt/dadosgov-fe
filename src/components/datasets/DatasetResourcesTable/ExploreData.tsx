"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Primitives/Button";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getExplorerUrl } from "@/app/[locale]/(pages)/datasets/[slug]/actions";

export type ExploreDataI = {
  id: string;
};

export default function ExploreData({ id }: ExploreDataI) {
  const { t: tds } = useTranslation("datasets");
  const routerNav = useRouter();
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function checkStructure() {
      try {
        const url = await getExplorerUrl(id);
        if (!cancelled) setExplorerUrl(url);
      } catch (error) {
        console.error(tds("preview.explorerStructureError"), error);
      }
    }

    checkStructure();

    return () => {
      cancelled = true;
    };
  }, [id, tds]);

  const handleClick = () => {
    if (explorerUrl) routerNav.push(explorerUrl);
  };

  if (!id || !explorerUrl) return null;

  return (
    <Button
      appearance="solid"
      hasIcon
      trailingIcon="agora-line-external-link"
      trailingIconHover="agora-line-external-link"
      onClick={() => handleClick()}
      className="px-56"
    >
      {tds("resources.preview.explorer")}
    </Button>
  );
}
