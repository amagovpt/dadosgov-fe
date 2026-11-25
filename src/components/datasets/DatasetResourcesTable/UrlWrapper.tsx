import Icon from "@/components/Primitives/Icon";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

export type UrlWrapperI = {
  url: string;
  label?: string;
  className?: string;
};

export default function UrlWrapper({ url, label, className }: UrlWrapperI) {
  const { t: tds } = useTranslation("datasets");
  const fieldLabel = label ?? tds("labels.url");

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className={twMerge("flex w-full flex-col gap-16", className)}>
      <Typograph tag="p" className="flex gap-8">
        <span className="text-m-medium text-neutral-900">{fieldLabel}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="min-w-24"
        >
          <span className="sr-only">{tds("resources.copy", { label: fieldLabel })}</span>
          <Icon name="agora-line-copy" aria-hidden="true" />
        </button>
      </Typograph>
      <p className="min-h-[60px] rounded-4 border-2 border-neutral-700 bg-white px-16 py-[14px] text-m-regular break-all text-neutral-900">
        {url}
      </p>
    </div>
  );
}
