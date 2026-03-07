"use client";

import { useApplicationForm } from "@/lib/application-form";
import { PORTFOLIO_STATUS_OPTIONS } from "@/lib/application-form/constants";
import type { EntityInput } from "@pg/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EntityDetailStepBasics({ entityIndex }: { entityIndex: number }) {
  const { state, setEntity } = useApplicationForm();
  const entity = state.entities[entityIndex];
  if (!entity) return null;

  const update = (data: Partial<typeof entity>) => setEntity(entityIndex, data);

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
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3 sm:col-span-2">
            <Label className="text-base font-semibold text-slate-900">
              Entity name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={entity.entityName}
              onChange={(e) => update({ entityName: e.target.value })}
              placeholder="e.g. Smith Family Trust"
              required
              className="h-11 rounded-lg border-slate-300 px-4"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label className="text-slate-700">Portfolio HIN (optional)</Label>
            <Input
              value={entity.portfolioHin ?? ""}
              onChange={(e) => update({ portfolioHin: e.target.value })}
              placeholder="e.g. XXXXXXXXX"
              className="h-11 rounded-lg border-slate-300 px-4"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">ABN (optional)</Label>
            <Input
              value={entity.abn ?? ""}
              onChange={(e) => update({ abn: e.target.value })}
              placeholder="e.g. 12 345 678 901"
              className="h-11 rounded-lg border-slate-300 px-4"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">TFN (optional)</Label>
            <Input
              value={entity.tfn ?? ""}
              onChange={(e) => update({ tfn: e.target.value })}
              placeholder="e.g. XXX XXX XXX"
              className="h-11 rounded-lg border-slate-300 px-4"
            />
          </div>
          {entity.abn?.trim() !== "" && (
            <div className="space-y-3 sm:col-span-2">
              <Label className="text-slate-700">Registered for GST?</Label>
              <div className="flex gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name={`registered-for-gst-${entityIndex}`}
                    checked={entity.registeredForGst === true}
                    onChange={() => update({ registeredForGst: true })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name={`registered-for-gst-${entityIndex}`}
                    checked={entity.registeredForGst === false}
                    onChange={() => update({ registeredForGst: false })}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-4 sm:col-span-2">
            <div>
              <Label className="text-base font-semibold text-slate-900">
                Portfolio status <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-slate-500">Is this a new or existing portfolio?</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PORTFOLIO_STATUS_OPTIONS.map((opt) => {
                const isSelected = entity.portfolioStatus === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all hover:bg-slate-50",
                      isSelected ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600" : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors border-slate-300">
                      {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                    <input
                      type="radio"
                      name={`portfolio-status-${entityIndex}`}
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => update({ portfolioStatus: opt.value as EntityInput["portfolioStatus"] })}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-900">Asset counts (estimates)</Label>
            <p className="text-sm text-slate-500">Approximate numbers for complexity assessment.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Listed</Label>
              <Input
                type="number"
                min={0}
                value={entity.listedInvestmentCount === 0 ? "" : entity.listedInvestmentCount}
                onChange={(e) => update({ listedInvestmentCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="0"
                className="h-11 rounded-lg border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Unlisted</Label>
              <Input
                type="number"
                min={0}
                value={entity.unlistedInvestmentCount === 0 ? "" : entity.unlistedInvestmentCount}
                onChange={(e) => update({ unlistedInvestmentCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="0"
                className="h-11 rounded-lg border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Properties</Label>
              <Input
                type="number"
                min={0}
                value={entity.propertyCount === 0 ? "" : entity.propertyCount}
                onChange={(e) => update({ propertyCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="0"
                className="h-11 rounded-lg border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Wrap / platform</Label>
              <Input
                type="number"
                min={0}
                value={entity.wrapCount === 0 ? "" : entity.wrapCount}
                onChange={(e) => update({ wrapCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="0"
                className="h-11 rounded-lg border-slate-300"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-700">Other assets (e.g. crypto) – optional</Label>
              <Input
                value={entity.otherAssetsText}
                onChange={(e) => update({ otherAssetsText: e.target.value })}
                placeholder="Brief description"
                className="h-11 rounded-lg border-slate-300"
              />
            </div>
            <div className="flex flex-col justify-end space-y-3 pb-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={entity.hasCrypto}
                  onChange={(e) => update({ hasCrypto: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span className="text-sm text-slate-700">Crypto or alternative assets present</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={entity.hasForeignInvestments}
                  onChange={(e) => update({ hasForeignInvestments: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span className="text-sm text-slate-700">Foreign investments present</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
