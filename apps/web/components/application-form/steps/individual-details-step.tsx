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
  { value: "primary_contact", label: "Primary Contact" },
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
              <div className="space-y-3">
                <Label className="text-slate-700">Relationship to Account</Label>
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
                <div className="space-y-2">
                  <Label className="text-slate-700">Title</Label>
                  <Input
                    value={ind.title}
                    onChange={(e) => setIndividual(index, { title: e.target.value })}
                    placeholder="e.g. Mr, Ms"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Given Name</Label>
                    <Input
                      value={ind.givenName}
                      onChange={(e) => setIndividual(index, { givenName: e.target.value })}
                      placeholder="Given name"
                      className="h-11 rounded-lg border-slate-300 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Middle Name</Label>
                    <Input
                      value={ind.middleName}
                      onChange={(e) => setIndividual(index, { middleName: e.target.value })}
                      placeholder="Middle name"
                      className="h-11 rounded-lg border-slate-300 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Surname</Label>
                    <Input
                      value={ind.surname}
                      onChange={(e) => setIndividual(index, { surname: e.target.value })}
                      placeholder="Surname"
                      className="h-11 rounded-lg border-slate-300 px-4"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-slate-700">Street Address</Label>
                  <AddressAutocomplete
                    value={ind.streetAddress}
                    onChange={(v) => setIndividual(index, { streetAddress: v })}
                    placeholder="Type or select an address in Australia"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-slate-700">Address line 2 (optional)</Label>
                  <Input
                    value={ind.streetAddressLine2}
                    onChange={(e) => setIndividual(index, { streetAddressLine2: e.target.value })}
                    placeholder="Unit, building, etc."
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Tax File Number</Label>
                  <Input
                    value={ind.taxFileNumber}
                    onChange={(e) => setIndividual(index, { taxFileNumber: e.target.value })}
                    placeholder="TFN (optional)"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Date of Birth</Label>
                  <Input
                    type="date"
                    value={ind.dateOfBirth}
                    onChange={(e) => setIndividual(index, { dateOfBirth: e.target.value })}
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Country of Birth</Label>
                  <Input
                    value={ind.countryOfBirth}
                    onChange={(e) => setIndividual(index, { countryOfBirth: e.target.value })}
                    placeholder="e.g. Australia"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">City</Label>
                  <Input
                    value={ind.city}
                    onChange={(e) => setIndividual(index, { city: e.target.value })}
                    placeholder="City"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Occupation</Label>
                  <Input
                    value={ind.occupation}
                    onChange={(e) => setIndividual(index, { occupation: e.target.value })}
                    placeholder="Occupation"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Employer</Label>
                  <Input
                    value={ind.employer}
                    onChange={(e) => setIndividual(index, { employer: e.target.value })}
                    placeholder="Employer"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-slate-700">Email</Label>
                  <Input
                    type="email"
                    value={ind.email}
                    onChange={(e) => setIndividual(index, { email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-11 rounded-lg border-slate-300 px-4"
                  />
                </div>
              </div>

              {index === count - 1 && count > 1 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIndividualCount(count - 1)}
                    className="text-sm font-medium text-slate-600 underline hover:text-slate-800"
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
                "rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600",
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
