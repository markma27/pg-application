"use client";

import { useEffect, useState } from "react";
import { useApplicationForm } from "@/lib/application-form";
import { PORTFOLIO_STATUS_OPTIONS } from "@/lib/application-form/constants";
import type { EntityInput } from "@pg/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PartialEntity } from "@/lib/application-form/types";

const MAX_PORTFOLIO_FILES = 5;
const MAX_PORTFOLIO_BYTES = 10 * 1024 * 1024;

function isAllowedPortfolioFile(name: string, mime: string): boolean {
  const m = mime.toLowerCase();
  if (
    m === "application/pdf" ||
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    m === "application/vnd.ms-excel" ||
    m === "text/csv" ||
    m === "text/plain"
  ) {
    return true;
  }
  const n = name.toLowerCase();
  return n.endsWith(".pdf") || n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv");
}

function mergePortfolioFiles(
  current: File[] | undefined,
  incoming: FileList | null,
): { ok: true; files: File[] } | { ok: false; message: string } {
  const cur = [...(current ?? [])];
  const add = incoming ? Array.from(incoming) : [];
  if (add.length === 0) return { ok: true, files: cur };
  if (cur.length + add.length > MAX_PORTFOLIO_FILES) {
    return { ok: false, message: `You can upload at most ${MAX_PORTFOLIO_FILES} files per entity.` };
  }
  for (const f of add) {
    if (f.size > MAX_PORTFOLIO_BYTES) {
      return { ok: false, message: `Each file must be at most 10 MB (${f.name}).` };
    }
    if (f.size < 1) {
      return { ok: false, message: `File is empty (${f.name}).` };
    }
    if (!isAllowedPortfolioFile(f.name, f.type || "")) {
      return { ok: false, message: `Use PDF or Excel (.xlsx, .xls) or CSV only (${f.name}).` };
    }
  }
  return { ok: true, files: [...cur, ...add] };
}

function AnimateSectionIn({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [runAnimation, setRunAnimation] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRunAnimation(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(className, runAnimation && "animate-section-in")}
      style={
        runAnimation
          ? undefined
          : { opacity: 0, transform: "translateY(-8px)" }
      }
    >
      {children}
    </div>
  );
}

