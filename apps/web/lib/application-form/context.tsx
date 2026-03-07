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
  submitResult: null,
  isSubmitting: false,
  stepError: null,
};

type ApplicationFormContextValue = {
  state: ApplicationFormState;
  totalSteps: number;
  currentStepLabel: string;
  setContact: (data: Partial<Pick<ApplicationFormState, "primaryContactName" | "email" | "phone" | "applicantRole" | "adviserDetails" | "groupName">>) => void;
  setEntityCount: (count: number) => void;
  setEntity: (index: number, data: Partial<PartialEntity>) => void;
  nextStep: () => void;
  prevStep: () => void;
  restart: () => void;
  submit: () => Promise<void>;
  clearStepError: () => void;
};

const ApplicationFormContext = React.createContext<ApplicationFormContextValue | null>(null);

export function ApplicationFormProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ApplicationFormState>(initialState);

  const totalSteps = 4 + state.entityCount;
  const currentStepLabel = useMemo(() => {
    if (state.step === 0) return "Contact / group details";
    if (state.step === 1) return "Add entities";
    if (state.step >= 2 && state.step < 2 + state.entityCount) return `Entity ${state.step - 1} details`;
    if (state.step === 2 + state.entityCount) return "Review and summary";
    return "Confirmation";
  }, [state.step, state.entityCount]);

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

  const nextStep = useCallback(() => {
    setState((s) => {
      if (s.step === 0) {
        if (!s.primaryContactName?.trim() || !s.email?.trim() || !s.phone?.trim() || !s.applicantRole?.trim())
          return { ...s, stepError: "Please complete all required contact fields." };
      }
      if (s.step >= 2 && s.step < 2 + s.entityCount) {
        const entity = s.entities[s.step - 2];
        if (!entity?.entityType || !entity.entityName?.trim() || !entity.portfolioStatus || entity.serviceCodes.length === 0 || !entity.commencementDate?.trim())
          return { ...s, stepError: "Please complete all required fields for this entity." };
      }
      return { ...s, step: Math.min(s.step + 1, 4 + s.entityCount - 1), stepError: null };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1), stepError: null }));
  }, []);

  const restart = useCallback(() => {
    setState({
      ...initialState,
      entities: [createEmptyEntity(crypto.randomUUID())],
    });
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
      currentStepLabel,
      setContact,
      setEntityCount,
      setEntity,
      nextStep,
      prevStep,
      restart,
      submit,
      clearStepError,
    }),
    [state, totalSteps, currentStepLabel, setContact, setEntityCount, setEntity, nextStep, prevStep, restart, submit, clearStepError],
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
