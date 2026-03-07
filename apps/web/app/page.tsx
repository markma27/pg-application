import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto mt-10 max-w-2xl rounded-xl bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm sm:p-8 md:mt-14 lg:p-10">
        {/* Logo */}
        <Link href="/" className="mx-auto flex cursor-pointer justify-center">
          <div className="relative h-[6.3rem] w-[20.16rem] sm:h-[7.56rem] sm:w-[25.2rem]">
            <Image
              src="/PortfolioGuardian_OriginalLogo.svg"
              alt="PortfolioGuardian"
              fill
              className="object-contain object-center"
              priority
            />
          </div>
        </Link>
        {/* Main title */}
        <h1 className="mt-8 text-center text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          Let&apos;s get started
        </h1>

        {/* Intro */}
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Welcome to PortfolioGuardian&apos;s application portal. Use this form to tell us about your
          investment entities—trusts, companies, SMSFs, individuals—and the services you need. We
          assess each entity for fit and give indicative pricing where we can; anything that needs
          tailored or compliance-heavy work is referred to our partners at Jaquillard Minns.
        </p>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Have the following information ready before you begin:
        </p>

        {/* Pre-application checklist */}
        <ul className="mt-4 list-inside list-disc space-y-1 text-xs leading-snug text-slate-600">
          <li>Your contact details (name, email, phone)</li>
          <li>How many entities you want to include and their types (e.g. trust, company, SMSF)</li>
          <li>For each entity: name, portfolio status (new or existing), and basic asset and service details</li>
          <li>Personal details for each individual (e.g. trustees, directors) linked to the application</li>
          <li>Your investment adviser&apos;s details, if you have one</li>
        </ul>

        {/* Security box */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50/80 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
            <div>
              <h2 className="text-xs font-semibold text-blue-900">Enterprise-level security</h2>
              <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                Your information is protected with enterprise-level encryption and strict privacy
                compliance. Data is secure, confidential, and handled in line with Australian
                financial services and privacy regulations.
              </p>
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/apply"
            className="inline-flex h-12 w-full max-w-sm cursor-pointer items-center justify-center rounded-lg bg-emerald-700 px-6 text-sm font-medium !text-white shadow-sm transition-colors hover:bg-emerald-800 hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Start application
          </Link>
          <p className="mt-3 text-xs text-slate-500">Typical completion time: 10–15 minutes</p>
        </div>
      </div>
    </main>
  );
}
