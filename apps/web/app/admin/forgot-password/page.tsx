import Image from "next/image";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </div>
  );
}
