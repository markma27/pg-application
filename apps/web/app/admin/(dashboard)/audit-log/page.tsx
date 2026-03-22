export default function AdminAuditLogPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <h2 className="text-lg font-semibold text-[#0c2742]">Audit log</h2>
      <p className="mt-2 text-sm text-slate-600">
        The <code>audit_log</code> table is ready in SQL; list and filters can be added here.
      </p>
    </div>
  );
}
