"use client";

import { useApplicationForm } from "@/lib/application-form";
import { SERVICE_OPTIONS } from "@/lib/application-form/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EntityDetailStepServices({ entityIndex }: { entityIndex: number }) {
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
        <p className="mt-2 text-base text-slate-500">
          Onboard new clients for investment portfolio administration and reporting service.
        </p>
      </div>

      <div className="space-y-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4 sm:col-span-2">
            <div>
              <Label className="text-base font-semibold text-slate-900">
                Services required <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-slate-500">Select at least one service.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICE_OPTIONS.map((opt) => {
                const isSelected = entity.serviceCodes.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all hover:bg-slate-50",
                      isSelected ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600" : "border-slate-200 bg-white"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...entity.serviceCodes, opt.value]
                          : entity.serviceCodes.filter((c) => c !== opt.value);
                        update({ serviceCodes: next });
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {opt.label}
                      {opt.jmOnly && (
                        <span className="ml-1.5 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          JM
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2 md:col-span-1">
            <Label className="text-base font-semibold text-slate-900">
              Preferred commencement <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-slate-500 mb-2">Financial year or date.</p>
            <Input
              value={entity.commencementDate}
              onChange={(e) => update({ commencementDate: e.target.value })}
              placeholder="e.g. 2025 or 1 July 2025"
              required
              className="h-11 rounded-lg border-slate-300 px-4"
            />
          </div>
        </div>
      </div>
    </>
  );
}
