import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email to confirm your account.");
  };

  return (
    <AuthShell title="Create your ledger" subtitle="Start tracking in under a minute.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required placeholder="At least 6 characters" />
        <button disabled={busy} className="w-full rounded-md bg-primary-deep px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary disabled:opacity-50 transition">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Have an account? <Link to="/login" className="font-medium text-primary-deep hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
