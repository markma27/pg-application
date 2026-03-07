"use client";

import React, { useCallback, useMemo, useState } from "react";
import { applicationInputSchema } from "@pg/shared";
import type { ApplicationFormState, PartialEntity, SubmitResult } from "./types";
import { formStateToPayload } from "./types";
import { MIN_ENTITIES, MAX_ENTITIES } from "./constants";

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
  setAdviser: (data: Partial<Pick<ApplicationFormState, "adviserName" | "adviserCompany" | "adviserAddress" | "adviserTel" | "adviserFax" | "adviserEmail" | "nominateAdviserPrimaryContact" | "authoriseAdviserAccessStatements" | "authoriseDealWithAdviserDirect" | "annualReportSendTo" | "meetingProxySendTo" | "investmentOffersSendTo" | "dividendPreference">>) => void;
  adviserDetailsStepIndex: number;
  nextStep: () => void;
  prevStep: () => void;
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
  const adviserDetailsStepIndex = entityStepsStart + totalEntitySteps;
  const reviewStepIndex = adviserDetailsStepIndex + 1;
  const confirmationStepIndex = reviewStepIndex + 1;
  const totalSteps = 5 + totalEntitySteps;

  const currentStepLabel = useMemo(() => {
    if (state.step === 0) return "Contact / group details";
    if (state.step === 1) return "Add entities";
    if (state.step >= entityStepsStart && state.step < adviserDetailsStepIndex) {
      const entityIndex = Math.floor((state.step - entityStepsStart) / entityStepsPerEntity);
      const subStep = (state.step - entityStepsStart) % entityStepsPerEntity;
      const labels = ["Entity type", "Portfolio & assets", "Services & commencement"];
      return `Entity ${entityIndex + 1} – ${labels[subStep]}`;
    }
    if (state.step === adviserDetailsStepIndex) return "Adviser & administration";
    if (state.step === reviewStepIndex) return "Review and summary";
    return "Confirmation";
  }, [state.step, state.entityCount, adviserDetailsStepIndex, reviewStepIndex]);

  const currentStepDescription = useMemo(() => {
    if (state.step === 0) return "Primary contact and optional group or adviser information.";
    if (state.step === 1) return "How many entities (e.g. trusts, companies) are included in this application.";
    if (state.step >= entityStepsStart && state.step < adviserDetailsStepIndex) {
      const subStep = (state.step - entityStepsStart) % entityStepsPerEntity;
      if (subStep === 0) return "Select the entity type for this application.";
      if (subStep === 1) return "Portfolio status and asset counts for complexity assessment.";
      return "Select services and preferred commencement date.";
    }
    if (state.step === adviserDetailsStepIndex) return "Investment adviser, administration and dividend preferences.";
    if (state.step === reviewStepIndex) return "Review your details before submitting.";
    return "Your application has been submitted.";
  }, [state.step, state.entityCount, adviserDetailsStepIndex, reviewStepIndex, entityStepsStart, entityStepsPerEntity]);

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
      const reviewStep = entityStart + s.entityCount * stepsPerEntity + 1;
      return { ...s, step: Math.min(s.step + 1, reviewStep), stepError: null };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1), stepError: null }));
  }, []);

  const restart = useCallback(() => {
    setState({
      ...initialState,
      entities: [createEmptyEntity(crypto.randomUUID())],
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
      setAdviser,
      adviserDetailsStepIndex,
      nextStep,
      prevStep,
      restart,
      submit,
      clearStepError,
    }),
    [state, totalSteps, reviewStepIndex, confirmationStepIndex, currentStepLabel, currentStepDescription, setContact, setEntityCount, setEntity, setAdviser, adviserDetailsStepIndex, nextStep, prevStep, restart, submit, clearStepError],
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
