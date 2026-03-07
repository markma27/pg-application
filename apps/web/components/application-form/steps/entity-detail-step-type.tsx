"use client";

import { useApplicationForm } from "@/lib/application-form";
import { ENTITY_TYPE_OPTIONS } from "@/lib/application-form/constants";
import type { EntityInput } from "@pg/shared";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EntityDetailStepType({ entityIndex }: { entityIndex: number }) {
  const { state, setEntity } = useApplicationForm();
  const entity = state.entities[entityIndex];
  if (!entity) return null;

  const isPafOrPuaf = entity.entityType === "paf" || entity.entityType === "puaf";
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
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-slate-900">
            Select the entity type for the application <span className="text-red-500">*</span>
          </Label>
          <div className="grid gap-3">
            {ENTITY_TYPE_OPTIONS.map((opt) => {
              const isSelected = entity.entityType === opt.value;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:bg-slate-50",
                    isSelected ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600" : "border-slate-200 bg-white"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {opt.letter}
                    </span>
                    <div>
                      <span className="block font-medium text-slate-900">{opt.label}</span>
                      <p className="text-sm text-slate-500">{opt.description}</p>
                    </div>
                  </div>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors border-slate-300">
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                  </div>
                  <input
                    type="radio"
                    name={`entity-type-${entityIndex}`}
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => update({ entityType: opt.value as EntityInput["entityType"] })}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
          {isPafOrPuaf && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              PAF and PuAF services are provided by Jaquillard Minns. We will collect details and a separate quote will follow.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
