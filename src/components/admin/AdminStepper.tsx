"use client";

import { useTranslation } from "react-i18next";
import { ProgressBar } from "@ama-pt/agora-design-system";

interface AdminStepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  labelWord?: string;
  labelFormat?: "slash" | "de";
  appearance?: "default" | "form";
  headingLevel?: "h1" | "h2";
}

const TOTAL_SEGMENTS = 12;

export function AdminStepper({
  currentStep,
  totalSteps,
  stepTitle,
  labelWord,
  labelFormat = "slash",
  appearance = "default",
  headingLevel: Heading = "h2",
}: AdminStepperProps) {
  const { t } = useTranslation("admin-common");
  const resolvedLabelWord = labelWord ?? t("stepper.step");
  const label =
    labelFormat === "de"
      ? `${resolvedLabelWord} ${currentStep} ${t("stepper.of")} ${totalSteps}`
      : `${resolvedLabelWord} ${currentStep}/${totalSteps}`;
  const filledSegments = Math.round((currentStep / totalSteps) * TOTAL_SEGMENTS);

  if (appearance === "form") {
    return (
      <div className="flex flex-col gap-16">
        <Heading className="text-xl-bold text-primary-900">
          <span className="text-primary-600">
            {resolvedLabelWord} {currentStep} -{" "}
          </span>
          {stepTitle}
        </Heading>
        <div className="flex flex-col gap-4">
          <ProgressBar
            variant="step"
            appearance="regular"
            currentStep={currentStep}
            totalStep={totalSteps}
            listStepStatus={Array.from(
              { length: Math.max(0, currentStep - 1) },
              () => "success" as const
            )}
            label={stepTitle}
            hideLabel
            hidePercentageValue
            className="[&_.progress-bar]:my-0! [&_.progress-bar]:h-12!"
          />
          <span className="text-s-regular text-neutral-700">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-20">
        <p className="text-l-bold">
          <span className="text-m-bold text-primary-600">
            {resolvedLabelWord} {currentStep} -{" "}
          </span>
          <span className="text-m-bold text-primary-900">{stepTitle}</span>
        </p>
      </div>

      <div className="rounded mb-32 flex flex-col gap-8 bg-neutral-100 p-12">
        <div className="flex h-4 w-full bg-neutral-200">
          <div className="h-4 w-4 border-r-2 border-r-white bg-primary-900" />
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 ${i < filledSegments ? "bg-primary-900" : "bg-neutral-200"}`}
            />
          ))}
          <div className="h-4 w-4 border-l-2 border-l-white bg-primary-900" />
        </div>
        <span className="text-s-regular text-neutral-700">{label}</span>
      </div>
    </>
  );
}
