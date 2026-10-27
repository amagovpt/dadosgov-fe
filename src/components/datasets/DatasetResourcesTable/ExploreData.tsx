"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Primitives/Button";
import { useTranslation } from "react-i18next";
import { getExplorerUrl } from "@/app/[locale]/(pages)/datasets/[slug]/actions";
import Link from "next/link";

export type ExploreDataI = {
  id: string;
};

export default function ExploreData({ id }: ExploreDataI) {
  const { t: tds } = useTranslation("datasets");
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

  if (!id || !explorerUrl) return null;

  return (
    <Link href={explorerUrl} target="_blank">
      <Button
        appearance="solid"
        hasIcon
        trailingIcon="agora-line-external-link"
        trailingIconHover="agora-line-external-link"
        className="px-56"
      >
        {tds("resources.preview.explorer")}
      </Button>
    </Link>
  );
}
