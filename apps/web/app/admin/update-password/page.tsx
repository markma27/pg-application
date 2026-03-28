import Image from "next/image";
import Link from "next/link";
import { UpdatePasswordForm } from "./update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f9] px-4 py-12">
      <div className="mb-8 flex justify-center">
        <div className="relative h-[5.5rem] w-[17.5rem]">
          <Image
            src="/PortfolioGuardian_OriginalLogo.svg"
            alt="PortfolioGuardian"
            fill
            className="object-contain object-center"
            priority
          />
        </div>
      </div>
      <div className="w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-center text-xl font-bold tracking-tight text-[#0c2742]">Set new password</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Choose a password for your admin portal account.</p>
        <UpdatePasswordForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/admin/login" className="font-medium text-[#1e4a7a] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
