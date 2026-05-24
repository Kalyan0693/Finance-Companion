import { cn } from "@/lib/utils";

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground">{title}</h1>
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
  label, value, hint, accent,
}: { label: string; value: string; hint?: string; accent?: "primary" | "gold" | "destructive" | "success" }) {
  const accentBar = {
    primary: "bg-primary",
    gold: "bg-gold",
    destructive: "bg-destructive",
    success: "bg-success",
  }[accent ?? "primary"];
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className={cn("absolute left-0 top-0 h-full w-1", accentBar)} />
      <div className="pl-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-2 font-display text-3xl text-foreground">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

export function Button({
  variant = "primary", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-primary-deep text-primary-foreground hover:bg-primary",
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
