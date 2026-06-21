import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type Step = {
  id: string
  title: string
  description?: string
}

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[]
  current: number
  className?: string
}) {
  return (
    <ol className={cn("flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-0", className)}>
      {steps.map((step, i) => {
        const isComplete = i < current
        const isActive = i === current
        const isLast = i === steps.length - 1
        return (
          <li key={step.id} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:gap-0">
            <div className="flex items-center sm:w-full">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-primary/10 text-primary",
                  !isComplete && !isActive && "border-border bg-muted text-muted-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? <Check className="size-4" /> : i + 1}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "mx-3 hidden h-px flex-1 sm:block",
                    isComplete ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className="pb-4 sm:mt-3 sm:pb-0 sm:text-center">
              <p
                className={cn(
                  "text-sm font-medium leading-tight",
                  isActive || isComplete ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
