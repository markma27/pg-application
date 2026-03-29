"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assessApplication,
  createDefaultPricingModel,
  mergePricingModelWithDefaults,
  type ApplicationInput,
  type EntityInput,
  type PricingModel,
} from "@pg/shared";
import { STANDARD_SERVICE_CODES } from "@/lib/application-form/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PricingModelSettings } from "./pricing-model-settings";
import { PricingNativeSelect } from "./pricing-native-select";

const STORAGE_KEY = "pg-pricing-calculator-model";

function stringifyModel(m: PricingModel): string {
  return JSON.stringify(m, (_, v) => (v === Number.POSITIVE_INFINITY ? "__INF__" : v));
}

function parseStoredModel(raw: string): PricingModel | null {
  try {
    const p = JSON.parse(raw, (_, v) => (v === "__INF__" ? Number.POSITIVE_INFINITY : v));
    return mergePricingModelWithDefaults(p);
  } catch {
    return null;
  }
}

function aud(n: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

function parseCount(v: string): number {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const ENTITY_TYPES: { value: EntityInput["entityType"]; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
  { value: "trust", label: "Trust" },
  { value: "smsf", label: "SMSF" },
  { value: "paf", label: "PAF" },
  { value: "puaf", label: "PuAF" },
];

const PORTFOLIO_OPTIONS: { value: EntityInput["portfolioStatus"]; label: string }[] = [
  { value: "new", label: "New portfolio" },
  { value: "existing_clean", label: "Existing (clean)" },
  { value: "existing_reconciliation", label: "Existing (reconciliation)" },
  { value: "complex_cleanup", label: "Complex cleanup" },
];

type ReportingTier = "annual_only" | "quarterly" | "monthly";

function buildServiceCodes(
  reportingTier: ReportingTier,
  bas: boolean,
  asicAgent: boolean,
): EntityInput["serviceCodes"] {
  const codes: EntityInput["serviceCodes"] = [...STANDARD_SERVICE_CODES];
  if (reportingTier === "quarterly") codes.push("quarterly_reporting");
  if (reportingTier === "monthly") codes.push("monthly_reporting");
  if (bas) codes.push("bas");
  if (asicAgent) codes.push("asic_agent");
  return codes;
}

type Tab = "calculate" | "settings";

export function PricingCalculatorClient({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("calculate");
  const [pricingModel, setPricingModel] = useState<PricingModel>(() => createDefaultPricingModel());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const m = parseStoredModel(raw);
        if (m) setPricingModel(m);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function savePricingModelToStorage() {
    try {
      const normalized = mergePricingModelWithDefaults(pricingModel);
      localStorage.setItem(STORAGE_KEY, stringifyModel(normalized));
      setPricingModel(normalized);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      /* ignore */
    }
  }

  const [entityType, setEntityType] = useState<EntityInput["entityType"]>("individual");
  const [portfolioStatus, setPortfolioStatus] = useState<EntityInput["portfolioStatus"]>("new");
  const [listed, setListed] = useState("12");
  const [unlisted, setUnlisted] = useState("2");
  const [property, setProperty] = useState("1");
  const [wrap, setWrap] = useState("1");
  const [reportingTier, setReportingTier] = useState<ReportingTier>("annual_only");
  const [bas, setBas] = useState(false);
  const [asicAgent, setAsicAgent] = useState(false);

  const listedN = parseCount(listed);
  const unlistedN = parseCount(unlisted);
  const propertyN = parseCount(property);
  const wrapN = parseCount(wrap);

  const pricingModelResolved = useMemo(
    () => mergePricingModelWithDefaults(pricingModel),
    [pricingModel],
  );

  const pointsBreakdown = useMemo(() => {
    const p = pricingModelResolved.complexityPoints;
    const listedPts = listedN * p.listedInvestment;
    const unlistedPts = unlistedN * p.unlistedInvestment;
    const propPts = propertyN * p.investmentProperty;
    const wrapPts = wrapN * p.wrapAccount;
    const total = listedPts + unlistedPts + propPts + wrapPts;
    return { listedPts, unlistedPts, propPts, wrapPts, total };
  }, [listedN, unlistedN, propertyN, wrapN, pricingModelResolved]);

  const assessment = useMemo(() => {
    const serviceCodes = buildServiceCodes(reportingTier, bas, asicAgent);
    const entities: EntityInput[] = [
      {
        id: "calc-0",
        entityName: "Sample entity",
        entityType,
        portfolioStatus,
        portfolioHin: "",
        abn: "",
        tfn: "",
        listedInvestmentCount: listedN,
        unlistedInvestmentCount: unlistedN,
        propertyCount: propertyN,
        wrapCount: wrapN,
        otherAssetsText: "",
        hasCrypto: false,
        hasForeignInvestments: false,
        serviceCodes,
        commencementDate: "2026-01-01",
      },
    ];

    const input: ApplicationInput = {
      primaryContactName: "Calculator",
      email: "calc@example.com",
      phone: "0400000000",
      applicantRole: "Test",
      adviserDetails: "",
      groupName: "",
      servicesComments: "",
      entities,
    };

    return assessApplication(input, pricingModelResolved);
  }, [
    entityType,
    portfolioStatus,
    listedN,
    unlistedN,
    propertyN,
    wrapN,
    reportingTier,
    bas,
    asicAgent,
    pricingModelResolved,
  ]);

  const first = assessment.entityAssessments[0];
  const band = pricingModelResolved.complexityBands.find(
    (b) => pointsBreakdown.total >= b.min && pointsBreakdown.total <= b.max,
  );

  const baseFee =
    entityType in pricingModelResolved.entityBaseFees
      ? pricingModelResolved.entityBaseFees[entityType as keyof PricingModel["entityBaseFees"]]
      : null;

  const reportingExtra =
    (reportingTier === "quarterly" ? pricingModelResolved.reportingAddOns.quarterly_reporting : 0) +
    (reportingTier === "monthly" ? pricingModelResolved.reportingAddOns.monthly_reporting : 0);

  return (
    <div
      className={cn(
        "mx-auto w-full",
        embedded ? "max-w-7xl px-0 py-0" : "max-w-7xl px-4 py-10",
      )}
    >
      <header className={cn("mb-6", embedded && "mb-5")}>
        <h1
          className={cn(
            "font-bold tracking-tight text-slate-900",
            embedded ? "text-lg text-[#0c2742]" : "text-2xl",
          )}
        >
          Indicative pricing calculator
        </h1>
        <p
          className={cn(
            "text-slate-600 leading-relaxed",
            embedded ? "mt-1 text-xs" : "mt-2 text-sm",
          )}
        >
          Uses the same assessment logic as the application (with optional model overrides in Model
          settings). Figures are indicative only.
        </p>
      </header>

      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("calculate")}
          className={cn(
            "flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "calculate"
              ? "bg-white text-slate-900"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          Calculate
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "settings"
              ? "bg-white text-slate-900"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          Model settings
        </button>
      </div>

      {activeTab === "settings" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <PricingModelSettings
            model={pricingModel}
            setPricingModel={setPricingModel}
            onSave={savePricingModelToStorage}
            saveStatus={saveStatus}
          />
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch">
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800">Inputs</h2>

            <div className="space-y-2">
              <Label htmlFor="entity-type">Entity type</Label>
              <PricingNativeSelect
                id="entity-type"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityInput["entityType"])}
              >
                {ENTITY_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </PricingNativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio status</Label>
              <PricingNativeSelect
                id="portfolio"
                value={portfolioStatus}
                onChange={(e) =>
                  setPortfolioStatus(e.target.value as EntityInput["portfolioStatus"])
                }
              >
                {PORTFOLIO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </PricingNativeSelect>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "listed", label: "Listed investments", value: listed, set: setListed },
                { id: "unlisted", label: "Unlisted investments", value: unlisted, set: setUnlisted },
                { id: "property", label: "Investment properties", value: property, set: setProperty },
                { id: "wrap", label: "Wrap accounts", value: wrap, set: setWrap },
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input
                    id={f.id}
                    type="number"
                    min={0}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="cursor-text"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Reporting & add-ons
              </p>
              <p className="text-xs text-slate-500">
                Standard administration, reporting, and annual reporting are included in the base model.
              </p>
              <div className="space-y-2">
                <Label>Extra reporting</Label>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="reporting"
                      className="cursor-pointer"
                      checked={reportingTier === "annual_only"}
                      onChange={() => setReportingTier("annual_only")}
                    />
                    Annual only (no extra reporting fee)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="reporting"
                      className="cursor-pointer"
                      checked={reportingTier === "quarterly"}
                      onChange={() => setReportingTier("quarterly")}
                    />
                    Quarterly reporting (+{aud(pricingModelResolved.reportingAddOns.quarterly_reporting)})
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="reporting"
                      className="cursor-pointer"
                      checked={reportingTier === "monthly"}
                      onChange={() => setReportingTier("monthly")}
                    />
                    Monthly reporting (+{aud(pricingModelResolved.reportingAddOns.monthly_reporting)})
                  </label>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <Label>BAS and ASIC Agent</Label>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={bas}
                      onChange={(e) => setBas(e.target.checked)}
                    />
                    BAS (+{aud(pricingModelResolved.otherAddOns.bas)})
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={asicAgent}
                      onChange={(e) => setAsicAgent(e.target.checked)}
                    />
                    ASIC agent (+{aud(pricingModelResolved.otherAddOns.asic_agent)})
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-6 xl:min-h-[28rem]">
            <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm">
              <h2 className="font-semibold text-slate-800">Complexity breakdown</h2>
              <ul className="mt-3 space-y-1.5 text-slate-700">
                <li className="flex justify-between gap-4">
                  <span>
                    Listed × {pricingModelResolved.complexityPoints.listedInvestment}
                  </span>
                  <span className="tabular-nums">{pointsBreakdown.listedPts} pts</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>
                    Unlisted × {pricingModelResolved.complexityPoints.unlistedInvestment}
                  </span>
                  <span className="tabular-nums">{pointsBreakdown.unlistedPts} pts</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>
                    Property × {pricingModelResolved.complexityPoints.investmentProperty}
                  </span>
                  <span className="tabular-nums">{pointsBreakdown.propPts} pts</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>
                    Wrap × {pricingModelResolved.complexityPoints.wrapAccount}
                  </span>
                  <span className="tabular-nums">{pointsBreakdown.wrapPts} pts</span>
                </li>
                <li className="flex justify-between gap-4 border-t border-slate-100 pt-2 font-medium">
                  <span>Total complexity points</span>
                  <span className="tabular-nums">{pointsBreakdown.total} pts</span>
                </li>
              </ul>
              {band && (
                <p className="mt-3 text-xs text-slate-600">
                  Band {band.min}–{band.max === Number.POSITIVE_INFINITY ? "∞" : band.max}: complexity
                  surcharge{" "}
                  {band.pricingStatus === "manual_review"
                    ? "(manual review)"
                    : aud(band.annualFee)}
                </p>
              )}
            </div>

            {first && first.routingOutcome === "pg_fit" && first.annualFeeEstimate !== null && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm">
                <h2 className="font-semibold text-slate-800">Annual breakdown</h2>
                <ul className="mt-3 space-y-1.5 text-slate-700">
                  <li className="flex justify-between gap-4">
                    <span>Base ({entityType})</span>
                    <span>{baseFee !== null ? aud(baseFee) : "—"}</span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>Complexity surcharge</span>
                    <span>{band ? aud(band.annualFee) : "—"}</span>
                  </li>
                  {reportingExtra > 0 && (
                    <li className="flex justify-between gap-4">
                      <span>Extra reporting</span>
                      <span>{aud(reportingExtra)}</span>
                    </li>
                  )}
                  {bas && (
                    <li className="flex justify-between gap-4">
                      <span>BAS</span>
                      <span>{aud(pricingModelResolved.otherAddOns.bas)}</span>
                    </li>
                  )}
                  {asicAgent && (
                    <li className="flex justify-between gap-4">
                      <span>ASIC agent</span>
                      <span>{aud(pricingModelResolved.otherAddOns.asic_agent)}</span>
                    </li>
                  )}
                  <li className="flex justify-between gap-4 border-t border-slate-100 pt-2 font-medium">
                    <span>Annual fee</span>
                    <span>{aud(first.annualFeeEstimate)}</span>
                  </li>
                  {first.onboardingFeeEstimate !== null && (
                    <li className="flex justify-between gap-4">
                      <span>Onboarding (once)</span>
                      <span>{aud(first.onboardingFeeEstimate)}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
            </div>

            <div className="mt-auto w-full pt-2">
              <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
                <h2 className="text-sm font-semibold text-emerald-900">Totals (incl. GST)</h2>
                {assessment.indicativePricingAvailable && assessment.totalEstimate !== null ? (
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Annual fee</dt>
                      <dd className="font-medium text-slate-900">{aud(assessment.annualSubtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Onboarding fee</dt>
                      <dd className="font-medium text-slate-900">{aud(assessment.onboardingSubtotal)}</dd>
                    </div>
                    <div className="border-t border-emerald-200 pt-3 flex justify-between gap-4 text-base">
                      <dt className="font-semibold text-emerald-950">
                        First-year indicative total (incl. GST)
                      </dt>
                      <dd className="font-bold text-emerald-950">{aud(assessment.totalEstimate)}</dd>
                    </div>
                    <p className="text-xs text-slate-600 pt-1">
                      Ongoing years: annual component only ({aud(assessment.annualSubtotal)} per year at
                      this profile).
                    </p>
                  </dl>
                ) : (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-medium">No automated combined total</p>
                    <p className="mt-2 text-xs leading-relaxed opacity-90">
                      {first?.reviewReasons?.length
                        ? first.reviewReasons.map((r) => (
                            <span key={r} className="block">
                              {r}
                            </span>
                          ))
                        : null}
                      {first?.jmReasons?.length
                        ? first.jmReasons.map((r) => (
                            <span key={r} className="block">
                              {r}
                            </span>
                          ))
                        : null}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
