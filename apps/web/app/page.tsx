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
          Client Application Form
        </h1>

        {/* Intro */}
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Welcome to PortfolioGuardian&apos;s client application portal. This form is how you tell us
          about the investment structures you wish to include and the portfolio administration and
          reporting services you are seeking. We use your answers to assess suitability and plan next steps.
        </p>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Structures may include trusts, companies, self managed super funds, individuals, private
          ancillary funds, or public ancillary funds. Work that needs specialised compliance or is
          outside our standard services may be referred to our parent company - Jaquillard Minns.
        </p>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Please have the following ready before you start.
        </p>

        {/* Pre-application checklist */}
        <ul className="mt-4 list-inside list-disc space-y-1 text-xs leading-snug text-slate-600">
          <li>Primary contact details: full name, email address, and phone number</li>
          <li>How many entities you wish to onboard and the type of each (trust, company, individual etc.)</li>
          <li>For each entity: legal name, ABN, TFN, new or existing portfolio, estimated number of assets</li>
          <li>Personal details (name, date of birth, TFN etc.) for each individual linked to the application</li>
          <li>Your investment adviser&apos;s name and contact details, if you work with an adviser</li>
        </ul>

        {/* Security box */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50/80 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
            <div>
              <h2 className="text-xs font-semibold text-blue-900">Security and privacy</h2>
              <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                Your information is protected with strong encryption and handled under strict privacy
                standards. Data you provide is treated as confidential and managed in line with
                Australian financial services and privacy requirements.
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
          <p className="mt-3 text-xs text-slate-500">Typical completion time: 10 to 15 minutes</p>
          <div className="mt-8 flex flex-col items-center px-2">
            <Image
              src="/pg-jm-logo.png"
              alt="Jaquillard Minns and PortfolioGuardian lockup"
              width={364}
              height={112}
              className="h-auto w-full max-w-[358px] object-contain"
            />
            <p className="mt-3 text-xs text-slate-500">PortfolioGuardian is a Jaquillard Minns Business</p>
          </div>
        </div>
      </div>
    </main>
  );
}
