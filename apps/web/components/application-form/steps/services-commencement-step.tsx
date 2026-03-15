"use client";

import type { EntityInput } from "@pg/shared";
import { useApplicationForm } from "@/lib/application-form";
import type { ApplicationFormState } from "@/lib/application-form/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STANDARD_SERVICES = [
  "Monthly investment administration & reconciliation",
  "Annual investment & tax reporting",
  "Registered address / mailbox for portfolio",
];

const ADD_ON_SERVICES: { label: string; code: EntityInput["serviceCodes"][number] }[] = [
  { label: "Monthly investment reporting", code: "monthly_reporting" },
  { label: "Quarterly investment reporting", code: "quarterly_reporting" },
  { label: "ASIC agent for companies", code: "asic_agent" },
  { label: "Business activity statement", code: "bas" },
];

type PafPuafToggleKey = keyof NonNullable<ApplicationFormState["pafPuafServiceToggles"]>;
// PAF/PuAF: five independent toggles (first two both add acnc_ais to payload when selected)
const PAF_PUAF_SERVICES: { label: string; key: PafPuafToggleKey }[] = [
  { label: "Annual financial statements", key: "annualFinancialStatements" },
  { label: "Annual information statement", key: "annualInformationStatement" },
  { label: "Franking credit refund application", key: "frankingCreditRefundApplication" },
  { label: "PAF responsible person services", key: "pafResponsiblePersonServices" },
  { label: "PuAF sub-fund monthly statements", key: "puafSubFundMonthlyStatements" },
];

function ServiceRowToggle({
  label,
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-slate-700">{label}</span>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center" aria-label={ariaLabel}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          role="switch"
        />
        <span className="relative inline-block h-6 w-11 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-3 peer-focus-visible:ring-emerald-600/30" />
      </label>
    </li>
  );
}

export function ServicesCommencementStep() {
  const { state, setGroupServices } = useApplicationForm();
  const commencementDate = state.groupCommencementDate ?? "";
  const commencementError = state.stepErrorField === "groupCommencementDate";
  const selectedAddOn = state.selectedAddOnServiceCodes ?? [];
  const pafPuafToggles = state.pafPuafServiceToggles ?? {
    annualFinancialStatements: false,
    annualInformationStatement: false,
    frankingCreditRefundApplication: false,
    pafResponsiblePersonServices: false,
    puafSubFundMonthlyStatements: false,
  };
  const servicesComments = state.servicesComments ?? "";

  const toggleAddOn = (code: EntityInput["serviceCodes"][number], checked: boolean) => {
    const next = checked
      ? [...selectedAddOn, code]
      : selectedAddOn.filter((c) => c !== code);
    setGroupServices({ selectedAddOnServiceCodes: next });
  };

  const togglePafPuaf = (key: PafPuafToggleKey, checked: boolean) => {
    setGroupServices({ pafPuafServiceToggles: { [key]: checked } });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
          New Client Application Form
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Select services and preferred commencement date for the client group.
        </p>
      </div>

      <div className="space-y-10">
        {/* Standard services */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900">
            Our portfolio standard services include:
          </Label>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
            {STANDARD_SERVICES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Add-on services */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900">
            Our portfolio add-on services will be provided by Jaquillard Minns, including:
          </Label>
          <ul className="list-none space-y-0 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2">
            {ADD_ON_SERVICES.map(({ label, code }) => (
              <ServiceRowToggle
                key={code + label}
                label={label}
                checked={selectedAddOn.includes(code)}
                onChange={(checked) => toggleAddOn(code, checked)}
                aria-label={`${label}, add-on service`}
              />
            ))}
          </ul>
        </div>

        {/* PAF & PuAF services */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900">
            Our PAF & PuAF services will be provided by Jaquillard Minns, including:
          </Label>
          <ul className="list-none space-y-0 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2">
            {PAF_PUAF_SERVICES.map(({ label, key }) => (
              <ServiceRowToggle
                key={key}
                label={label}
                checked={pafPuafToggles[key]}
                onChange={(checked) => togglePafPuaf(key, checked)}
                aria-label={`${label}, PAF PuAF service`}
              />
            ))}
          </ul>
        </div>

        {/* Other comments or notes */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-900">Other comments or notes</Label>
          <textarea
            value={servicesComments}
            onChange={(e) => setGroupServices({ servicesComments: e.target.value })}
            placeholder="Any additional comments or notes about services…"
            rows={4}
            className="w-full min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base transition-colors outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/30"
          />
        </div>

        {/* Preferred commencement date */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-900">
            Preferred commencement date <span className="text-red-500">*</span>
          </Label>
          <Input
            value={commencementDate}
            onChange={(e) => setGroupServices({ groupCommencementDate: e.target.value })}
            placeholder="e.g. 1 July 2025"
            required
            aria-invalid={commencementError}
            className={cn("h-11 max-w-md rounded-lg border-slate-300 px-4", commencementError && "border-red-500 ring-2 ring-red-500/20")}
          />
        </div>
      </div>
    </>
  );
}
