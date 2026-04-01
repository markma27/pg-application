"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PricingModel } from "@pg/shared";
import { createDefaultPricingModel } from "@pg/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PricingNativeSelect } from "./pricing-native-select";

function num(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function PricingModelSettings({
  model,
  setPricingModel,
  onSave,
  saveBusy = false,
  saveStatus = "idle",
  saveError = null,
  persistenceHint,
}: {
  model: PricingModel;
  setPricingModel: Dispatch<SetStateAction<PricingModel>>;
  onSave?: () => void | Promise<void>;
  saveBusy?: boolean;
  saveStatus?: "idle" | "saved";
  saveError?: string | null;
  persistenceHint?: string;
}) {
  const hint =
    persistenceHint ??
    "Adjust numbers to explore scenarios. The Calculate tab updates live. Use Save when available to persist the shared model.";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{hint}</p>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {onSave && (
              <button
                type="button"
                disabled={saveBusy}
                onClick={() => void onSave()}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  saveBusy && "cursor-wait opacity-80",
                  saveStatus === "saved"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
                )}
              >
                {saveBusy ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setPricingModel(createDefaultPricingModel())}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Reset all to defaults
            </button>
          </div>
          {saveError ? (
            <p className="max-w-md text-right text-xs text-red-600" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-800">Complexity points (per holding / flag)</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["listedInvestment", "Listed investment"],
              ["unlistedInvestment", "Unlisted investment"],
              ["investmentProperty", "Investment property"],
              ["wrapAccount", "Wrap account"],
              ["bankAccount", "Bank account"],
              ["foreignBankAccount", "Foreign bank account"],
              ["loan", "Loan"],
              ["cryptocurrency", "Cryptocurrency"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                min={0}
                step={1}
                className="cursor-text"
                value={model.complexityPoints[key]}
                onChange={(e) =>
                  setPricingModel((prev) => ({
                    ...prev,
                    complexityPoints: { ...prev.complexityPoints, [key]: num(e.target.value) },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800">Entity base annual fee (AUD)</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["individual", "Individual"],
              ["company", "Company"],
              ["trust", "Trust"],
              ["smsf", "SMSF"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={model.entityBaseFees[key]}
                onChange={(e) =>
                  setPricingModel((prev) => ({
                    ...prev,
                    entityBaseFees: { ...prev.entityBaseFees, [key]: num(e.target.value) },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800">Complexity bands (points range → annual surcharge)</h3>
        <p className="mt-1 text-xs text-slate-500">
          Bands are matched in order; the last row typically uses manual review for high points.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Min pts</th>
                <th className="px-3 py-2 font-medium">Max pts</th>
                <th className="px-3 py-2 font-medium">Annual surcharge (AUD)</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {model.complexityBands.map((band, i) => {
                const isLast = i === model.complexityBands.length - 1;
                return (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        min={0}
                        step={1}
                        value={band.min}
                        onChange={(e) =>
                          setPricingModel((prev) => {
                            const next = [...prev.complexityBands];
                            next[i] = { ...next[i]!, min: num(e.target.value) };
                            return { ...prev, complexityBands: next };
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      {isLast ? (
                        <span className="text-slate-500">∞ (open-ended)</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          min={0}
                          step={1}
                          value={band.max}
                          onChange={(e) =>
                            setPricingModel((prev) => {
                              const next = [...prev.complexityBands];
                              next[i] = { ...next[i]!, max: num(e.target.value) };
                              return { ...prev, complexityBands: next };
                            })
                          }
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        min={0}
                        step={100}
                        value={band.annualFee}
                        onChange={(e) =>
                          setPricingModel((prev) => {
                            const next = [...prev.complexityBands];
                            next[i] = { ...next[i]!, annualFee: num(e.target.value) };
                            return { ...prev, complexityBands: next };
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <PricingNativeSelect
                        className="text-xs"
                        value={band.pricingStatus}
                        onChange={(e) =>
                          setPricingModel((prev) => {
                            const next = [...prev.complexityBands];
                            next[i] = {
                              ...next[i]!,
                              pricingStatus: e.target.value as "indicative" | "manual_review",
                            };
                            return { ...prev, complexityBands: next };
                          })
                        }
                      >
                        <option value="indicative">indicative</option>
                        <option value="manual_review">manual_review</option>
                      </PricingNativeSelect>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Reporting add-ons (AUD)</h3>
          <div className="mt-3 space-y-3">
            {(
              [
                ["quarterly_reporting", "Quarterly reporting"],
                ["monthly_reporting", "Monthly reporting"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={model.reportingAddOns[key]}
                  onChange={(e) =>
                    setPricingModel((prev) => ({
                      ...prev,
                      reportingAddOns: { ...prev.reportingAddOns, [key]: num(e.target.value) },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Other add-ons (AUD)</h3>
          <div className="mt-3 space-y-3">
            {(
              [
                ["bas", "BAS"],
                ["asic_agent", "ASIC agent"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={model.otherAddOns[key]}
                  onChange={(e) =>
                    setPricingModel((prev) => ({
                      ...prev,
                      otherAddOns: { ...prev.otherAddOns, [key]: num(e.target.value) },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Onboarding fees (AUD)</h3>
          <div className="mt-3 space-y-3">
            {(
              [
                ["new", "New portfolio"],
                ["existing_clean", "Existing (clean)"],
                ["existing_reconciliation", "Existing (reconciliation)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={model.onboardingFees[key]}
                  onChange={(e) =>
                    setPricingModel((prev) => ({
                      ...prev,
                      onboardingFees: { ...prev.onboardingFees, [key]: num(e.target.value) },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
