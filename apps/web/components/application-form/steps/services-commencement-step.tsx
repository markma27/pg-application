"use client";

import { useApplicationForm } from "@/lib/application-form";
import { SERVICE_OPTIONS } from "@/lib/application-form/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ServicesCommencementStep() {
  const { state, setEntity, setGroupServices } = useApplicationForm();
  const entities = state.entities.slice(0, Math.min(state.entityCount, 6));
  const commencementDate = state.groupCommencementDate ?? "";

  const toggleService = (entityIndex: number, serviceValue: string, checked: boolean) => {
    const entity = state.entities[entityIndex];
    if (!entity) return;
    const next = checked
      ? [...(entity.serviceCodes || []), serviceValue]
      : (entity.serviceCodes || []).filter((c) => c !== serviceValue);
    setEntity(entityIndex, { serviceCodes: next });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
          New Client Application Form
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Select services per entity and preferred commencement date for the client group.
        </p>
      </div>

      <div className="space-y-10">
        <div className="space-y-4 sm:col-span-2">
          <div>
            <Label className="text-sm font-semibold text-slate-900">
              Services required <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-slate-500">
              Select at least one service per entity. Each column is an entity.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full table-fixed border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="w-[38%] border-b border-r border-slate-200 bg-slate-50/80 px-2 py-2 text-left font-semibold text-slate-900">
                    Service
                  </th>
                  {entities.map((entity, i) => (
                    <th
                      key={entity?.id ?? i}
                      className="border-b border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 align-bottom"
                    >
                      <span className="block break-words text-balance">
                        {entity?.entityName?.trim() || `Entity ${i + 1}`}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERVICE_OPTIONS.map((opt) => (
                  <tr
                    key={opt.value}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                  >
                    <td className="border-r border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-900">
                      <span className="flex items-center gap-1 truncate">
                        <span className="truncate">{opt.label}</span>
                        {opt.jmOnly && (
                          <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 font-medium text-slate-600">
                            JM
                          </span>
                        )}
                      </span>
                    </td>
                    {entities.map((entity, entityIndex) => {
                      const isChecked = (entity?.serviceCodes ?? []).includes(opt.value);
                      return (
                        <td
                          key={entity?.id ?? entityIndex}
                          className="px-1 py-1.5 text-center"
                        >
                          <label className="inline-flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleService(entityIndex, opt.value, e.target.checked)}
                              className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm font-semibold text-slate-900">
            Preferred commencement <span className="text-red-500">*</span>
          </Label>
          <p className="mb-2 text-xs text-slate-500">Financial year or date. Applies to all entities.</p>
          <Input
            value={commencementDate}
            onChange={(e) => setGroupServices({ groupCommencementDate: e.target.value })}
            placeholder="e.g. 2025 or 1 July 2025"
            required
            className="h-11 max-w-md rounded-lg border-slate-300 px-4"
          />
        </div>
      </div>
    </>
  );
}
