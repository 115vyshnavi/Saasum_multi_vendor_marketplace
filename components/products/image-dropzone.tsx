"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Star, UploadCloud, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Img = { id: string; url: string }

export function ImageDropzone({ initial = [] }: { initial?: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<Img[]>(
    initial.map((url, i) => ({ id: `init-${i}`, url })),
  )
  const [dragging, setDragging] = useState(false)

  const addFiles = (files?: FileList | null) => {
    if (!files) return
    const next = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      url: URL.createObjectURL(f),
    }))
    setImages((prev) => [...prev, ...next])
  }

  const remove = (id: string) => setImages((prev) => prev.filter((img) => img.id !== id))
  const makeCover = (id: string) =>
    setImages((prev) => {
      const target = prev.find((p) => p.id === id)
      if (!target) return prev
      return [target, ...prev.filter((p) => p.id !== id)]
    })

  return (
    <div className="flex flex-col gap-3">
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
          addFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center outline-none transition-colors hover:border-primary/50 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <UploadCloud className="size-6 text-muted-foreground" />
        </span>
        <span className="text-sm font-medium">Drag &amp; drop images here</span>
        <span className="text-xs text-muted-foreground">
          or click to browse · PNG, JPG, WEBP up to 5MB each
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary"
            >
              <Image src={img.url || "/placeholder.svg"} alt="Product image" fill sizes="120px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="size-2.5 fill-current" /> Cover
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(img.id)}
                    aria-label="Set as cover"
                    className="inline-flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow hover:bg-muted"
                  >
                    <Star className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  aria-label="Remove image"
                  className="inline-flex size-8 items-center justify-center rounded-full bg-background text-destructive shadow hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <ImagePlus className="size-5" />
            <span className="text-xs font-medium">Add</span>
          </button>
        </div>
      )}
    </div>
  )
}
