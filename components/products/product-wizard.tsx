"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  ImageIcon,
  Info,
  Layers,
  PackageCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Stepper, type Step } from "@/components/vendor/stepper"
import { CategorySelector } from "@/components/products/category-selector"
import { ImageDropzone } from "@/components/products/image-dropzone"
import { VariantEditor } from "@/components/products/variant-editor"
import type { Product } from "@/lib/products-shared"

const steps: Step[] = [
  { id: "details", title: "Details", description: "Name & description" },
  { id: "media", title: "Media", description: "Photos" },
  { id: "pricing", title: "Pricing", description: "Price & variants" },
  { id: "review", title: "Review", description: "Publish" },
]

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Header({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-pretty text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

export function ProductWizard({ product }: { product?: Product }) {
  const router = useRouter()
  const isEdit = Boolean(product)
  const [current, setCurrent] = useState(0)
  const [category, setCategory] = useState(product?.category ?? "")
  const isLast = current === steps.length - 1

  const next = () => {
    if (isLast) {
      router.push("/vendor/products")
      return
    }
    setCurrent((c) => Math.min(c + 1, steps.length - 1))
  }
  const back = () => setCurrent((c) => Math.max(c - 1, 0))

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Stepper rail */}
      <div className="h-fit rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PackageCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">
              {isEdit ? "Edit product" : "New product"}
            </p>
            <p className="text-xs text-muted-foreground">
              Step {current + 1} of {steps.length}
            </p>
          </div>
        </div>
        <ol className="flex flex-col gap-4">
          {steps.map((step, i) => {
            const isComplete = i < current
            const isActive = i === current
            return (
              <li key={step.id} className="flex items-center gap-3">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isComplete
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="size-4" /> : i + 1}
                </span>
                <div>
                  <p
                    className={`text-sm font-medium ${isActive || isComplete ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Form panel */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-6 lg:hidden">
          <Stepper steps={steps} current={current} />
        </div>

        <div className="p-6 sm:p-8">
          {current === 0 && (
            <div className="flex flex-col gap-6">
              <Header
                icon={<Info className="size-5" />}
                title="Product details"
                subtitle="Give your product a clear name and a description that sells."
              />
              <Field label="Product name" htmlFor="name">
                <Input id="name" defaultValue={product?.name} placeholder="Aura Wireless Headphones" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="category">
                  <CategorySelector value={category} onChange={setCategory} />
                </Field>
                <Field label="Brand" htmlFor="brand">
                  <Input id="brand" defaultValue={product?.vendor} placeholder="Aura Audio" />
                </Field>
              </div>
              <Field label="Description" htmlFor="desc" hint="Markdown supported. Highlight key features and benefits.">
                <Textarea
                  id="desc"
                  rows={5}
                  placeholder="Premium over-ear headphones with active noise cancellation and 40h battery life…"
                />
              </Field>
            </div>
          )}

          {current === 1 && (
            <div className="flex flex-col gap-6">
              <Header
                icon={<ImageIcon className="size-5" />}
                title="Product media"
                subtitle="Add up to 8 images. The first image is used as the cover."
              />
              <ImageDropzone initial={product ? [product.image] : []} />
            </div>
          )}

          {current === 2 && (
            <div className="flex flex-col gap-6">
              <Header
                icon={<DollarSign className="size-5" />}
                title="Pricing & inventory"
                subtitle="Set your base price and manage variants and stock."
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Price" htmlFor="price">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input id="price" type="number" defaultValue={product?.price} placeholder="0.00" className="pl-7" />
                  </div>
                </Field>
                <Field label="Compare-at price" htmlFor="compare">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="compare"
                      type="number"
                      defaultValue={product?.compareAt}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </Field>
                <Field label="Stock" htmlFor="stock">
                  <Input id="stock" type="number" defaultValue={product?.stock} placeholder="0" />
                </Field>
              </div>
              <VariantEditor />
            </div>
          )}

          {current === 3 && (
            <div className="flex flex-col gap-6">
              <Header
                icon={<Layers className="size-5" />}
                title="Review & publish"
                subtitle="Confirm everything looks right. You can save as a draft or publish live."
              />
              <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
                {[
                  ["Product", product?.name ?? "New product"],
                  ["Category", category || "—"],
                  ["Price", product?.price ? `$${product.price}` : "—"],
                  ["Stock", product?.stock != null ? String(product.stock) : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-card p-4">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <input type="checkbox" defaultChecked className="mt-0.5 size-4 accent-[var(--primary)]" />
                <span className="text-muted-foreground">
                  Submit this product for marketplace review. Once approved it will be visible to shoppers.
                </span>
              </label>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            {current === 0 ? (
              <Button type="button" variant="ghost" render={<Link href="/vendor/products" />}>
                <ArrowLeft /> Cancel
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={back}>
                <ArrowLeft /> Back
              </Button>
            )}
            <div className="flex items-center gap-2">
              {isLast && (
                <Button type="button" variant="outline" className="h-10 px-4" render={<Link href="/vendor/products" />}>
                  Save as draft
                </Button>
              )}
              <Button type="button" onClick={next} className="h-10 px-5">
                {isLast ? (isEdit ? "Save changes" : "Publish product") : "Continue"}
                {!isLast && <ArrowRight />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
