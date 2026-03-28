"use client";

import React, { useCallback, useMemo, useState } from "react";
import { fullApplicationSubmissionSchema } from "@pg/shared";
import type { ApplicationFormState, PartialEntity, PartialIndividual, SubmitResult } from "./types";
import { formStateToPayload } from "./types";
import { uploadPreparedPortfolioFiles } from "./portfolio-client-upload";
import { MIN_ENTITIES, MAX_ENTITIES, MIN_INDIVIDUALS, MAX_INDIVIDUALS } from "./constants";

/** Annual report / proxy / offers: at least one of Individual (trustee), Adviser, or Not required */
function documentSendToIsComplete(v: ApplicationFormState["annualReportSendTo"]): boolean {
  if (v === "not_required") return true;
  if (Array.isArray(v) && v.length > 0) return true;
  return false;
}

function createEmptyIndividual(id: string): PartialIndividual {
  return {
    id,
    relationshipRoles: [],
    title: "",
    fullName: "",
    streetAddress: "",
    streetAddressLine2: "",
    taxFileNumber: "",
    dateOfBirth: "",
    countryOfBirth: "",
    city: "",
    occupation: "",
    employer: "",
    email: "",
  };
}

function createEmptyEntity(id: string): PartialEntity {
  return {
    id,
    entityName: "",
    entityType: "",
    portfolioStatus: "",
    portfolioHin: "",
    abn: "",
    tfn: "",
    registeredForGst: "",
    listedInvestmentCount: 0,
    unlistedInvestmentCount: 0,
    propertyCount: 0,
    wrapCount: 0,
    otherAssetsText: "",
    hasCrypto: false,
    hasForeignInvestments: false,
    serviceCodes: [],
    commencementDate: "",
    existingPortfolioReportFiles: [],
  };
}

const initialState: ApplicationFormState = {
  step: 0,
  primaryContactName: "",
  email: "",
  phone: "",
  applicantRole: "",
  adviserDetails: "",
  groupName: "",
  entityCount: 1,
  entities: [createEmptyEntity(crypto.randomUUID())],
  groupCommencementDate: "",
  selectedAddOnServiceCodes: [],
  pafPuafServiceToggles: {
    annualFinancialStatements: false,
    annualInformationStatement: false,
    frankingCreditRefundApplication: false,
    pafResponsiblePersonServices: false,
    puafSubFundMonthlyStatements: false,
  },
  servicesComments: "",
  hasInvestmentAdviser: false,
  individualCount: 1,
  individuals: [createEmptyIndividual(crypto.randomUUID())],
  adviserName: "",
  adviserCompany: "",
  adviserAddress: "",
  adviserTel: "",
  adviserFax: "",
  adviserEmail: "",
  nominateAdviserPrimaryContact: "",
  authoriseAdviserAccessStatements: "",
  authoriseDealWithAdviserDirect: "",
  annualReportSendTo: "",
  meetingProxySendTo: "",
  investmentOffersSendTo: "",
  dividendPreference: "",
  submitResult: null,
  isSubmitting: false,
  stepError: null,
  stepErrorField: null,
};

type ApplicationFormContextValue = {
  state: ApplicationFormState;
  totalSteps: number;
  reviewStepIndex: number;
  confirmationStepIndex: number;
  currentStepLabel: string;
  currentStepDescription: string;
  setContact: (data: Partial<Pick<ApplicationFormState, "primaryContactName" | "email" | "phone" | "applicantRole" | "adviserDetails" | "groupName">>) => void;
  setGroupServices: (data: Partial<Pick<ApplicationFormState, "groupCommencementDate" | "selectedAddOnServiceCodes" | "pafPuafServiceToggles" | "servicesComments">>) => void;
  setEntityCount: (count: number) => void;
  setEntity: (index: number, data: Partial<PartialEntity>) => void;
  setIndividual: (index: number, data: Partial<PartialIndividual>) => void;
  setIndividualCount: (count: number) => void;
  removeIndividualAt: (index: number) => void;
  setAdviser: (data: Partial<Pick<ApplicationFormState, "hasInvestmentAdviser" | "adviserName" | "adviserCompany" | "adviserAddress" | "adviserTel" | "adviserFax" | "adviserEmail" | "nominateAdviserPrimaryContact" | "authoriseAdviserAccessStatements" | "authoriseDealWithAdviserDirect" | "annualReportSendTo" | "meetingProxySendTo" | "investmentOffersSendTo" | "dividendPreference">>) => void;
  servicesStepIndex: number;
  individualDetailsStepIndex: number;
  adviserDetailsStepIndex: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  restart: () => void;
  submit: () => Promise<void>;
  clearStepError: () => void;
};

