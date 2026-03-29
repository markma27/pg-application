import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PortfolioGuardian - Application Admin Portal",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
