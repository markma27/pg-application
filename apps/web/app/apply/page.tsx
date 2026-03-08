"use client";

import { ApplicationFormProvider, useApplicationForm } from "@/lib/application-form";
import { ApplyShell } from "@/components/application-form/apply-shell";
import { ContactStep } from "@/components/application-form/steps/contact-step";
import { EntityCountStep } from "@/components/application-form/steps/entity-count-step";
import { EntityDetailStepType } from "@/components/application-form/steps/entity-detail-step-type";
import { EntityDetailStepBasics } from "@/components/application-form/steps/entity-detail-step-basics";
import { ServicesCommencementStep } from "@/components/application-form/steps/services-commencement-step";
import { IndividualDetailsStep } from "@/components/application-form/steps/individual-details-step";
import { AdviserDetailsStep } from "@/components/application-form/steps/adviser-details-step";
import { ReviewStep } from "@/components/application-form/steps/review-step";
import { ConfirmationStep } from "@/components/application-form/steps/confirmation-step";

const ENTITY_STEPS_START = 2;
const ENTITY_STEPS_PER_ENTITY = 2;

function ApplyFormContent() {
  const {
    state,
    reviewStepIndex,
    confirmationStepIndex,
    servicesStepIndex,
    individualDetailsStepIndex,
    adviserDetailsStepIndex,
  } = useApplicationForm();
  const isEntityStep = state.step >= ENTITY_STEPS_START && state.step < servicesStepIndex;
  const entityIndex = isEntityStep ? Math.floor((state.step - ENTITY_STEPS_START) / ENTITY_STEPS_PER_ENTITY) : 0;
  const entitySubStep = isEntityStep ? (state.step - ENTITY_STEPS_START) % ENTITY_STEPS_PER_ENTITY : 0;

  return (
    <ApplyShell>
      {state.step === 0 && <ContactStep />}
      {state.step === 1 && <EntityCountStep />}
      {isEntityStep && entitySubStep === 0 && <EntityDetailStepType entityIndex={entityIndex} />}
      {isEntityStep && entitySubStep === 1 && <EntityDetailStepBasics entityIndex={entityIndex} />}
      {state.step === servicesStepIndex && <ServicesCommencementStep />}
      {state.step === individualDetailsStepIndex && <IndividualDetailsStep />}
      {state.step === adviserDetailsStepIndex && <AdviserDetailsStep />}
      {state.step === reviewStepIndex && <ReviewStep />}
      {state.step >= confirmationStepIndex && <ConfirmationStep />}
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
