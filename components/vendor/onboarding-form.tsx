"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, FileCheck, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Stepper, type Step } from "@/components/vendor/stepper"
import { UploadField } from "@/components/vendor/upload-field"
import { DocumentCard } from "@/components/vendor/document-card"

const steps: Step[] = [
  { id: "business", title: "Business info", description: "Company details" },
  { id: "branding", title: "Branding", description: "Logo & banner" },
  { id: "documents", title: "Documents", description: "Verification" },
  { id: "review", title: "Review", description: "Submit" },
]

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export function OnboardingForm() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const isLast = current === steps.length - 1

  const next = () => {
    if (isLast) {
      router.push("/vendor/status")
      return
    }
    setCurrent((c) => Math.min(c + 1, steps.length - 1))
  }
  const back = () => setCurrent((c) => Math.max(c - 1, 0))

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Stepper rail */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Seller setup</p>
            <p className="text-xs text-muted-foreground">Step {current + 1} of {steps.length}</p>
          </div>
        </div>
        <div className="lg:[&_ol]:flex-col lg:[&_ol]:items-stretch">
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
                    <p className={`text-sm font-medium ${isActive || isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
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
                icon={<Building2 className="size-5" />}
                title="Tell us about your business"
                subtitle="This information appears on your public storefront and invoices."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Legal business name" htmlFor="legalName">
                  <Input id="legalName" placeholder="Atelier Nord GmbH" />
                </Field>
                <Field label="Store display name" htmlFor="storeName">
                  <Input id="storeName" placeholder="Atelier Nord" />
                </Field>
                <Field label="Business email" htmlFor="email">
                  <Input id="email" type="email" placeholder="hello@ateliernord.com" />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <Input id="phone" placeholder="+49 30 1234 5678" />
                </Field>
                <Field label="Category" htmlFor="category">
                  <Input id="category" placeholder="Apparel & Accessories" />
                </Field>
                <Field label="Country" htmlFor="country">
                  <Input id="country" placeholder="Germany" />
                </Field>
              </div>
              <Field label="Business description" htmlFor="desc">
                <Textarea id="desc" placeholder="Sustainable, design-led apparel handmade in Berlin." />
              </Field>
            </div>
          )}

          {current === 1 && (
            <div className="flex flex-col gap-6">
              <Header
                icon={<Store className="size-5" />}
                title="Brand your storefront"
                subtitle="Add a logo and banner so customers recognize your store."
              />
              <UploadField label="Store banner" hint="Recommended 1500 × 500px, JPG or PNG" aspect="banner" />
              <UploadField label="Store logo" hint="Square, min 256px" aspect="square" />
            </div>
          )}

          {current === 2 && (
            <div className="flex flex-col gap-6">
              <Header
                icon={<FileCheck className="size-5" />}
                title="Verification documents"
                subtitle="We use these to verify your business and enable payouts."
              />
              <div className="flex flex-col gap-3">
                <DocumentCard
                  title="Business registration"
                  description="Certificate of incorporation or trade license."
                  required
                />
                <DocumentCard
                  title="Tax / VAT certificate"
                  description="Document showing your tax identification number."
                  required
                />
                <DocumentCard
                  title="Government-issued ID"
                  description="Passport or national ID of the account owner."
                  required
                />
                <DocumentCard
                  title="Bank statement"
                  description="Recent statement for payout verification."
                />
              </div>
            </div>
          )}

          {current === 3 && (
            <div className="flex flex-col gap-6">
              <Header
                icon={<CheckCircle2 className="size-5" />}
                title="Review & submit"
                subtitle="Confirm your details. Our team typically reviews applications within 1–2 business days."
              />
              <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
                {[
                  ["Store name", "Atelier Nord"],
                  ["Category", "Apparel & Accessories"],
                  ["Country", "Germany"],
                  ["Documents", "4 uploaded"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-card p-4">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" />
                <span className="text-muted-foreground">
                  I confirm the information provided is accurate and agree to the{" "}
                  <span className="font-medium text-foreground">Seller Terms</span> and{" "}
                  <span className="font-medium text-foreground">Payout Agreement</span>.
                </span>
              </label>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button type="button" variant="ghost" onClick={back} disabled={current === 0}>
              <ArrowLeft /> Back
            </Button>
            <Button type="button" onClick={next} className="h-10 px-5">
              {isLast ? "Submit application" : "Continue"}
              {!isLast && <ArrowRight />}
            </Button>
          </div>
        </div>
      </div>
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
