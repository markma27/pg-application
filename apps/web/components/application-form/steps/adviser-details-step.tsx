"use client";

import { useEffect } from "react";
import { useApplicationForm } from "@/lib/application-form";
import type { DocumentSendToValue } from "@/lib/application-form/types";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Remove "adviser" from document routing when applicant has no investment adviser */
function stripAdviserFromDocumentSend(v: DocumentSendToValue): DocumentSendToValue {
  if (v === "not_required" || v === "") return v;
  if (!Array.isArray(v) || !v.includes("adviser")) return v;
  const next = v.filter((x) => x !== "adviser");
  return next.length === 0 ? "" : next;
}

/** Same Yes/No switch pattern as `ServiceRowToggle` on the services step */
function InvestmentAdviserPresenceToggle({
  label,
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  label: string;
  /** Coerced to boolean so the checkbox stays controlled if parent passes undefined (e.g. stale state). */
  checked: boolean | undefined;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.83rem] items-center gap-x-4 py-1.5">
      <span className="min-w-0 text-sm text-slate-700">{label}</span>
      <label
        className="relative inline-flex shrink-0 cursor-pointer items-center justify-self-end"
        aria-label={ariaLabel}
      >
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          role="switch"
        />
        <div
          className={cn(
            "peer relative inline-block h-[2.415rem] w-[4.83rem] shrink-0 rounded-full bg-emerald-200 outline-none transition-colors duration-100 after:duration-300",
            "peer-checked:bg-emerald-600",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/50",
            "after:pointer-events-none after:absolute after:left-[0.1725rem] after:top-[0.1725rem] after:flex after:h-[2.07rem] after:w-[2.07rem] after:items-center after:justify-center after:rounded-full after:bg-white after:text-[9px] after:font-bold after:text-emerald-900 after:shadow-md after:outline-none after:transition-transform",
            "after:content-['No']",
            "peer-checked:after:translate-x-[2.415rem] peer-checked:after:content-['Yes'] peer-checked:after:border peer-checked:after:border-white",
          )}
        />
      </label>
    </div>
  );
}

