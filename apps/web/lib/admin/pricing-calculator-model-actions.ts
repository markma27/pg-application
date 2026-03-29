"use server";

import { mergePricingModelWithDefaults, type PricingModel } from "@pg/shared";
import { createClient } from "@/lib/supabase/server";
import { stringifyPricingModel } from "@/lib/pricing-calculator/model-serialization";

async function requireActivePortalUser(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Server not configured." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }
  const { data: row, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !row) {
    return { ok: false, error: "Unauthorized." };
  }
  return { ok: true, userId: user.id };
}

/** Persists the calculator model for all portal users (RLS: active admin_users). */
export async function savePricingCalculatorModel(
  model: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireActivePortalUser();
  if (!gate.ok) {
    return gate;
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Server not configured." };
  }

  const normalized = mergePricingModelWithDefaults(model);
  const model_json = stringifyPricingModel(normalized);
  const now = new Date().toISOString();

  const { error } = await supabase.from("pricing_calculator_settings").upsert(
    {
      id: 1,
      model_json,
      updated_at: now,
      updated_by: gate.userId,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, error: "Could not save pricing model." };
  }

  return { ok: true };
}
