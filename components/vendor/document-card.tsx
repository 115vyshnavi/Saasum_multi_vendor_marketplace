"use client"

import { useRef, useState } from "react"
import { CheckCircle2, FileText, UploadCloud } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DocumentCard({
  title,
  description,
  required = false,
}: {
  title: string
  description: string
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors",
        fileName && "border-primary/40 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          fileName ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {fileName ? <CheckCircle2 className="size-5" /> : <FileText className="size-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {required ? (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              Required
            </Badge>
          ) : (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              Optional
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        {fileName && (
          <p className="mt-2 truncate text-xs font-medium text-primary">{fileName}</p>
        )}
      </div>

      <Button
        type="button"
        variant={fileName ? "ghost" : "outline"}
        size="sm"
        className="shrink-0"
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud /> {fileName ? "Replace" : "Upload"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  )
}
