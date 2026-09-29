"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Primitives/Button";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getStructure } from "@/app/[locale]/(pages)/datasets/[slug]/actions";
import { EXPLORER_URL } from "../../../../next.config";

export type ExploreDataI = {
  id: string;
};

export default function ExploreData({ id }: ExploreDataI) {
  const { t: tds } = useTranslation("datasets");
  const routerNav = useRouter();
  const [hasStructure, setHasStructure] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function checkStructure() {
      try {
        const result = await getStructure(id);
        if (!cancelled) setHasStructure(result);
      } catch (error) {
        console.error("Error checking resource structure:", error);
      }
    }

    checkStructure();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleClick = () => {
    routerNav.push(`http://${EXPLORER_URL}/explorer/${id}/`);
  };

  if (!id || !hasStructure) return null;

  return (
    <Button
      appearance="solid"
      hasIcon
      trailingIcon="agora-line-external-link"
      trailingIconHover="agora-line-external-link"
      onClick={() => handleClick()}
    >
      {tds("preview.explorer")}
    </Button>
  );
}
