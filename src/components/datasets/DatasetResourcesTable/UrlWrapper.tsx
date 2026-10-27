import Icon from "@/components/Primitives/Icon";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { InputText } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

export type UrlWrapperI = {
  url: string;
  className?: string;
};

export default function UrlWrapper({ url, className }: UrlWrapperI) {
  const { t: tds } = useTranslation("datasets");

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className={twMerge("flex w-full flex-col gap-16", className)}>
      <Typograph tag="p" className="flex flex-row gap-8">
        <span className="text-m-medium text-neutral-900">{tds("labels.url")}</span>
        <Icon name="agora-line-copy" className="cursor-pointer" onClick={() => handleCopy()} />
      </Typograph>
      <InputText
        label={tds("labels.url")}
        hideLabel
        value={url}
        readOnly
        className="bg-white! text-neutral-900!"
      />
    </div>
  );
}
