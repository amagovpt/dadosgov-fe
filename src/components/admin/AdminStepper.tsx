"use client";

import { useTranslation } from "react-i18next";

interface AdminStepperProps {
    currentStep: number;
    totalSteps: number;
    stepTitle: string;
    labelWord?: string;
    labelFormat?: "slash" | "de";
}

const TOTAL_SEGMENTS = 12;

export function AdminStepper({
    currentStep,
    totalSteps,
    stepTitle,
    labelWord,
    labelFormat = "slash",
}: AdminStepperProps) {
    const { t } = useTranslation("admin-common");
    const resolvedLabelWord = labelWord ?? t("stepper.step");
    const label =
        labelFormat === "de"
            ? `${resolvedLabelWord} ${currentStep} ${t("stepper.of")} ${totalSteps}`
            : `${resolvedLabelWord} ${currentStep}/${totalSteps}`;
    const filledSegments = Math.round((currentStep / totalSteps) * TOTAL_SEGMENTS);

    return (
        <>
            <div className="mb-20">
                <p className="text-l-bold">
                    <span className="text-primary-600 text-m-bold">{resolvedLabelWord} {currentStep} - </span>
                    <span className="text-primary-900 text-m-bold">{stepTitle}</span>
                </p>
            </div>

            <div className="bg-neutral-100 rounded p-12 mb-32 flex flex-col gap-8">
                <div className="flex w-full h-4 bg-neutral-200">
                    <div className="w-4 h-4 bg-primary-900  border-r-2 border-r-white" />
                    {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 h-full ${i < filledSegments ? "bg-primary-900" : "bg-neutral-200"}`}
                        />
                    ))}
                    <div className="w-4 h-4 bg-primary-900 border-l-2 border-l-white" />
                </div>
                <span className="text-s-regular text-neutral-700">
                    {label}
                </span>
            </div>
        </>
    );
}
