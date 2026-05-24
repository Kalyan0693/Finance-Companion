import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Wallet, Users, Repeat, PieChart } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary-deep text-primary-foreground font-display text-lg">L</div>
            <span className="font-display text-xl">Ledger</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {!loading && (user ? (
              <Link to="/dashboard" className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-deep transition">
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-foreground/80 hover:text-foreground">Sign in</Link>
                <Link to="/signup" className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-deep transition">
                  Get started
                </Link>
              </>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Personal & shared finances, in one ledger
            </div>
            <h1 className="mt-6 font-display text-5xl leading-tight text-foreground md:text-6xl">
              The quiet way to <em className="text-primary-deep">track every</em> dollar.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Bucket your spending, schedule what repeats, share with the household. No spreadsheets, no noise — just clean numbers and clean lines.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2 rounded-md bg-primary-deep px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary transition">
                {user ? "Open dashboard" : "Start tracking"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-accent transition">
                I have an account
              </Link>
            </div>
          </div>

          {/* Stylized card mockup */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-gold/10 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">November spend</div>
                  <div className="font-display text-3xl text-foreground">$2,418.50</div>
                </div>
                <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary-deep">−12% vs Oct</div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { name: "Groceries", pct: 78, color: "bg-primary" },
                  { name: "Rent · shared", pct: 100, color: "bg-primary-deep" },
                  { name: "Dining", pct: 42, color: "bg-gold" },
                  { name: "Transit", pct: 28, color: "bg-success" },
                ].map((b) => (
                  <div key={b.name}>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{b.name}</span><span>{b.pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-4">
          {[
            { Icon: Wallet, t: "Buckets", d: "Categorize with budgets per month." },
            { Icon: Repeat, t: "Recurring", d: "Rent, salary, subscriptions — set & forget." },
            { Icon: Users, t: "Groups", d: "Invite housemates or partners by email." },
            { Icon: PieChart, t: "Dashboards", d: "Monthly, quarterly, annual at a glance." },
          ].map(({ Icon, t, d }) => (
            <div key={t}>
              <Icon className="h-5 w-5 text-primary-deep" />
              <div className="mt-3 font-display text-lg text-foreground">{t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ledger
        </div>
      </footer>
    </div>
  );
}
