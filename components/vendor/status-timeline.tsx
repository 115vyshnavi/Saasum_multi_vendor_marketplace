import { Check, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type TimelineState = "done" | "current" | "upcoming"

const items: { title: string; desc: string; state: TimelineState }[] = [
  { title: "Application submitted", desc: "Your seller application was received.", state: "done" },
  { title: "Documents verified", desc: "Business and identity documents approved.", state: "done" },
  { title: "Compliance review", desc: "Our team is reviewing your application.", state: "current" },
  { title: "Account activated", desc: "Start listing products and accepting orders.", state: "upcoming" },
]

export function StatusTimeline() {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <li key={item.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px",
                  item.state === "done" ? "bg-primary" : "bg-border",
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border",
                item.state === "done" && "border-primary bg-primary text-primary-foreground",
                item.state === "current" && "border-primary bg-primary/10 text-primary",
                item.state === "upcoming" && "border-border bg-muted text-muted-foreground",
              )}
            >
              {item.state === "done" ? (
                <Check className="size-4" />
              ) : item.state === "current" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Clock className="size-4" />
              )}
            </span>
            <div className="pt-1">
              <p className={cn("text-sm font-medium", item.state === "upcoming" && "text-muted-foreground")}>
                {item.title}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
