"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImageIcon, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function UploadField({
  label,
  hint,
  aspect = "banner",
}: {
  label: string
  hint?: string
  aspect?: "banner" | "square"
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file?: File) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setPreview(null)}
            className="text-muted-foreground"
          >
            <Trash2 /> Remove
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 text-center transition-colors hover:border-primary/50 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring outline-none",
          aspect === "banner" ? "aspect-[3/1]" : "aspect-square max-w-40",
          dragging && "border-primary bg-primary/5",
        )}
      >
        {preview ? (
          <Image src={preview || "/placeholder.svg"} alt={`${label} preview`} fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
            <span className="flex size-10 items-center justify-center rounded-full bg-background ring-1 ring-border">
              {aspect === "square" ? <ImageIcon className="size-5" /> : <UploadCloud className="size-5" />}
            </span>
            <span className="text-xs font-medium text-foreground">Click or drag to upload</span>
            {hint && <span className="text-xs">{hint}</span>}
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
      />
    </div>
  )
}
