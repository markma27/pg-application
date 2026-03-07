"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const landingCtaSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  name: z.string().min(1, "Name is required"),
});

type LandingCtaValues = z.infer<typeof landingCtaSchema>;

export function LandingCtaForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LandingCtaValues>({
    resolver: zodResolver(landingCtaSchema),
    defaultValues: { email: "", name: "" },
  });

  function onSubmit(values: LandingCtaValues) {
    // Placeholder: wire to API or mailto later
    console.log("Landing CTA submitted", values);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="landing-name">Name</Label>
        <Input
          id="landing-name"
          placeholder="Your name"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="landing-email">Email</Label>
        <Input
          id="landing-email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full">
        Send message
      </Button>
    </form>
  );
}
