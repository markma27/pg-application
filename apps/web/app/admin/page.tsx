import { Card } from "@/components/ui/card";

const cards = [
  { label: "New applications", value: "0" },
  { label: "PG review queue", value: "0" },
  { label: "JM referral queue", value: "0" },
  { label: "Manual review", value: "0" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Initial admin shell aligned with the PRD header, sidebar, and card-based content area.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-slate-900">Recent submissions</h3>
        <p className="mt-3 text-sm text-slate-600">
          Data wiring will be connected once Supabase persistence and admin queries are added.
        </p>
      </Card>
    </div>
  );
}