function DocumentSendToCheckboxes({
  value,
  onChange,
  name,
  invalid,
  adviserDisabled,
}: {
  value: DocumentSendToValue;
  onChange: (v: DocumentSendToValue) => void;
  name: string;
  invalid?: boolean;
  /** When true (no investment adviser), "Adviser" cannot be selected */
  adviserDisabled?: boolean;
}) {
  const isNotRequired = value === "not_required";
  const selected = Array.isArray(value) ? value : [];
  const adviserGrey = adviserDisabled ?? false;

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
    <div
      className={cn(
        "flex flex-wrap gap-6",
        invalid && "rounded-lg border-2 border-red-500 bg-red-50/30 p-3",
      )}
    >
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          name={name}
          checked={!isNotRequired && selected.includes("trustee")}
          onChange={(e) => handleTrusteeOrAdviser("trustee", e.target.checked)}
          disabled={isNotRequired}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
        />
        <span className="text-sm text-slate-700">Individual</span>
      </label>
      <label
        className={cn("flex items-center gap-2", adviserGrey ? "cursor-not-allowed" : "cursor-pointer")}
      >
        <input
          type="checkbox"
          name={name}
          checked={!isNotRequired && selected.includes("adviser")}
          onChange={(e) => handleTrusteeOrAdviser("adviser", e.target.checked)}
          disabled={isNotRequired || adviserGrey}
          className={cn(
            "h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600",
            adviserGrey && "opacity-50",
          )}
        />
        <span className={cn("text-sm", adviserGrey ? "text-slate-400" : "text-slate-700")}>Adviser</span>
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
  const showAdviserBlock = state.hasInvestmentAdviser ?? false;

  const handleHasInvestmentAdviserChange = (yes: boolean) => {
    if (!yes) {
      setAdviser({
        hasInvestmentAdviser: false,
        adviserName: "",
        adviserCompany: "",
        adviserAddress: "",
        adviserTel: "",
        adviserFax: "",
        adviserEmail: "",
        nominateAdviserPrimaryContact: "",
        authoriseAdviserAccessStatements: "",
        authoriseDealWithAdviserDirect: "",
        annualReportSendTo: stripAdviserFromDocumentSend(state.annualReportSendTo ?? ""),
        meetingProxySendTo: stripAdviserFromDocumentSend(state.meetingProxySendTo ?? ""),
        investmentOffersSendTo: stripAdviserFromDocumentSend(state.investmentOffersSendTo ?? ""),
      });
    } else {
      setAdviser({ hasInvestmentAdviser: true });
    }
  };

  useEffect(() => {
    if (showAdviserBlock) return;
    const ar = stripAdviserFromDocumentSend(state.annualReportSendTo ?? "");
    const mp = stripAdviserFromDocumentSend(state.meetingProxySendTo ?? "");
    const io = stripAdviserFromDocumentSend(state.investmentOffersSendTo ?? "");
    if (ar !== state.annualReportSendTo || mp !== state.meetingProxySendTo || io !== state.investmentOffersSendTo) {
      setAdviser({ annualReportSendTo: ar, meetingProxySendTo: mp, investmentOffersSendTo: io });
    }
  }, [showAdviserBlock, state.annualReportSendTo, state.meetingProxySendTo, state.investmentOffersSendTo, setAdviser]);

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
          <InvestmentAdviserPresenceToggle
            label="Do you have an investment adviser?"
            checked={showAdviserBlock}
            onChange={handleHasInvestmentAdviserChange}
            aria-label="Do you have an investment adviser"
          />
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
              showAdviserBlock ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            {/* px/py so focus rings are not clipped by overflow-hidden (collapse animation) */}
            <div className="min-h-0 overflow-hidden px-2 py-1 sm:px-2.5">
              <div
                className={cn(
                  "space-y-6 transition-opacity duration-300 ease-in-out motion-reduce:transition-none",
                  showAdviserBlock ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                aria-hidden={!showAdviserBlock}
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700">
                      Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      value={state.adviserName}
                      onChange={(e) => update({ adviserName: e.target.value })}
                      placeholder="Adviser name"
                      aria-invalid={err("adviserName")}
                      className={cn(
                        "h-11 rounded-lg border-slate-300 px-4",
                        err("adviserName") && "border-red-500 ring-2 ring-red-500/20",
                      )}
                      tabIndex={showAdviserBlock ? 0 : -1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">
                      Company <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      value={state.adviserCompany}
                      onChange={(e) => update({ adviserCompany: e.target.value })}
                      placeholder="Company name"
                      aria-invalid={err("adviserCompany")}
                      className={cn(
                        "h-11 rounded-lg border-slate-300 px-4",
                        err("adviserCompany") && "border-red-500 ring-2 ring-red-500/20",
                      )}
                      tabIndex={showAdviserBlock ? 0 : -1}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-slate-700">
                      Address <span className="text-red-600">*</span>
                    </Label>
                    <AddressAutocomplete
                      value={state.adviserAddress}
                      onChange={(v) => update({ adviserAddress: v })}
                      placeholder="Start typing an address in Australia"
                      className={cn(
                        "h-11 rounded-lg border-slate-300 px-4",
                        err("adviserAddress") && "border-red-500 ring-2 ring-red-500/20",
                      )}
                      disabled={!showAdviserBlock}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">
                      Phone Number <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      value={state.adviserTel}
                      onChange={(e) => update({ adviserTel: e.target.value.replace(/\D/g, "").slice(0, 15) })}
                      placeholder="e.g. 0412345678"
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                      aria-invalid={err("adviserTel")}
                      className={cn("h-11 rounded-lg border-slate-300 px-4", err("adviserTel") && "border-red-500 ring-2 ring-red-500/20")}
                      tabIndex={showAdviserBlock ? 0 : -1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">
                      Email <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      value={state.adviserEmail}
                      onChange={(e) => update({ adviserEmail: e.target.value })}
                      placeholder="email@example.com"
                      type="email"
                      aria-invalid={err("adviserEmail")}
                      className={cn("h-11 rounded-lg border-slate-300 px-4", err("adviserEmail") && "border-red-500 ring-2 ring-red-500/20")}
                      tabIndex={showAdviserBlock ? 0 : -1}
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  <div
                    className={cn(
                      "flex flex-col gap-2",
                      err("nominateAdviserPrimaryContact") && "rounded-lg border-2 border-red-500 bg-red-50/30 p-3",
                    )}
                  >
                    <span className="text-sm text-slate-700">
                      Do you nominate your Investment Adviser as the primary contact for your portfolio?{" "}
                      <span className="text-red-600">*</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="nominate-primary"
                          checked={state.nominateAdviserPrimaryContact === true}
                          onChange={() => update({ nominateAdviserPrimaryContact: true })}
                          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                          tabIndex={showAdviserBlock ? 0 : -1}
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
                          tabIndex={showAdviserBlock ? 0 : -1}
                        />
                        <span className="text-sm text-slate-700">No</span>
                      </label>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col gap-2",
                      err("authoriseAdviserAccessStatements") && "rounded-lg border-2 border-red-500 bg-red-50/30 p-3",
                    )}
                  >
                    <span className="text-sm text-slate-700">
                      Do you authorise your Investment Adviser to access your financial statements online?{" "}
                      <span className="text-red-600">*</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="authorise-access"
                          checked={state.authoriseAdviserAccessStatements === true}
                          onChange={() => update({ authoriseAdviserAccessStatements: true })}
                          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                          tabIndex={showAdviserBlock ? 0 : -1}
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
                          tabIndex={showAdviserBlock ? 0 : -1}
                        />
                        <span className="text-sm text-slate-700">No</span>
                      </label>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col gap-2",
                      err("authoriseDealWithAdviserDirect") && "rounded-lg border-2 border-red-500 bg-red-50/30 p-3",
                    )}
                  >
                    <span className="text-sm text-slate-700">
                      Do you authorise us to deal with your Investment Adviser direct?{" "}
                      <span className="text-red-600">*</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="authorise-deal"
                          checked={state.authoriseDealWithAdviserDirect === true}
                          onChange={() => update({ authoriseDealWithAdviserDirect: true })}
                          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                          tabIndex={showAdviserBlock ? 0 : -1}
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
                          tabIndex={showAdviserBlock ? 0 : -1}
                        />
                        <span className="text-sm text-slate-700">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Administration Details */}
        <section className="space-y-6 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold text-emerald-600">Investment Administration Details</h2>
          <p className="text-sm text-slate-600">
            Please advise where you would like us to send the following investment documents{" "}
            <span className="text-red-600">*</span>
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="min-w-[140px] text-sm font-medium text-slate-700">
                Annual Report <span className="text-red-600">*</span>
              </span>
              <DocumentSendToCheckboxes
                name="send-to-annual"
                value={state.annualReportSendTo ?? ""}
                onChange={(v) => update({ annualReportSendTo: v })}
                invalid={err("annualReportSendTo")}
                adviserDisabled={!showAdviserBlock}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <span className="min-w-[140px] text-sm font-medium text-slate-700">
                Meeting Proxy <span className="text-red-600">*</span>
              </span>
              <DocumentSendToCheckboxes
                name="send-to-proxy"
                value={state.meetingProxySendTo ?? ""}
                onChange={(v) => update({ meetingProxySendTo: v })}
                invalid={err("meetingProxySendTo")}
                adviserDisabled={!showAdviserBlock}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <span className="min-w-[140px] text-sm font-medium text-slate-700">
                Investment Offers <span className="text-red-600">*</span>
              </span>
              <DocumentSendToCheckboxes
                name="send-to-offers"
                value={state.investmentOffersSendTo ?? ""}
                onChange={(v) => update({ investmentOffersSendTo: v })}
                invalid={err("investmentOffersSendTo")}
                adviserDisabled={!showAdviserBlock}
              />
            </div>
          </div>
        </section>

        {/* Dividend Reinvestment Plan */}
        <section className="space-y-6 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold text-emerald-600">Dividend Reinvestment Plan</h2>
          <p className="text-sm text-slate-600">
            If you invest in listed securities or unit trusts they may offer you the option to have the
            dividends/distributions paid in cash, or reinvested. Please advise us of your preference:{" "}
            <span className="text-red-600">*</span>
          </p>
          <div
            className={cn(
              "flex flex-wrap gap-6",
              err("dividendPreference") && "rounded-lg border-2 border-red-500 bg-red-50/30 p-3",
            )}
          >
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
