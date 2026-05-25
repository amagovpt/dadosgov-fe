"use client";

interface AdminStepperProps {
    currentStep: number;
    totalSteps: number;
    stepTitle: string;
    labelWord?: "Passo" | "Etapa";
    labelFormat?: "slash" | "de";
}

const TOTAL_SEGMENTS = 12;

export function AdminStepper({
    currentStep,
    totalSteps,
    stepTitle,
    labelWord = "Passo",
    labelFormat = "slash",
}: AdminStepperProps) {
    const filledSegments = Math.round((currentStep / totalSteps) * TOTAL_SEGMENTS);
    const label =
        labelFormat === "de"
            ? `${labelWord} ${currentStep} de ${totalSteps}`
            : `${labelWord} ${currentStep}/${totalSteps}`;

    return (
        <>
            <div className="mb-20">
                <p className="text-l-bold">
                    <span className="text-primary-600 text-m-bold">{labelWord} {currentStep} - </span>
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