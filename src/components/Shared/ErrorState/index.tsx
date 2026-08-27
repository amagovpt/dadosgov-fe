"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { InfoBlock } from "../InfoBlock";
import Pill from "@/components/Primitives/Pill";
import Button from "@/components/Primitives/Button";
import ButtonNavigate from "@/components/Primitives/ButtonNavigate";
import { NETWORK_FAILURE, isRefusal, type ApiFailure } from "@/service/utils/apiErrorPolicy";
import { splitLocale } from "@/utils/stripLocale";
import { Suspense } from "react";
import Icon from "@/components/Primitives/Icon";
import { ErrorHelpCard } from "./ErrorHelpCard";

export interface IErrorStateProps {
  /**
   * The boundary's retry. Omitted by the callers that render this as a gate
   * rather than catch an error — there is no failed render for them to retry,
   * and the two statuses they raise (401, 403) offer a link instead of a
   * reload anyway.
   */
  reset?: () => void;
  /**
   * What failed, when the caller could tell: the status the server-side API
   * policy raised the error with, or the one a page gate is refusing access
   * with. Omitted for everything else — a render that threw for its own
   * reasons.
   */
  status?: ApiFailure | null;
  className?: string;
}

/**
 * Which copy and which action this failure gets.
 *
 * Three, not one per status: the design groups the statuses by what the visitor
 * can do about them. `errorAccess` covers the refusals (401, 403), `error500`
 * every failure the portal owns (500, and the 400/406 the API policy raises a
 * page error for). `errorNetwork` is the one outside the mockups, kept apart
 * because "check your connection" is advice the other two cannot give.
 */
type Variant = "errorAccess" | "errorNetwork" | "error500";

function variantFor(status: ApiFailure | null | undefined): Variant {
  if (isRefusal(status)) return "errorAccess";
  if (status === NETWORK_FAILURE) return "errorNetwork";
  return "error500";
}

/** Inverted for the dark block behind it, whichever action a variant renders. */
const ACTION_CLASS =
  "!bg-neutral-50 !text-neutral-900 hover:!bg-neutral-100 [&_.icon]:!fill-neutral-900 w-full md:w-[210px]";

export function ErrorState({ reset, status, className }: IErrorStateProps) {
  const { t } = useTranslation("common");
  const pathname = usePathname();

  const variant = variantFor(status);
  const { locale } = splitLocale(pathname);


  const code =
    typeof status === "number" ? t("errorCode", { status }) : t(`${variant}.error`);

  return (
    <main
      className={twMerge(
        "flex w-full flex-col items-center justify-center gap-40 bg-primary-900",
        className
      )}
      data-testid="error-state"
      data-error-status={status ?? undefined}
    >
      <InfoBlock.Root className="md:h-[80vh] py-64 ">
        <div className="w-full flex md:flex-row flex-col justify-center md:justify-stretch  gap-32">
          <InfoBlock.Content className="w-full flex md:flex-row flex-col md:items-start items-center justify-center md:justify-stretch  gap-32">
            <Suspense fallback={null}>
              <Icon
                name={isRefusal(status) ? "agora-line-lock" : "agora-line-x-circle"}
                aria-hidden
                focusable={false}
                className="!h-[300px] !min-h-[280px] !w-[300px] !min-w-[280px] shrink-0 !fill-white"
              />
            </Suspense>
            <div className="flex flex-col gap-32 h-full justify-center">
              <div className="flex flex-col w-full">
                <Pill
                  variant="primary"
                  size="large"
                  appearance="solid"
                  className="!text-neutral-900 !bg-secondary-200"
                >
                  {code}
                </Pill>
                <InfoBlock.Title
                  className="!text-3xl-bold !text-white"
                  title={t(`${variant}.title`)}
                  titleLevel="h1"
                />
              </div>
              <div className="flex flex-col gap-16 w-full">
                <span className="!text-m-bold !text-white">{t(`${variant}.subtitle`)}</span>
                <span className="!text-m-regular !text-white max-w-xl">
                  {t(`${variant}.description`)}
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-16 w-full md:items-start items-center">
                {variant === "errorAccess" ? (
                  // A reload would be refused again, whichever refusal this is,
                  // so home is the only way out the page itself can offer.
                  <ButtonNavigate
                    hasIcon
                    leadingIcon="agora-line-arrow-left-circle"
                    leadingIconHover="agora-solid-arrow-left-circle"
                    variant="primary"
                    appearance="solid"
                    className={ACTION_CLASS}
                    href={`/${locale}`}
                  >
                    {t("errorAccess.backToHome")}
                  </ButtonNavigate>
                ) : (
                  reset && (
                    <Button
                      hasIcon
                      leadingIcon="agora-line-refresh-ccw"
                      leadingIconHover="agora-line-refresh-ccw"
                      variant="primary"
                      appearance="solid"
                      className={ACTION_CLASS}
                      onClick={reset}
                    >
                      {t(`${variant}.refresh`)}
                    </Button>
                  )
                )}
              </div>
            </div>
          </InfoBlock.Content>
        </div>
      </InfoBlock.Root>
      {variant === "errorAccess" && <ErrorHelpCard />}
    </main>
  );
}
