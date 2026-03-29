"use client";

import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NATIVE_SELECT_CLASS } from "@/lib/native-select-styles";

export function PricingNativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select className={cn(NATIVE_SELECT_CLASS, className)} {...props} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}
