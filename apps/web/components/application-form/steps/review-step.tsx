"use client";

import { useApplicationForm } from "@/lib/application-form";
import { ENTITY_TYPE_OPTIONS, PORTFOLIO_STATUS_OPTIONS, SERVICE_OPTIONS } from "@/lib/application-form/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ReviewStep() {
  const { state } = useApplicationForm();

  const entityTypeLabel = (value: string) => ENTITY_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
  const portfolioLabel = (value: string) => PORTFOLIO_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
  const serviceLabel = (value: string) => SERVICE_OPTIONS.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
          Review and summary
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please confirm your details before submitting the application.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="rounded-xl border border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 rounded-t-xl border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm text-slate-700">
            <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
              <span className="font-medium text-slate-900">Name</span>
              <span>{state.primaryContactName}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
              <span className="font-medium text-slate-900">Email</span>
              <span>{state.email}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
              <span className="font-medium text-slate-900">Phone</span>
              <span>{state.phone}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
              <span className="font-medium text-slate-900">Role</span>
              <span>{state.applicantRole}</span>
            </div>
            {state.groupName && (
              <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                <span className="font-medium text-slate-900">Group</span>
                <span>{state.groupName}</span>
              </div>
            )}
            {state.adviserDetails && (
              <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                <span className="font-medium text-slate-900">Adviser</span>
                <span>{state.adviserDetails}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {state.individuals.slice(0, state.individualCount).map((ind, i) => (
          <Card key={ind.id} className="rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 rounded-t-xl border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Individual {i + 1}: {[ind.title, ind.givenName, ind.middleName, ind.surname].filter(Boolean).join(" ") || "—"}
              </CardTitle>
              {ind.relationshipRoles?.length > 0 && (
                <CardDescription className="mt-1">
                  {ind.relationshipRoles.map((r) => r.replace(/_/g, " ")).join(", ")}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pt-4 text-sm text-slate-700">
              {(ind.streetAddress || ind.email) && (
                <>
                  {ind.streetAddress && (
                    <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                      <span className="font-medium text-slate-900">Address</span>
                      <span>{[ind.streetAddress, ind.streetAddressLine2].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {ind.dateOfBirth && (
                    <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                      <span className="font-medium text-slate-900">Date of birth</span>
                      <span>{ind.dateOfBirth}</span>
                    </div>
                  )}
                  {ind.email && (
                    <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                      <span className="font-medium text-slate-900">Email</span>
                      <span>{ind.email}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {state.entities.slice(0, state.entityCount).map((entity, i) => (
          <Card key={entity.id} className="rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 rounded-t-xl border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Entity {i + 1}: {entity.entityName || "Unnamed"}
              </CardTitle>
              <CardDescription className="mt-1">
                {entityTypeLabel(entity.entityType)} · {portfolioLabel(entity.portfolioStatus)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 text-sm text-slate-700">
              <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                <span className="font-medium text-slate-900">Asset counts</span>
                <span>
                  Listed: {entity.listedInvestmentCount}, Unlisted: {entity.unlistedInvestmentCount}, 
                  Property: {entity.propertyCount}, Wrap: {entity.wrapCount}
                </span>
              </div>
              
              {(entity.hasCrypto || entity.hasForeignInvestments || entity.otherAssetsText) && (
                <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                  <span className="font-medium text-slate-900">Other assets</span>
                  <span>
                    {[
                      entity.hasCrypto && "Crypto/alternatives",
                      entity.hasForeignInvestments && "Foreign investments",
                      entity.otherAssetsText
                    ].filter(Boolean).join(" · ")}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                <span className="font-medium text-slate-900">Services</span>
                <span>{entity.serviceCodes.map(serviceLabel).join(", ")}</span>
              </div>
              
              <div className="grid grid-cols-[1fr_2fr] gap-4 py-1">
                <span className="font-medium text-slate-900">Commencement</span>
                <span>{entity.commencementDate}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
