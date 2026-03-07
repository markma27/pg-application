"use client";

import { useApplicationForm } from "@/lib/application-form";
import { MIN_ENTITIES, MAX_ENTITIES } from "@/lib/application-form/constants";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EntityCountStep() {
  const { state, setEntityCount } = useApplicationForm();

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
          <h2 className="text-lg font-semibold text-slate-900">Add entities</h2>
          <p className="text-sm text-slate-500">
            How many entities will this application cover? You can add up to {MAX_ENTITIES}.
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-900">Number of entities <span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: MAX_ENTITIES - MIN_ENTITIES + 1 }, (_, i) => MIN_ENTITIES + i).map((n) => {
              const isSelected = state.entityCount === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEntityCount(n)}
                  className={cn(
                    "flex h-14 cursor-pointer items-center justify-center rounded-xl border text-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
