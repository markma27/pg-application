import type { Metadata } from "next";
import "./globals.css";
import { Poppins, Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import { AdminDarkModeReset } from "@/components/admin-dark-mode-reset";
import { PageTransition } from "@/components/page-transition";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "PortfolioGuardian - Application",
  description: "PortfolioGuardian application and internal admin portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.variable, montserrat.variable, "bg-slate-100")}>
      <body className="min-h-screen bg-slate-100 antialiased">
        <AdminDarkModeReset />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
