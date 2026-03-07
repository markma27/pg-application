import Image from "next/image";
import Link from "next/link";
import { LandingCtaForm } from "@/components/landing-cta-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12 md:py-16">
      {/* Logo and hero */}
      <header className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
        <div className="relative h-12 w-full max-w-[280px] md:h-14 md:max-w-[320px]">
          <Image
            src="/PortfolioGuardian_OriginalLogo.svg"
            alt="PortfolioGuardian"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/apply"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Start application
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Admin portal
          </Link>
        </div>
      </header>

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[1.2fr_0.8fr] md:gap-12">
        <section className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Standardised portfolio administration starts with clear triage.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              One application can capture multiple entities. Each is assessed
              separately for fit and indicative pricing. PG handles standard
              administration and reporting; tailored or compliance-heavy work
              is routed to Jaquillard Minns.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <li>One application, one or many entities</li>
            <li>Per-entity indicative pricing where eligible</li>
            <li>Clear PG vs JM routing</li>
            <li>Guided multi-step form</li>
          </ul>
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PRD-aligned scope</CardTitle>
              <CardDescription>
                What stays in PortfolioGuardian and what is referred to JM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>PG: standard investment administration and reporting.</p>
              <p>JM: PAF/PuAF, customised reporting, broader compliance and accounting.</p>
            </CardContent>
            <CardFooter>
              <Link
                href="/apply"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-secondary px-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Begin application
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get in touch</CardTitle>
              <CardDescription>
                Questions before you apply? We’ll get back to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LandingCtaForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