function PortfolioReportSection({
  entityIndex,
  entity,
  update,
}: {
  entityIndex: number;
  entity: PartialEntity;
  update: (data: Partial<PartialEntity>) => void;
}) {
  const [runAnimation, setRunAnimation] = useState(false);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRunAnimation(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const files = entity.existingPortfolioReportFiles ?? [];

  return (
    <div
      className={cn("space-y-2 sm:col-span-2", runAnimation && "animate-section-in")}
      style={
        runAnimation
          ? undefined
          : { opacity: 0, transform: "translateY(-8px)" }
      }
    >
      <Label className="text-slate-700">
        Recent investment portfolio report <span className="text-slate-400 font-normal">(optional)</span>
      </Label>
      <p className="text-xs text-slate-500">
        PDF or Excel (.xlsx, .xls, .csv). Up to {MAX_PORTFOLIO_FILES} files, 10 MB each. Helps us understand your current holdings.
      </p>
      {fileHint && <p className="text-xs text-red-600">{fileHint}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          key={fileInputKey}
          type="file"
          id={`portfolio-report-${entityIndex}`}
          multiple
          accept=".pdf,.xlsx,.xls,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain"
          onChange={(e) => {
            const merged = mergePortfolioFiles(entity.existingPortfolioReportFiles, e.target.files);
            e.target.value = "";
            if (!merged.ok) {
              setFileHint(merged.message);
              return;
            }
            setFileHint(null);
            update({ existingPortfolioReportFiles: merged.files });
          }}
          className="sr-only"
        />
        <label
          htmlFor={`portfolio-report-${entityIndex}`}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700",
            files.length >= MAX_PORTFOLIO_FILES && "pointer-events-none opacity-50",
          )}
        >
          {files.length >= MAX_PORTFOLIO_FILES ? "Maximum files reached" : "Add files"}
        </label>
      </div>
      {files.length > 0 && (
        <ul className="space-y-2 text-sm text-slate-600">
          {files.map((f, idx) => (
            <li key={`${f.name}-${f.size}-${idx}`} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={() => {
                  const next = files.filter((_, i) => i !== idx);
                  update({ existingPortfolioReportFiles: next });
                  setFileInputKey((k) => k + 1);
                }}
                className="cursor-pointer shrink-0 text-slate-500 underline hover:text-slate-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <button
          type="button"
          onClick={() => {
            update({ existingPortfolioReportFiles: [] });
            setFileHint(null);
            setFileInputKey((k) => k + 1);
          }}
          className="text-sm text-slate-500 underline hover:text-slate-700"
        >
          Remove all files
        </button>
      )}
    </div>
  );
}

export function EntityDetailStepBasics({ entityIndex }: { entityIndex: number }) {
  const { state, setEntity } = useApplicationForm();
  const entity = state.entities[entityIndex];
  if (!entity) return null;

  const update = (data: Partial<typeof entity>) => setEntity(entityIndex, data);
  const err = (field: string) => state.stepErrorField === `entity_${entityIndex}_${field}`;

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
              Entity {entityIndex + 1} name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={entity.entityName}
              onChange={(e) => update({ entityName: e.target.value })}
              placeholder="Your full entity name including trustee name for trust entities"
              required
              aria-invalid={err("entityName")}
              className={cn("h-11 rounded-lg border-slate-300 px-4", err("entityName") && "border-red-500 ring-2 ring-red-500/20")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">ABN (optional)</Label>
            <Input
              value={entity.abn ?? ""}
              onChange={(e) =>
                update({ abn: e.target.value.replace(/\D/g, "").slice(0, 11) })
              }
              placeholder="Australian Business Number (11 digits)"
              inputMode="numeric"
              maxLength={11}
              aria-invalid={err("abn")}
              className={cn("h-11 rounded-lg border-slate-300 px-4", err("abn") && "border-red-500 ring-2 ring-red-500/20")}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">
              TFN <span className="text-red-500">*</span>
            </Label>
            <Input
              value={entity.tfn ?? ""}
              onChange={(e) =>
                update({ tfn: e.target.value.replace(/\D/g, "").slice(0, 9) })
              }
              placeholder="Tax File Number (8 or 9 digits)"
              inputMode="numeric"
              maxLength={9}
              required
              aria-invalid={err("tfn")}
              className={cn("h-11 rounded-lg border-slate-300 px-4", err("tfn") && "border-red-500 ring-2 ring-red-500/20")}
            />
          </div>
          {entity.abn?.trim() !== "" && (
            <AnimateSectionIn className="space-y-3 sm:col-span-2">
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
            </AnimateSectionIn>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-slate-700">Portfolio HIN (optional)</Label>
            <Input
              value={entity.portfolioHin ?? ""}
              onChange={(e) => update({ portfolioHin: e.target.value })}
              placeholder="Holder Identification Number. e.g. X1234567890"
              className="h-11 rounded-lg border-slate-300 px-4"
            />
          </div>

          <div className={cn("space-y-4 sm:col-span-2", err("portfolioStatus") && "rounded-lg border-2 border-red-500 bg-red-50/30 p-4")}>
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
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">{opt.label}</span>
                      {opt.footnote && (
                        <span className="mt-0.5 block text-xs text-slate-400">{opt.footnote}</span>
                      )}
                    </div>
                    <input
                      type="radio"
                      name={`portfolio-status-${entityIndex}`}
                      value={opt.value}
                      checked={isSelected}
                      onChange={() =>
                      update({
                        portfolioStatus: opt.value as EntityInput["portfolioStatus"],
                        ...(opt.value !== "existing_clean" ? { existingPortfolioReportFiles: [] } : {}),
                      })
                    }
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
            {entity.portfolioStatus === "existing_clean" && (
              <PortfolioReportSection entityIndex={entityIndex} entity={entity} update={update} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-900">Asset counts (estimates)</Label>
            <p className="text-sm text-slate-500">
              Please provide your best estimate of the number of investments in each category. Approximate figures are sufficient and will be used for complexity assessment.
            </p>
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
          <div className="mt-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Other Details & Notes</Label>
              <textarea
                value={entity.otherAssetsText}
                onChange={(e) => update({ otherAssetsText: e.target.value })}
                placeholder="e.g. other assets such as crypto, gold, etc. or asset type, platform or wrap, approximate value, or any other notes…"
                rows={4}
                className="w-full min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base transition-colors outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/30"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
