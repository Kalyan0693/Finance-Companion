import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, StatCard, Card } from "@/components/app/ui";
import { formatCurrency, monthRange } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { start, end } = monthRange();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id, start],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: tx }, { data: buckets }] = await Promise.all([
        supabase.from("transactions").select("*").gte("transaction_date", start).lte("transaction_date", end),
        supabase.from("buckets").select("*").eq("is_active", true),
      ]);
      return { tx: tx ?? [], buckets: buckets ?? [] };
    },
  });

  const tx = data?.tx ?? [];
  const buckets = data?.buckets ?? [];
  const expenses = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const budget = buckets.reduce((s, b) => s + Number(b.monthly_budget), 0);

  const byDay: Record<string, number> = {};
  tx.filter((t) => t.type === "expense").forEach((t) => {
    const d = t.transaction_date.slice(8, 10);
    byDay[d] = (byDay[d] ?? 0) + Number(t.amount);
  });
  const chartData = Object.entries(byDay).sort().map(([day, amount]) => ({ day, amount }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Spent" value={formatCurrency(expenses)} accent="destructive" />
        <StatCard label="Income" value={formatCurrency(income)} accent="success" />
        <StatCard label="Net" value={formatCurrency(income - expenses)} accent="primary" />
        <StatCard label="Budget" value={formatCurrency(budget)} hint={budget ? `${Math.round((expenses / budget) * 100)}% used` : "Set bucket budgets"} accent="gold" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-display text-lg text-foreground mb-4">Daily spend</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-foreground mb-4">Buckets</h3>
          <div className="space-y-3">
            {buckets.length === 0 && <p className="text-sm text-muted-foreground">No buckets yet.</p>}
            {buckets.slice(0, 6).map((b) => {
              const spent = tx.filter((t) => t.bucket_id === b.id && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
              const pct = b.monthly_budget > 0 ? Math.min(100, (spent / Number(b.monthly_budget)) * 100) : 0;
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{b.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(spent)} / {formatCurrency(b.monthly_budget)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full" style={{ width: `${pct}%`, background: b.color_hex }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-display text-lg text-foreground mb-4">Recent transactions</h3>
        {tx.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions this month yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tx.slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{t.description}</div>
                  <div className="text-xs text-muted-foreground">{t.transaction_date}</div>
                </div>
                <div className={`text-sm font-medium ${t.type === "expense" ? "text-destructive" : "text-success"}`}>
                  {t.type === "expense" ? "−" : "+"}{formatCurrency(t.amount, t.currency_code)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
