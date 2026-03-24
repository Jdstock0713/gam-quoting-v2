"use client";

type Step = {
  label: string;
  sublabel?: string;
};

type Props = {
  steps: Step[];
  currentStep: number; // 0-indexed
};

export default function StepTracker({ steps, currentStep }: Props) {
  return (
    <nav className="w-full py-4">
      <ol className="flex items-center justify-center gap-0">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isUpcoming = i > currentStep;

          return (
            <li key={i} className="flex items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                    isCompleted
                      ? "bg-blue-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-200"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium text-center leading-tight ${
                    isCurrent
                      ? "text-blue-700"
                      : isCompleted
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
                {step.sublabel && (
                  <span className="text-[10px] text-gray-400 text-center leading-tight">
                    {step.sublabel}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 mt-[-18px] ${
                    i < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
