import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your ledger.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        <button disabled={busy} className="w-full rounded-md bg-primary-deep px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary disabled:opacity-50 transition">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link to="/signup" className="font-medium text-primary-deep hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between bg-primary-deep p-12 text-primary-foreground">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gold text-gold-foreground font-display">L</div>
          <span className="font-display text-xl">Ledger</span>
        </Link>
        <div>
          <blockquote className="font-display text-3xl leading-tight">
            "Counting every coin, with the calm of a quiet bookkeeper."
          </blockquote>
          <div className="mt-4 text-sm opacity-70">Built for households that share the bills.</div>
        </div>
        <div className="text-xs opacity-60">© {new Date().getFullYear()} Ledger</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label, type = "text", value, onChange, required, placeholder,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
