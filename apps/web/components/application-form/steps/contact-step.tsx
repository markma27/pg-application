"use client";

import { useApplicationForm } from "@/lib/application-form";
import { APPLICANT_ROLE_OPTIONS } from "@/lib/application-form/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContactStep() {
  const { state, setContact } = useApplicationForm();
  const err = (field: string) => state.stepErrorField === field;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
          New Client Application Form
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Onboard new clients for investment portfolio administration and reporting service.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Contact and group details</h2>
          <p className="text-sm text-slate-500">
            Primary contact and group information.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contact-name" className="text-slate-700">Primary contact name <span className="text-red-500">*</span></Label>
            <Input
              id="contact-name"
              value={state.primaryContactName}
              onChange={(e) => setContact({ primaryContactName: e.target.value })}
              placeholder="Full name"
              required
              aria-invalid={err("primaryContactName")}
              className={cn("h-11 rounded-lg border-slate-300 px-4", err("primaryContactName") && "border-red-500 ring-2 ring-red-500/20")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-email" className="text-slate-700">Email <span className="text-red-500">*</span></Label>
            <Input
              id="contact-email"
              type="email"
              value={state.email}
              onChange={(e) => setContact({ email: e.target.value })}
              placeholder="your.email@email.com"
              required
              aria-invalid={err("email")}
              className={cn("h-11 rounded-lg border-slate-300 px-4", err("email") && "border-red-500 ring-2 ring-red-500/20")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-phone" className="text-slate-700">Phone <span className="text-red-500">*</span></Label>
            <Input
              id="contact-phone"
              type="tel"
              inputMode="numeric"
              value={state.phone}
              onChange={(e) => setContact({ phone: e.target.value.replace(/\D/g, "").slice(0, 15) })}
              placeholder="e.g. 0412345678"
              maxLength={15}
              required
              aria-invalid={err("phone")}
              className={cn("h-11 rounded-lg border-slate-300 px-4", err("phone") && "border-red-500 ring-2 ring-red-500/20")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contact-role" className="text-slate-700">Role / relationship to client <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select
                id="contact-role"
                value={state.applicantRole}
                onChange={(e) => setContact({ applicantRole: e.target.value })}
                aria-invalid={err("applicantRole")}
                className={cn(
                  "flex h-11 w-full appearance-none rounded-lg border bg-white pl-4 pr-10 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-1 [&::-ms-expand]:hidden",
                  err("applicantRole") ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-300 focus-visible:border-emerald-600 focus-visible:ring-emerald-600"
                )}
                required
              >
                <option value="" disabled hidden>Select role</option>
                {APPLICANT_ROLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contact-group" className="text-slate-700">Family or group name <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input
              id="contact-group"
              value={state.groupName}
              onChange={(e) => setContact({ groupName: e.target.value })}
              placeholder="Optional group name"
              className="h-11 rounded-lg border-slate-300 px-4"
            />
          </div>
        </div>
      </div>
    </>
  );
}
