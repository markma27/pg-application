export default function AdminLoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#e4e6ec] font-[family-name:var(--font-montserrat)]">
      {children}
    </div>
  );
}
