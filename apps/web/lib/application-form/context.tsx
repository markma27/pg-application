"use client";

import React, { useCallback, useMemo, useState } from "react";
import { applicationInputSchema } from "@pg/shared";
import type { ApplicationFormState, PartialEntity, PartialIndividual, SubmitResult } from "./types";
import { formStateToPayload } from "./types";
import { MIN_ENTITIES, MAX_ENTITIES, MIN_INDIVIDUALS, MAX_INDIVIDUALS } from "./constants";

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
};

type ApplicationFormContextValue = {
  state: ApplicationFormState;
  totalSteps: number;
  reviewStepIndex: number;
  confirmationStepIndex: number;
  currentStepLabel: string;
  currentStepDescription: string;
  setContact: (data: Partial<Pick<ApplicationFormState, "primaryContactName" | "email" | "phone" | "applicantRole" | "adviserDetails" | "groupName">>) => void;
  setEntityCount: (count: number) => void;
  setEntity: (index: number, data: Partial<PartialEntity>) => void;
  setIndividual: (index: number, data: Partial<PartialIndividual>) => void;
  setIndividualCount: (count: number) => void;
  setAdviser: (data: Partial<Pick<ApplicationFormState, "adviserName" | "adviserCompany" | "adviserAddress" | "adviserTel" | "adviserFax" | "adviserEmail" | "nominateAdviserPrimaryContact" | "authoriseAdviserAccessStatements" | "authoriseDealWithAdviserDirect" | "annualReportSendTo" | "meetingProxySendTo" | "investmentOffersSendTo" | "dividendPreference">>) => void;
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
  const entityStepsPerEntity = 3;
  const totalEntitySteps = state.entityCount * entityStepsPerEntity;
  const individualDetailsStepIndex = entityStepsStart + totalEntitySteps;
  const adviserDetailsStepIndex = individualDetailsStepIndex + 1;
  const reviewStepIndex = adviserDetailsStepIndex + 1;
  const confirmationStepIndex = reviewStepIndex + 1;
  const totalSteps = 6 + totalEntitySteps;

  const currentStepLabel = useMemo(() => {
    if (state.step === 0) return "Contact / group details";
    if (state.step === 1) return "Add entities";
    if (state.step >= entityStepsStart && state.step < individualDetailsStepIndex) {
      const entityIndex = Math.floor((state.step - entityStepsStart) / entityStepsPerEntity);
      const subStep = (state.step - entityStepsStart) % entityStepsPerEntity;
      const labels = ["Entity type", "Portfolio & assets", "Services & commencement"];
      return `Entity ${entityIndex + 1} – ${labels[subStep]}`;
    }
    if (state.step === individualDetailsStepIndex) return "Individual details";
    if (state.step === adviserDetailsStepIndex) return "Adviser & administration";
    if (state.step === reviewStepIndex) return "Review and summary";
    return "Confirmation";
  }, [state.step, state.entityCount, individualDetailsStepIndex, adviserDetailsStepIndex, reviewStepIndex]);

  const currentStepDescription = useMemo(() => {
    if (state.step === 0) return "Primary contact and group information.";
    if (state.step === 1) return "How many entities (e.g. trusts, companies) are included in this application.";
    if (state.step >= entityStepsStart && state.step < individualDetailsStepIndex) {
      const subStep = (state.step - entityStepsStart) % entityStepsPerEntity;
      if (subStep === 0) return "Select the entity type for this application.";
      if (subStep === 1) return "Portfolio status and asset counts for complexity assessment.";
      return "Select services and preferred commencement date.";
    }
    if (state.step === individualDetailsStepIndex) return "Personal details for individuals associated with the application.";
    if (state.step === adviserDetailsStepIndex) return "Investment adviser, administration and dividend preferences.";
    if (state.step === reviewStepIndex) return "Review your details before submitting.";
    return "Your application has been submitted.";
  }, [state.step, state.entityCount, individualDetailsStepIndex, adviserDetailsStepIndex, reviewStepIndex, entityStepsStart, entityStepsPerEntity]);

  const setContact = useCallback((data: Partial<Pick<ApplicationFormState, "primaryContactName" | "email" | "phone" | "applicantRole" | "adviserDetails" | "groupName">>) => {
    setState((s) => ({ ...s, ...data, stepError: null }));
  }, []);

  const setEntityCount = useCallback((count: number) => {
    const n = Math.max(MIN_ENTITIES, Math.min(MAX_ENTITIES, count));
    setState((s) => {
      const entities = [...s.entities];
      while (entities.length < n) entities.push(createEmptyEntity(crypto.randomUUID()));
      return { ...s, entityCount: n, entities: entities.slice(0, n), stepError: null };
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
      return { ...s, entities, stepError: null };
    });
  }, []);

  const setIndividualCount = useCallback((count: number) => {
    const n = Math.max(MIN_INDIVIDUALS, Math.min(MAX_INDIVIDUALS, count));
    setState((s) => {
      const individuals = [...s.individuals];
      while (individuals.length < n) individuals.push(createEmptyIndividual(crypto.randomUUID()));
      return { ...s, individualCount: n, individuals: individuals.slice(0, n), stepError: null };
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
      return { ...s, individuals, stepError: null };
    });
  }, []);

  const setAdviser = useCallback((data: Partial<Pick<ApplicationFormState, "adviserName" | "adviserCompany" | "adviserAddress" | "adviserTel" | "adviserFax" | "adviserEmail" | "nominateAdviserPrimaryContact" | "authoriseAdviserAccessStatements" | "authoriseDealWithAdviserDirect" | "annualReportSendTo" | "meetingProxySendTo" | "investmentOffersSendTo" | "dividendPreference">>) => {
    setState((s) => ({ ...s, ...data, stepError: null }));
  }, []);

  const nextStep = useCallback(() => {
    const stepsPerEntity = 3;
    const entityStart = 2;
    setState((s) => {
      if (s.step === 0) {
        if (!s.primaryContactName?.trim() || !s.email?.trim() || !s.phone?.trim() || !s.applicantRole?.trim())
          return { ...s, stepError: "Please complete all required contact fields." };
      }
      if (s.step >= entityStart && s.step < entityStart + s.entityCount * stepsPerEntity) {
        const entityIndex = Math.floor((s.step - entityStart) / stepsPerEntity);
        const subStep = (s.step - entityStart) % stepsPerEntity;
        const entity = s.entities[entityIndex];
        if (!entity) return { ...s, stepError: "Invalid step." };
        if (subStep === 0 && !entity.entityType)
          return { ...s, stepError: "Please select an entity type." };
        if (subStep === 1 && (!entity.entityName?.trim() || !entity.portfolioStatus))
          return { ...s, stepError: "Please complete entity name and portfolio status." };
        if (subStep === 2 && (entity.serviceCodes.length === 0 || !entity.commencementDate?.trim()))
          return { ...s, stepError: "Please select at least one service and enter preferred commencement." };
      }
      const individualStep = entityStart + s.entityCount * stepsPerEntity;
      if (s.step === individualStep) {
        const individuals = s.individuals.slice(0, s.individualCount);
        for (let i = 0; i < individuals.length; i++) {
          const ind = individuals[i];
          const n = i + 1;
          if (!ind) continue;
          if (!ind.relationshipRoles?.length)
            return { ...s, stepError: `Individual ${n}: please select at least one Relationship to Account.` };
          if (!ind.title?.trim()) return { ...s, stepError: `Individual ${n}: Title is required.` };
          if (!ind.fullName?.trim()) return { ...s, stepError: `Individual ${n}: Full name is required.` };
          if (!ind.streetAddress?.trim()) return { ...s, stepError: `Individual ${n}: Street address is required.` };
          if (!ind.taxFileNumber?.trim()) return { ...s, stepError: `Individual ${n}: Tax File Number is required.` };
          if (!ind.dateOfBirth?.trim()) return { ...s, stepError: `Individual ${n}: Date of birth is required.` };
          if (!ind.countryOfBirth?.trim()) return { ...s, stepError: `Individual ${n}: Country of birth is required.` };
          if (!ind.city?.trim()) return { ...s, stepError: `Individual ${n}: City of birth is required.` };
          if (!ind.occupation?.trim()) return { ...s, stepError: `Individual ${n}: Occupation is required.` };
          if (!ind.employer?.trim()) return { ...s, stepError: `Individual ${n}: Employer is required.` };
          if (!ind.email?.trim()) return { ...s, stepError: `Individual ${n}: Email is required.` };
        }
      }
      const reviewStep = individualStep + 2;
      return { ...s, step: Math.min(s.step + 1, reviewStep), stepError: null };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1), stepError: null }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((s) => {
      const entityStepsStart = 2;
      const totalEntitySteps = s.entityCount * 3;
      const individualStep = entityStepsStart + totalEntitySteps;
      const adviserStep = individualStep + 1;
      const reviewStep = adviserStep + 1;
      const maxStep = reviewStep - 1;
      const clamped = Math.max(0, Math.min(step, maxStep));
      return { ...s, step: clamped, stepError: null };
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
    setState((s) => ({ ...s, stepError: null }));
  }, []);

  const submit = useCallback(async () => {
    const payload = formStateToPayload(state);
    if (!payload) {
      setState((s) => ({ ...s, stepError: "Please complete all entity details." }));
      return;
    }
    const parsed = applicationInputSchema.safeParse(payload);
    if (!parsed.success) {
      setState((s) => ({ ...s, stepError: "Validation failed. Please check all required fields." }));
      return;
    }
    setState((s) => ({ ...s, isSubmitting: true, stepError: null }));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    try {
      const res = await fetch(`${apiUrl}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setState((s) => ({
        ...s,
        isSubmitting: false,
        step: s.step + 1,
        submitResult: {
          applicationId: data.applicationId,
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
      setEntityCount,
      setEntity,
      setIndividual,
      setIndividualCount,
      setAdviser,
      individualDetailsStepIndex,
      adviserDetailsStepIndex,
      nextStep,
      prevStep,
      goToStep,
      restart,
      submit,
      clearStepError,
    }),
    [state, totalSteps, reviewStepIndex, confirmationStepIndex, currentStepLabel, currentStepDescription, setContact, setEntityCount, setEntity, setIndividual, setIndividualCount, setAdviser, individualDetailsStepIndex, adviserDetailsStepIndex, nextStep, prevStep, goToStep, restart, submit, clearStepError],
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
