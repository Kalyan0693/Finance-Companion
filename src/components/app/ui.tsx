import { cn } from "@/lib/utils";

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label, value, hint, icon, trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down"; positive?: boolean };
}) {
  const trendColor = trend
    ? (trend.positive ?? trend.direction === "up")
      ? "text-success"
      : "text-destructive"
    : "";
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition hover:border-border/80">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        {icon && (
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 font-display text-3xl tracking-tight text-foreground">{value}</div>
      {(trend || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", trendColor)}>
              {trend.direction === "up" ? "↗" : "↘"} {trend.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function Button({
  variant = "primary", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-deep",
    secondary: "bg-card border border-border text-foreground hover:bg-accent",
    ghost: "text-foreground hover:bg-accent",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        v, className,
      )}
    />
  );
}
