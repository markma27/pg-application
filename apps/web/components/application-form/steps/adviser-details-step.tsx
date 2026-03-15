"use client";

import { useApplicationForm } from "@/lib/application-form";
import type { DocumentSendToValue } from "@/lib/application-form/types";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function DocumentSendToCheckboxes({
  value,
  onChange,
  name,
}: {
  value: DocumentSendToValue;
  onChange: (v: DocumentSendToValue) => void;
  name: string;
}) {
  const isNotRequired = value === "not_required";
  const selected = Array.isArray(value) ? value : [];

  const handleTrusteeOrAdviser = (opt: "trustee" | "adviser", checked: boolean) => {
    if (checked) {
      const next = [...(Array.isArray(value) ? value : []), opt];
      onChange(next);
    } else {
      onChange(selected.filter((x) => x !== opt));
    }
  };

  const handleNotRequired = (checked: boolean) => {
    onChange(checked ? "not_required" : "");
  };

  return (
    <div className="flex gap-6">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          name={name}
          checked={!isNotRequired && selected.includes("trustee")}
          onChange={(e) => handleTrusteeOrAdviser("trustee", e.target.checked)}
          disabled={isNotRequired}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
        />
        <span className="text-sm text-slate-700">Trustee</span>
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          name={name}
          checked={!isNotRequired && selected.includes("adviser")}
          onChange={(e) => handleTrusteeOrAdviser("adviser", e.target.checked)}
          disabled={isNotRequired}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
        />
        <span className="text-sm text-slate-700">Adviser</span>
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          name={name}
          checked={isNotRequired}
          onChange={(e) => handleNotRequired(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
        />
        <span className="text-sm text-slate-700">Not Required</span>
      </label>
    </div>
  );
}

export function AdviserDetailsStep() {
  const { state, setAdviser } = useApplicationForm();
  const update = (data: Parameters<typeof setAdviser>[0]) => setAdviser(data);
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

      <div className="space-y-10">
        {/* Investment Adviser Details */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-emerald-600">Investment Adviser Details</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-700">Name</Label>
              <Input
                value={state.adviserName}
                onChange={(e) => update({ adviserName: e.target.value })}
                placeholder="Adviser name"
                className="h-11 rounded-lg border-slate-300 px-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Company</Label>
              <Input
                value={state.adviserCompany}
                onChange={(e) => update({ adviserCompany: e.target.value })}
                placeholder="Company name"
                className="h-11 rounded-lg border-slate-300 px-4"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-700">Address</Label>
              <AddressAutocomplete
                value={state.adviserAddress}
                onChange={(v) => update({ adviserAddress: v })}
                placeholder="Start typing an address in Australia"
                className="h-11 rounded-lg border-slate-300 px-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Phone Number</Label>
              <Input
                value={state.adviserTel}
                onChange={(e) => update({ adviserTel: e.target.value.replace(/\D/g, "").slice(0, 15) })}
                placeholder="e.g. 0412345678"
                type="tel"
                inputMode="numeric"
                maxLength={15}
                aria-invalid={err("adviserTel")}
                className={cn("h-11 rounded-lg border-slate-300 px-4", err("adviserTel") && "border-red-500 ring-2 ring-red-500/20")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Email</Label>
              <Input
                value={state.adviserEmail}
                onChange={(e) => update({ adviserEmail: e.target.value })}
                placeholder="email@example.com"
                type="email"
                aria-invalid={err("adviserEmail")}
                className={cn("h-11 rounded-lg border-slate-300 px-4", err("adviserEmail") && "border-red-500 ring-2 ring-red-500/20")}
              />
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-700">
                Do you nominate your Investment Adviser as the primary contact for your portfolio?
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="nominate-primary"
                    checked={state.nominateAdviserPrimaryContact === true}
                    onChange={() => update({ nominateAdviserPrimaryContact: true })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="nominate-primary"
                    checked={state.nominateAdviserPrimaryContact === false}
                    onChange={() => update({ nominateAdviserPrimaryContact: false })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-700">
                Do you authorise your Investment Adviser to access your financial statements online?
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="authorise-access"
                    checked={state.authoriseAdviserAccessStatements === true}
                    onChange={() => update({ authoriseAdviserAccessStatements: true })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="authorise-access"
                    checked={state.authoriseAdviserAccessStatements === false}
                    onChange={() => update({ authoriseAdviserAccessStatements: false })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-700">
                Do you authorise us to deal with your Investment Adviser direct?
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="authorise-deal"
                    checked={state.authoriseDealWithAdviserDirect === true}
                    onChange={() => update({ authoriseDealWithAdviserDirect: true })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="authorise-deal"
                    checked={state.authoriseDealWithAdviserDirect === false}
                    onChange={() => update({ authoriseDealWithAdviserDirect: false })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Administration Details */}
        <section className="space-y-6 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold text-emerald-600">Investment Administration Details</h2>
          <p className="text-sm text-slate-600">
            Please advise where you would like us to send the following investment documents:
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="min-w-[140px] text-sm font-medium text-slate-700">Annual Report</span>
              <DocumentSendToCheckboxes
                name="send-to-annual"
                value={state.annualReportSendTo ?? ""}
                onChange={(v) => update({ annualReportSendTo: v })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <span className="min-w-[140px] text-sm font-medium text-slate-700">Meeting Proxy</span>
              <DocumentSendToCheckboxes
                name="send-to-proxy"
                value={state.meetingProxySendTo ?? ""}
                onChange={(v) => update({ meetingProxySendTo: v })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <span className="min-w-[140px] text-sm font-medium text-slate-700">Investment Offers</span>
              <DocumentSendToCheckboxes
                name="send-to-offers"
                value={state.investmentOffersSendTo ?? ""}
                onChange={(v) => update({ investmentOffersSendTo: v })}
              />
            </div>
          </div>
        </section>

        {/* Dividend Reinvestment Plan */}
        <section className="space-y-6 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold text-emerald-600">Dividend Reinvestment Plan</h2>
          <p className="text-sm text-slate-600">
            If you invest in listed securities or unit trusts they may offer you the option to have the
            dividends/distributions paid in cash, or reinvested. Please advise us of your preference:
          </p>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="dividend-preference"
                checked={state.dividendPreference === "cash"}
                onChange={() => update({ dividendPreference: "cash" })}
                className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              <span className="text-sm text-slate-700">Receive in cash</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="dividend-preference"
                checked={state.dividendPreference === "reinvest"}
                onChange={() => update({ dividendPreference: "reinvest" })}
                className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              <span className="text-sm text-slate-700">Re-invest</span>
            </label>
          </div>
        </section>
      </div>
    </>
  );
}
