import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, StatCard, Card } from "@/components/app/ui";
import { formatCurrency, monthRange } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { Wallet, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.72 0.18 200)",
  "oklch(0.72 0.20 290)",
];

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
  const remaining = Math.max(0, budget - expenses);
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const today = new Date();
  const dailyAvg = expenses / Math.max(1, today.getDate());

  const byDay: Record<string, number> = {};
  tx.filter((t) => t.type === "expense").forEach((t) => {
    const d = t.transaction_date.slice(8, 10);
    byDay[d] = (byDay[d] ?? 0) + Number(t.amount);
  });
  const chartData = Object.entries(byDay).sort().map(([day, amount]) => ({ day, amount }));

  const byBucket = buckets.map((b, i) => ({
    name: b.name,
    value: tx.filter((t) => t.bucket_id === b.id && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    color: b.color_hex || CHART_COLORS[i % CHART_COLORS.length],
  })).filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Track your spending and manage your finances" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Spent"
          value={formatCurrency(expenses)}
          icon={<Wallet className="h-4 w-4" />}
          hint="this month"
        />
        <StatCard
          label="Remaining Budget"
          value={formatCurrency(remaining)}
          icon={<PiggyBank className="h-4 w-4" />}
          hint={budget ? `${Math.round((expenses / budget) * 100)}% used of ${formatCurrency(budget)}` : "Set bucket budgets"}
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: `${formatCurrency(income - expenses)}`, direction: savingsRate >= 0 ? "up" : "down", positive: savingsRate >= 0 }}
          hint="of income saved"
        />
        <StatCard
          label="Daily Average"
          value={formatCurrency(dailyAvg)}
          icon={<TrendingDown className="h-4 w-4" />}
          hint="per day this month"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-display text-lg text-foreground">Spending Trends</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily spending over this month</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "var(--color-accent)" }}
                />
                <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="font-display text-lg text-foreground">By Category</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Spending distribution across buckets</p>
          </div>
          {byBucket.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No spending yet.</p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byBucket} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                      {byBucket.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {byBucket.map((d, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h3 className="font-display text-lg text-foreground">Buckets</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Budget usage this month</p>
          </div>
          <div className="space-y-4">
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
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color_hex || "var(--color-primary)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="font-display text-lg text-foreground">Recent transactions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest activity</p>
          </div>
          {tx.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions this month yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tx.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{t.transaction_date}</div>
                  </div>
                  <div className={`text-sm font-semibold ${t.type === "expense" ? "text-destructive" : "text-success"}`}>
                    {t.type === "expense" ? "−" : "+"}{formatCurrency(t.amount, t.currency_code)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
