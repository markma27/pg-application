"use client";

import { useApplicationForm } from "@/lib/application-form";
import type { IndividualRelationshipRole } from "@/lib/application-form/types";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_INDIVIDUALS } from "@/lib/application-form/constants";
import { cn } from "@/lib/utils";

const RELATIONSHIP_OPTIONS: { value: IndividualRelationshipRole; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "trustee", label: "Trustee" },
  { value: "director", label: "Director" },
  { value: "company_secretary", label: "Company Secretary" },
];

function toggleRole(roles: IndividualRelationshipRole[], role: IndividualRelationshipRole): IndividualRelationshipRole[] {
  const set = new Set(roles);
  if (set.has(role)) set.delete(role);
  else set.add(role);
  return Array.from(set);
}

export function IndividualDetailsStep() {
  const { state, setIndividual, setIndividualCount } = useApplicationForm();
  const count = state.individualCount;
  const individuals = state.individuals.slice(0, count);
  const err = (index: number, field: string) => state.stepErrorField === `individual_${index}_${field}`;

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
        {individuals.map((ind, index) => (
          <section
            key={ind.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <h2 className="rounded-t-xl bg-emerald-50 px-4 py-3 text-lg font-semibold text-emerald-800">
              Individual {index + 1}
            </h2>
            <div className="space-y-6 p-4 sm:p-6">
              <div className={cn("space-y-3", err(index, "relationshipRoles") && "rounded-lg border-2 border-red-500 bg-red-50/30 p-3")}>
                <Label className="text-slate-700">Relationship to Account <span className="text-red-600">*</span></Label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ind.relationshipRoles?.includes(opt.value) ?? false}
                        onChange={() =>
                          setIndividual(index, {
                            relationshipRoles: toggleRole(ind.relationshipRoles ?? [], opt.value),
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                      />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-end gap-4 sm:col-span-2 sm:flex-nowrap">
                  <div className="shrink-0 space-y-2 w-20">
                    <Label className="text-slate-700">Title <span className="text-red-600">*</span></Label>
                    <Input
                      value={ind.title}
                      onChange={(e) => setIndividual(index, { title: e.target.value })}
                      placeholder="e.g. Mr, Ms"
                      aria-invalid={err(index, "title")}
                      className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "title") && "border-red-500 ring-2 ring-red-500/20")}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label className="text-slate-700">Full Name <span className="text-red-600">*</span></Label>
                    <Input
                      value={ind.fullName}
                      onChange={(e) => setIndividual(index, { fullName: e.target.value })}
                      placeholder="Full name"
                      aria-invalid={err(index, "fullName")}
                      className={cn("h-11 w-full rounded-lg border-slate-300 px-4", err(index, "fullName") && "border-red-500 ring-2 ring-red-500/20")}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-slate-700">Street Address <span className="text-red-600">*</span></Label>
                  <AddressAutocomplete
                    value={ind.streetAddress}
                    onChange={(v) => setIndividual(index, { streetAddress: v })}
                    placeholder="Type or select an address in Australia"
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "streetAddress") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Tax File Number <span className="text-red-600">*</span></Label>
                  <Input
                    value={ind.taxFileNumber}
                    onChange={(e) => setIndividual(index, { taxFileNumber: e.target.value.replace(/\D/g, "").slice(0, 9) })}
                    placeholder="8 or 9 digits"
                    inputMode="numeric"
                    maxLength={9}
                    aria-invalid={err(index, "taxFileNumber")}
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "taxFileNumber") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Date of Birth <span className="text-red-600">*</span></Label>
                  <Input
                    type="date"
                    value={ind.dateOfBirth}
                    onChange={(e) => setIndividual(index, { dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split("T")[0]}
                    aria-invalid={err(index, "dateOfBirth")}
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "dateOfBirth") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Country of Birth <span className="text-red-600">*</span></Label>
                  <Input
                    value={ind.countryOfBirth}
                    onChange={(e) => setIndividual(index, { countryOfBirth: e.target.value })}
                    placeholder="e.g. Australia"
                    aria-invalid={err(index, "countryOfBirth")}
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "countryOfBirth") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">City of Birth <span className="text-red-600">*</span></Label>
                  <Input
                    value={ind.city}
                    onChange={(e) => setIndividual(index, { city: e.target.value })}
                    placeholder="City"
                    aria-invalid={err(index, "city")}
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "city") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Occupation <span className="text-red-600">*</span></Label>
                  <Input
                    value={ind.occupation}
                    onChange={(e) => setIndividual(index, { occupation: e.target.value })}
                    placeholder="Occupation"
                    aria-invalid={err(index, "occupation")}
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "occupation") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Employer <span className="text-red-600">*</span></Label>
                  <Input
                    value={ind.employer}
                    onChange={(e) => setIndividual(index, { employer: e.target.value })}
                    placeholder="Employer"
                    aria-invalid={err(index, "employer")}
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "employer") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-slate-700">Email <span className="text-red-600">*</span></Label>
                  <Input
                    type="email"
                    value={ind.email}
                    onChange={(e) => setIndividual(index, { email: e.target.value })}
                    placeholder="email@example.com"
                    aria-invalid={err(index, "email")}
                    className={cn("h-11 rounded-lg border-slate-300 px-4", err(index, "email") && "border-red-500 ring-2 ring-red-500/20")}
                  />
                </div>
              </div>

              {index === count - 1 && count > 1 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIndividualCount(count - 1)}
                    className="cursor-pointer text-sm font-medium text-slate-600 underline hover:text-slate-800"
                  >
                    Remove this individual
                  </button>
                </div>
              )}
            </div>
          </section>
        ))}

        {count < MAX_INDIVIDUALS && (
          <div>
            <button
              type="button"
              onClick={() => setIndividualCount(count + 1)}
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600",
                "hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700"
              )}
            >
              + Add another individual
            </button>
          </div>
        )}
      </div>
    </>
  );
}
