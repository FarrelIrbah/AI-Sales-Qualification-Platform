import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

interface StepIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
}

const StepIndicator = React.forwardRef<HTMLDivElement, StepIndicatorProps>(
  ({ className, currentStep, totalSteps, stepLabels, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep

            return (
              <React.Fragment key={stepNumber}>
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "border-2 border-primary bg-background text-primary",
                      !isCompleted && !isCurrent && "border border-muted-foreground/30 bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {/* Step label */}
                  {stepLabels && stepLabels[index] && (
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium",
                        isCompleted || isCurrent
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {stepLabels[index]}
                    </span>
                  )}
                </div>

                {/* Connecting line */}
                {stepNumber < totalSteps && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2",
                      stepNumber < currentStep
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }
)
StepIndicator.displayName = "StepIndicator"

export { Progress, StepIndicator }
