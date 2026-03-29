import { NextResponse } from "next/server";
import { mergePricingModelWithDefaults } from "@pg/shared";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { parsePricingModelJson } from "@/lib/pricing-calculator/model-serialization";

/**
 * Public read of the shared calculator model (used by /pricing-calculator without auth).
 * Writes go through the server action (active portal users only).
 */
export async function GET() {
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      { model: mergePricingModelWithDefaults({}) },
      { status: 200 },
    );
  }

  const { data, error } = await supabase
    .from("pricing_calculator_settings")
    .select("model_json")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ model: mergePricingModelWithDefaults({}) });
  }

  const parsed = parsePricingModelJson(data.model_json);
  return NextResponse.json({
    model: parsed ?? mergePricingModelWithDefaults({}),
  });
}
