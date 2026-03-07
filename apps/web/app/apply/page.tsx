"use client";

import { ApplicationFormProvider, useApplicationForm } from "@/lib/application-form";
import { ApplyShell } from "@/components/application-form/apply-shell";
import { StepNav } from "@/components/application-form/step-nav";
import { ContactStep } from "@/components/application-form/steps/contact-step";
import { EntityCountStep } from "@/components/application-form/steps/entity-count-step";
import { EntityDetailStep } from "@/components/application-form/steps/entity-detail-step";
import { ReviewStep } from "@/components/application-form/steps/review-step";
import { ConfirmationStep } from "@/components/application-form/steps/confirmation-step";

function ApplyFormContent() {
  const { state } = useApplicationForm();
  const isConfirmation = state.step >= 3 + state.entityCount;

  return (
    <ApplyShell>
      {state.step === 0 && <ContactStep />}
      {state.step === 1 && <EntityCountStep />}
      {state.step >= 2 && state.step < 2 + state.entityCount && <EntityDetailStep />}
      {state.step === 2 + state.entityCount && <ReviewStep />}
      {isConfirmation && <ConfirmationStep />}
      {!isConfirmation && <StepNav />}
    </ApplyShell>
  );
}

export default function ApplyPage() {
  return (
    <ApplicationFormProvider>
      <ApplyFormContent />
    </ApplicationFormProvider>
  );
}
