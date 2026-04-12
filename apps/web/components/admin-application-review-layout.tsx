import type { ReactNode } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { ENTITY_TYPE_OPTIONS, PORTFOLIO_STATUS_OPTIONS } from "@/lib/application-form/constants";
import { cn } from "@/lib/utils";

const reviewFieldLabelClass = "text-sm font-medium text-emerald-900 dark:text-emerald-400";

/** Baseline-align label and value so currency/numbers line up with text (avoids columns looking vertically offset). */
const reviewFieldRowBase =
  "review-field-row grid grid-cols-1 items-baseline gap-1 py-1.5 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] sm:gap-4 sm:py-1.5";

/** Two-column field layout inside a section card (single column on small screens). */
export function AdminReviewFieldGrid({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        "admin-review-field-grid grid grid-cols-1 gap-x-10 gap-y-1 lg:grid-cols-2 xl:gap-x-14 " +
        "[&_.review-field-row]:sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] " +
        "[&_.review-field-row]:lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)] " +
        "[&_.review-field-row]:sm:gap-3 [&_.review-field-row]:sm:py-1.5"
      }
    >
      {children}
    </div>
  );
}

/** Renders each service as a compact chip so long lists stay scannable (admin review). */
export function AdminReviewServiceList({ items, emptyLabel = "None" }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <span className="text-sm leading-snug text-slate-700 dark:text-[var(--admin-muted-text)]">{emptyLabel}</span>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item, i) => (
        <li
          key={`${i}-${item}`}
          className="w-fit max-w-full rounded-md border border-emerald-200/70 bg-emerald-50/90 px-2 py-0.5 text-sm leading-snug text-slate-900 dark:border-emerald-800/40 dark:bg-emerald-900/30 dark:text-[var(--admin-dropdown-text)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Section title for admin review / processing (no edit affordance). */
export function AdminSectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <CardTitle className="text-base font-semibold text-slate-900 dark:text-[var(--admin-section-title)]">{title}</CardTitle>
      {subtitle ? <CardDescription className="mt-0.5 text-slate-600 dark:text-[var(--admin-muted-text)]">{subtitle}</CardDescription> : null}
    </div>
  );
}

export function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  const show = value != null && value !== "";
  if (!show) return null;
  return (
    <div className={reviewFieldRowBase}>
      <span className={reviewFieldLabelClass}>{label}</span>
      <span className="min-w-0 text-sm leading-snug text-slate-900 dark:text-[var(--admin-dropdown-text)]">{value}</span>
    </div>
  );
}

export function ReviewRowAlways({
  label,
  value,
  labelBold,
}: {
  label: string;
  value: ReactNode;
  /** When true, label uses semibold weight to match emphasized values (e.g. totals). */
  labelBold?: boolean;
}) {
  return (
    <div className={reviewFieldRowBase}>
      <span className={cn(reviewFieldLabelClass, labelBold && "font-bold")}>{label}</span>
      <span className="min-w-0 text-sm leading-snug text-slate-900 dark:text-[var(--admin-dropdown-text)]">{value ?? "—"}</span>
    </div>
  );
}

export function entityTypeLabel(value: string) {
  return ENTITY_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ");
}

export function portfolioLabel(value: string) {
  return PORTFOLIO_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ");
}

export function relationshipLabel(r: string) {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