const ApplicationFormContext = React.createContext<ApplicationFormContextValue | null>(null);

export function ApplicationFormProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ApplicationFormState>(initialState);

  const entityStepsStart = 2;
  const entityStepsPerEntity = 2;
  const totalEntitySteps = state.entityCount * entityStepsPerEntity;
  const servicesStepIndex = entityStepsStart + totalEntitySteps;
  const individualDetailsStepIndex = servicesStepIndex + 1;
  const adviserDetailsStepIndex = individualDetailsStepIndex + 1;
  const reviewStepIndex = adviserDetailsStepIndex + 1;
  const confirmationStepIndex = reviewStepIndex + 1;
  const totalSteps = 7 + totalEntitySteps;

  const currentStepLabel = useMemo(() => {
    if (state.step === 0) return "Contact / group details";
    if (state.step === 1) return "Add entities";
    if (state.step >= entityStepsStart && state.step < servicesStepIndex) {
      const entityIndex = Math.floor((state.step - entityStepsStart) / entityStepsPerEntity);
      const subStep = (state.step - entityStepsStart) % entityStepsPerEntity;
      const labels = ["Entity type", "Portfolio & assets"];
      return `Entity ${entityIndex + 1} – ${labels[subStep]}`;
    }
    if (state.step === servicesStepIndex) return "Services & commencement";
    if (state.step === individualDetailsStepIndex) return "Individual details";
    if (state.step === adviserDetailsStepIndex) return "Adviser & administration";
    if (state.step === reviewStepIndex) return "Review and summary";
    return "Confirmation";
  }, [state.step, state.entityCount, servicesStepIndex, individualDetailsStepIndex, adviserDetailsStepIndex, reviewStepIndex]);

  const currentStepDescription = useMemo(() => {
    if (state.step === 0) return "Primary contact and group information.";
    if (state.step === 1) return "How many entities (e.g. trusts, companies) are included in this application.";
    if (state.step >= entityStepsStart && state.step < servicesStepIndex) {
      const subStep = (state.step - entityStepsStart) % entityStepsPerEntity;
      if (subStep === 0) return "Select the entity type for this application.";
      if (subStep === 1) return "Portfolio status and asset counts for complexity assessment.";
    }
    if (state.step === servicesStepIndex) return "Select services and preferred commencement date for the client group.";
    if (state.step === individualDetailsStepIndex) return "Personal details for individuals associated with the application.";
    if (state.step === adviserDetailsStepIndex) return "Investment adviser, administration and dividend preferences.";
    if (state.step === reviewStepIndex) return "Review your details before submitting.";
    return "Your application has been submitted.";
  }, [state.step, state.entityCount, servicesStepIndex, individualDetailsStepIndex, adviserDetailsStepIndex, reviewStepIndex, entityStepsStart, entityStepsPerEntity]);

  const setContact = useCallback((data: Partial<Pick<ApplicationFormState, "primaryContactName" | "email" | "phone" | "applicantRole" | "adviserDetails" | "groupName">>) => {
    setState((s) => ({ ...s, ...data, stepError: null, stepErrorField: null }));
  }, []);

  const setGroupServices = useCallback((data: Partial<Pick<ApplicationFormState, "groupCommencementDate" | "selectedAddOnServiceCodes" | "pafPuafServiceToggles" | "servicesComments">>) => {
    setState((s) => ({
      ...s,
      ...data,
      ...(data.pafPuafServiceToggles != null && {
        pafPuafServiceToggles: { ...s.pafPuafServiceToggles, ...data.pafPuafServiceToggles },
      }),
      stepError: null,
      stepErrorField: null,
    }));
  }, []);

  const setEntityCount = useCallback((count: number) => {
    const n = Math.max(MIN_ENTITIES, Math.min(MAX_ENTITIES, count));
    setState((s) => {
      const entities = [...s.entities];
      while (entities.length < n) entities.push(createEmptyEntity(crypto.randomUUID()));
      return { ...s, entityCount: n, entities: entities.slice(0, n), stepError: null, stepErrorField: null };
    });
  }, []);

  const setEntity = useCallback((index: number, data: Partial<PartialEntity>) => {
    setState((s) => {
      const entities = [...s.entities];
      const existing = index >= 0 && index < entities.length ? entities[index] : undefined;
      if (existing) {
        const next = { ...existing, ...data };
        entities[index] = { ...next, id: next.id ?? existing.id } as PartialEntity;
      }
      return { ...s, entities, stepError: null, stepErrorField: null };
    });
  }, []);

  const setIndividualCount = useCallback((count: number) => {
    const n = Math.max(MIN_INDIVIDUALS, Math.min(MAX_INDIVIDUALS, count));
    setState((s) => {
      const individuals = [...s.individuals];
      while (individuals.length < n) individuals.push(createEmptyIndividual(crypto.randomUUID()));
      return { ...s, individualCount: n, individuals: individuals.slice(0, n), stepError: null, stepErrorField: null };
    });
  }, []);

  const removeIndividualAt = useCallback((index: number) => {
    setState((s) => {
      if (s.individualCount <= MIN_INDIVIDUALS) return s;
      if (index < 0 || index >= s.individualCount) return s;
      const individuals = s.individuals.slice(0, s.individualCount).filter((_, i) => i !== index);
      return {
        ...s,
        individualCount: s.individualCount - 1,
        individuals,
        stepError: null,
        stepErrorField: null,
      };
    });
  }, []);

  const setIndividual = useCallback((index: number, data: Partial<PartialIndividual>) => {
    setState((s) => {
      const individuals = [...s.individuals];
      const existing = index >= 0 && index < individuals.length ? individuals[index] : undefined;
      if (existing) {
        const next = { ...existing, ...data };
        if (Array.isArray(next.relationshipRoles)) {
          // ensure no duplicates
          next.relationshipRoles = [...new Set(next.relationshipRoles)];
        }
        individuals[index] = { ...next, id: next.id ?? existing.id } as PartialIndividual;
      }
      return { ...s, individuals, stepError: null, stepErrorField: null };
    });
  }, []);

  const setAdviser = useCallback((data: Partial<Pick<ApplicationFormState, "hasInvestmentAdviser" | "adviserName" | "adviserCompany" | "adviserAddress" | "adviserTel" | "adviserFax" | "adviserEmail" | "nominateAdviserPrimaryContact" | "authoriseAdviserAccessStatements" | "authoriseDealWithAdviserDirect" | "annualReportSendTo" | "meetingProxySendTo" | "investmentOffersSendTo" | "dividendPreference">>) => {
    setState((s) => ({ ...s, ...data, stepError: null, stepErrorField: null }));
  }, []);

  const nextStep = useCallback(() => {
    const stepsPerEntity = 2;
    const entityStart = 2;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setState((s) => {
      if (s.step === 0) {
        if (!s.primaryContactName?.trim())
          return { ...s, stepError: "Please complete all required contact fields.", stepErrorField: "primaryContactName" };
        if (!s.email?.trim())
          return { ...s, stepError: "Please complete all required contact fields.", stepErrorField: "email" };
        if (!s.phone?.trim())
          return { ...s, stepError: "Please complete all required contact fields.", stepErrorField: "phone" };
        if (!s.applicantRole?.trim())
          return { ...s, stepError: "Please complete all required contact fields.", stepErrorField: "applicantRole" };
        if (!EMAIL_RE.test(s.email.trim()))
          return { ...s, stepError: "Please enter a valid email address.", stepErrorField: "email" };
        if (!/^\d{8,15}$/.test(s.phone))
          return { ...s, stepError: "Phone number must be 8–15 digits.", stepErrorField: "phone" };
      }
      if (s.step >= entityStart && s.step < entityStart + s.entityCount * stepsPerEntity) {
        const entityIndex = Math.floor((s.step - entityStart) / stepsPerEntity);
        const subStep = (s.step - entityStart) % stepsPerEntity;
        const entity = s.entities[entityIndex];
        const entityField = (f: string) => `entity_${entityIndex}_${f}`;
        if (!entity) return { ...s, stepError: "Invalid step.", stepErrorField: null };
        if (subStep === 0 && !entity.entityType)
          return { ...s, stepError: "Please select an entity type.", stepErrorField: entityField("entityType") };
        if (subStep === 1) {
          if (!entity.entityName?.trim())
            return { ...s, stepError: "Please complete entity name, TFN, and portfolio status.", stepErrorField: entityField("entityName") };
          if (!entity.portfolioStatus)
            return { ...s, stepError: "Please complete entity name, TFN, and portfolio status.", stepErrorField: entityField("portfolioStatus") };
          if (!entity.tfn?.trim())
            return { ...s, stepError: "Please complete entity name, TFN, and portfolio status.", stepErrorField: entityField("tfn") };
          if (!/^\d{8,9}$/.test(entity.tfn))
            return { ...s, stepError: "TFN must be 8 or 9 digits.", stepErrorField: entityField("tfn") };
          if (entity.abn?.trim() && !/^\d{11}$/.test(entity.abn))
            return { ...s, stepError: "ABN must be exactly 11 digits.", stepErrorField: entityField("abn") };
        }
      }
      const servicesStep = entityStart + s.entityCount * stepsPerEntity;
      if (s.step === servicesStep) {
        if (!s.groupCommencementDate?.trim())
          return { ...s, stepError: "Please enter preferred commencement date.", stepErrorField: "groupCommencementDate" };
      }
      const individualStep = servicesStep + 1;
      if (s.step === individualStep) {
        const individuals = s.individuals.slice(0, s.individualCount);
        const indField = (i: number, f: string) => `individual_${i}_${f}`;
        for (let i = 0; i < individuals.length; i++) {
          const ind = individuals[i];
          const n = i + 1;
          if (!ind) continue;
          if (!ind.relationshipRoles?.length)
            return { ...s, stepError: `Individual ${n}: please select at least one Relationship to Account.`, stepErrorField: indField(i, "relationshipRoles") };
          if (!ind.title?.trim()) return { ...s, stepError: `Individual ${n}: Title is required.`, stepErrorField: indField(i, "title") };
          if (!ind.fullName?.trim()) return { ...s, stepError: `Individual ${n}: Full name is required.`, stepErrorField: indField(i, "fullName") };
          if (!ind.streetAddress?.trim()) return { ...s, stepError: `Individual ${n}: Residential address is required.`, stepErrorField: indField(i, "streetAddress") };
          if (!ind.taxFileNumber?.trim()) return { ...s, stepError: `Individual ${n}: Tax File Number is required.`, stepErrorField: indField(i, "taxFileNumber") };
          if (!/^\d{8,9}$/.test(ind.taxFileNumber))
            return { ...s, stepError: `Individual ${n}: Tax File Number must be 8 or 9 digits.`, stepErrorField: indField(i, "taxFileNumber") };
          if (!ind.dateOfBirth?.trim()) return { ...s, stepError: `Individual ${n}: Date of birth is required.`, stepErrorField: indField(i, "dateOfBirth") };
          if (new Date(ind.dateOfBirth) > new Date())
            return { ...s, stepError: `Individual ${n}: Date of birth cannot be in the future.`, stepErrorField: indField(i, "dateOfBirth") };
          if (!ind.countryOfBirth?.trim()) return { ...s, stepError: `Individual ${n}: Country of birth is required.`, stepErrorField: indField(i, "countryOfBirth") };
          if (!ind.city?.trim()) return { ...s, stepError: `Individual ${n}: City of birth is required.`, stepErrorField: indField(i, "city") };
          if (!ind.occupation?.trim()) return { ...s, stepError: `Individual ${n}: Occupation is required.`, stepErrorField: indField(i, "occupation") };
          if (!ind.employer?.trim()) return { ...s, stepError: `Individual ${n}: Employer is required.`, stepErrorField: indField(i, "employer") };
          if (!ind.email?.trim()) return { ...s, stepError: `Individual ${n}: Email is required.`, stepErrorField: indField(i, "email") };
          if (!EMAIL_RE.test(ind.email.trim()))
            return { ...s, stepError: `Individual ${n}: Please enter a valid email address.`, stepErrorField: indField(i, "email") };
        }
      }
      const adviserStep = individualStep + 1;
      if (s.step === adviserStep) {
        const hasAdv = s.hasInvestmentAdviser === true;
        if (hasAdv) {
          if (!s.adviserName?.trim())
            return { ...s, stepError: "Adviser name is required.", stepErrorField: "adviserName" };
          if (!s.adviserCompany?.trim())
            return { ...s, stepError: "Adviser company is required.", stepErrorField: "adviserCompany" };
          if (!s.adviserAddress?.trim())
            return { ...s, stepError: "Adviser address is required.", stepErrorField: "adviserAddress" };
          if (!s.adviserTel?.trim())
            return { ...s, stepError: "Adviser phone number is required.", stepErrorField: "adviserTel" };
          if (!/^\d{8,15}$/.test(s.adviserTel.trim()))
            return { ...s, stepError: "Adviser phone must be 8–15 digits.", stepErrorField: "adviserTel" };
          if (!s.adviserEmail?.trim())
            return { ...s, stepError: "Adviser email is required.", stepErrorField: "adviserEmail" };
          if (!EMAIL_RE.test(s.adviserEmail.trim()))
            return { ...s, stepError: "Adviser email format is invalid.", stepErrorField: "adviserEmail" };
          if (s.nominateAdviserPrimaryContact !== true && s.nominateAdviserPrimaryContact !== false) {
            return {
              ...s,
              stepError: "Please answer whether you nominate your investment adviser as primary contact.",
              stepErrorField: "nominateAdviserPrimaryContact",
            };
          }
          if (s.authoriseAdviserAccessStatements !== true && s.authoriseAdviserAccessStatements !== false) {
            return {
              ...s,
              stepError: "Please answer whether you authorise your adviser to access statements online.",
              stepErrorField: "authoriseAdviserAccessStatements",
            };
          }
          if (s.authoriseDealWithAdviserDirect !== true && s.authoriseDealWithAdviserDirect !== false) {
            return {
              ...s,
              stepError: "Please answer whether you authorise us to deal with your adviser direct.",
              stepErrorField: "authoriseDealWithAdviserDirect",
            };
          }
        }
        if (!documentSendToIsComplete(s.annualReportSendTo)) {
          return {
            ...s,
            stepError: "Please select where to send annual reports (Individual, Adviser, or Not required).",
            stepErrorField: "annualReportSendTo",
          };
        }
        if (!documentSendToIsComplete(s.meetingProxySendTo)) {
          return {
            ...s,
            stepError: "Please select where to send meeting proxy documents (Individual, Adviser, or Not required).",
            stepErrorField: "meetingProxySendTo",
          };
        }
        if (!documentSendToIsComplete(s.investmentOffersSendTo)) {
          return {
            ...s,
            stepError: "Please select where to send investment offers (Individual, Adviser, or Not required).",
            stepErrorField: "investmentOffersSendTo",
          };
        }
        if (s.dividendPreference !== "cash" && s.dividendPreference !== "reinvest") {
          return {
            ...s,
            stepError: "Please choose whether to receive dividends in cash or re-invest.",
            stepErrorField: "dividendPreference",
          };
        }
      }
      const reviewStep = adviserStep + 1;
      return { ...s, step: Math.min(s.step + 1, reviewStep), stepError: null, stepErrorField: null };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1), stepError: null, stepErrorField: null }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((s) => {
      const entityStepsStart = 2;
      const totalEntitySteps = s.entityCount * 2;
      const servicesStep = entityStepsStart + totalEntitySteps;
      const individualStep = servicesStep + 1;
      const adviserStep = individualStep + 1;
      const reviewStep = adviserStep + 1;
      const maxStep = reviewStep - 1;
      const clamped = Math.max(0, Math.min(step, maxStep));
      return { ...s, step: clamped, stepError: null, stepErrorField: null };
    });
  }, []);

  const restart = useCallback(() => {
    setState({
      ...initialState,
      entities: [createEmptyEntity(crypto.randomUUID())],
      individuals: [createEmptyIndividual(crypto.randomUUID())],
    } as ApplicationFormState);
  }, []);

  const clearStepError = useCallback(() => {
    setState((s) => ({ ...s, stepError: null, stepErrorField: null }));
  }, []);

  const submit = useCallback(async () => {
    const payload = formStateToPayload(state);
    if (!payload) {
      setState((s) => ({ ...s, stepError: "Please complete all entity details." }));
      return;
    }
    const parsed = fullApplicationSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      setState((s) => ({ ...s, stepError: "Validation failed. Please check all required fields." }));
      return;
    }
    setState((s) => ({ ...s, isSubmitting: true, stepError: null }));
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      const entitiesSnapshot = state.entities.slice(0, state.entityCount);
      const portfolioEntities = entitiesSnapshot.filter(
        (e) => e.portfolioStatus === "existing_clean" && (e.existingPortfolioReportFiles?.length ?? 0) > 0,
      );

      if (portfolioEntities.length > 0 && data.applicationId) {
        const prepareRes = await fetch(`/api/applications/${data.applicationId}/portfolio/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploads: portfolioEntities.map((e) => ({
              entityFormId: e.id,
              files: (e.existingPortfolioReportFiles ?? []).map((f) => ({
                name: f.name,
                contentType: f.type || "application/octet-stream",
                size: f.size,
              })),
            })),
          }),
        });
        const prepareData = (await prepareRes.json()) as {
          slots?: {
            entityFormId: string;
            items: { path: string; token: string; originalName: string }[];
          }[];
          message?: string;
        };
        if (!prepareRes.ok) {
          throw new Error(
            prepareData.message ||
              "Application was saved but portfolio files could not be uploaded. Please contact us with your reference number.",
          );
        }
        const slots = prepareData.slots ?? [];
        await uploadPreparedPortfolioFiles(slots, entitiesSnapshot);

        const documentsPayload: {
          entityFormId: string;
          files: { path: string; originalName: string; sizeBytes: number; contentType: string }[];
        }[] = [];
        for (const slot of slots) {
          const entity = entitiesSnapshot.find((x) => x.id === slot.entityFormId);
          const files = entity?.existingPortfolioReportFiles ?? [];
          const fileRows: {
            path: string;
            originalName: string;
            sizeBytes: number;
            contentType: string;
          }[] = [];
          for (let j = 0; j < slot.items.length; j++) {
            const item = slot.items[j];
            const file = files[j];
            if (!item || !file) {
              throw new Error("Portfolio file mismatch.");
            }
            fileRows.push({
              path: item.path,
              originalName: item.originalName,
              sizeBytes: file.size,
              contentType: file.type || "application/octet-stream",
            });
          }
          documentsPayload.push({ entityFormId: slot.entityFormId, files: fileRows });
        }

        const finalizeRes = await fetch(`/api/applications/${data.applicationId}/portfolio/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents: documentsPayload }),
        });
        const finalizeData = (await finalizeRes.json()) as { message?: string };
        if (!finalizeRes.ok) {
          throw new Error(
            finalizeData.message ||
              "Files uploaded but metadata could not be saved. Please contact us with your reference number.",
          );
        }
      }

      setState((s) => ({
        ...s,
        isSubmitting: false,
        step: s.step + 1,
        submitResult: {
          applicationId: data.applicationId,
          reference: data.reference ?? null,
          submissionSuccess: data.submissionSuccess,
          overallOutcome: data.overallOutcome,
          indicativePricingAvailable: data.indicativePricingAvailable,
          pgEstimatedTotals: data.pgEstimatedTotals ?? data.pgEstimatedTotals,
          requiresJmFollowUp: data.requiresJmFollowUp,
          requiresManualReview: data.requiresManualReview,
          entityAssessments: data.entityAssessments,
        },
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isSubmitting: false,
        stepError: err instanceof Error ? err.message : "Submission failed. Please try again.",
      }));
    }
  }, [state]);

  const value: ApplicationFormContextValue = useMemo(
    () => ({
      state,
      totalSteps,
      reviewStepIndex,
      confirmationStepIndex,
      currentStepLabel,
      currentStepDescription,
      setContact,
      setGroupServices,
      setEntityCount,
      setEntity,
      setIndividual,
      setIndividualCount,
      removeIndividualAt,
      setAdviser,
      servicesStepIndex,
      individualDetailsStepIndex,
      adviserDetailsStepIndex,
      nextStep,
      prevStep,
      goToStep,
      restart,
      submit,
      clearStepError,
    }),
    [state, totalSteps, reviewStepIndex, confirmationStepIndex, currentStepLabel, currentStepDescription, setContact, setGroupServices, setEntityCount, setEntity, setIndividual, setIndividualCount, removeIndividualAt, setAdviser, servicesStepIndex, individualDetailsStepIndex, adviserDetailsStepIndex, nextStep, prevStep, goToStep, restart, submit, clearStepError],
  );

  return (
    <ApplicationFormContext.Provider value={value}>
      {children}
    </ApplicationFormContext.Provider>
  );
}

export function useApplicationForm() {
  const ctx = React.useContext(ApplicationFormContext);
  if (!ctx) throw new Error("useApplicationForm must be used within ApplicationFormProvider");
  return ctx;
}
