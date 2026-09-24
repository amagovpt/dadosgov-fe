"use client";
import TextLink from "@/components/Primitives/TextLink";
import { useTranslation } from "react-i18next";
import { twJoin, twMerge } from "tailwind-merge";

export interface IErrorHelpCardProps {
  className?: string;
  global?: boolean;
}

export function ErrorHelpCard({ className, global = false }: IErrorHelpCardProps) {
  const { t } = useTranslation("common");
  const email = t("errorHelp.email");

  return (
    <div className={
      twJoin("flex w-full justify-end",
        !global && "relative h-112 bg-white")}
    >
      <div
        className={
          twMerge(
            "flex w-full flex-col gap-8 bg-primary-100 px-32 py-24 md:w-[512px]",
            !global && "absolute -top-80 shadow-bottom-medium",
            className
          )}
      >
        <span className="!text-l-bold !text-neutral-900">{t("errorHelp.title")}</span>
        <TextLink href={`mailto:${email}`} className="break-all">
          {email}
        </TextLink>
      </div>
    </div>
  );
}
