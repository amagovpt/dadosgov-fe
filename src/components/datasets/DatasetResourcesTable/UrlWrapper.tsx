import Icon from "@/components/Primitives/Icon";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { Tooltip } from "@ama-pt/agora-design-system";
import { useEffect, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

export type UrlWrapperI = {
  url: string;
  label?: string;
  className?: string;
};

function CopyTooltipButton({
  onActivate,
  ...props
}: ComponentProps<"button"> & { onActivate: () => Promise<void> }) {
  return (
    <button
      {...props}
      // The button label and live status already provide the tooltip's text.
      aria-describedby={undefined}
      onClick={async (event) => {
        // Reuse Ágora's hover opener for touch and clicks after Escape, too.
        await onActivate();
        props.onMouseEnter?.(event);
      }}
    />
  );
}

export default function UrlWrapper({ url, label, className }: UrlWrapperI) {
  const { t: tds } = useTranslation("datasets");
  const fieldLabel = label ?? tds("labels.url");
  const copyLabel = tds("resources.copy", { label: fieldLabel });
  const [feedback, setFeedback] = useState({ message: "", version: 0 });

  useEffect(() => {
    if (!feedback.message) return;
    const timeout = setTimeout(() => {
      setFeedback((current) => ({ ...current, message: "" }));
    }, 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleCopy = async () => {
    let message;
    try {
      await navigator.clipboard.writeText(url);
      message = tds("resources.copied");
    } catch {
      message = tds("resources.copyFailed");
    }
    setFeedback((current) => ({ message, version: current.version + 1 }));
  };

  return (
    <div className={twMerge("flex w-full flex-col gap-16", className)}>
      <Typograph tag="p" className="flex gap-8">
        <span className="text-m-medium text-neutral-900">{fieldLabel}</span>
        <Tooltip description={feedback.message || copyLabel} aria-hidden="true">
          <CopyTooltipButton type="button" onActivate={handleCopy} className="min-w-24">
            <span className="sr-only">{copyLabel}</span>
            <Icon name="agora-line-copy" aria-hidden="true" />
          </CopyTooltipButton>
        </Tooltip>
        <span role="status" aria-atomic="true" className="sr-only">
          {feedback.message && <span key={feedback.version}>{feedback.message}</span>}
        </span>
      </Typograph>
      <p className="min-h-[60px] rounded-4 border-2 border-neutral-700 bg-white px-16 py-[14px] text-m-regular break-all text-neutral-900">
        {url}
      </p>
    </div>
  );
}
