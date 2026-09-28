import Button from "@/components/Primitives/Button";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export type ExploreDataI = {
  id: string;
};

export default function ExploreData({ id }: ExploreDataI) {
  const { t: tds } = useTranslation("datasets");
  const routerNav = useRouter();

  const handleClick = () => {
    alert(id);
  };

  if (id.length < 1) return null;

  return (
    <Button
      variant="informative"
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
