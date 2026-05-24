import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { PageHeader, Card, Button } from "@/components/app/ui";
import { Modal } from "@/components/app/modal";
import { Field } from "@/routes/login";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/recurring")({ component: RecPage });

function RecPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly", bucket_id: "", start_date: new Date().toISOString().slice(0, 10) });

  const { data: rules = [] } = useQuery({
    queryKey: ["recurring", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("recurring_rules").select("*, buckets(name)").order("next_run_date")).data ?? [],
  });
  const { data: buckets = [] } = useQuery({
    queryKey: ["buckets-min2", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("buckets").select("id, name").eq("is_active", true)).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recurring_rules").insert({
        user_id: user!.id, name: form.name, amount: parseFloat(form.amount),
        frequency: form.frequency, bucket_id: form.bucket_id || null,
        start_date: form.start_date, next_run_date: form.start_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      setOpen(false); setForm({ ...form, name: "", amount: "" });
      toast.success("Rule created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("recurring_rules").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });

  return (
    <div>
      <PageHeader
        title="Recurring"
        subtitle="Rent, salary, subscriptions."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New rule</Button>}
      />
      <Card className="p-0 overflow-hidden">
        {rules.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No recurring rules yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((r: any) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{r.frequency} · next {r.next_run_date} · {r.buckets?.name ?? "—"}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground">{formatCurrency(r.amount)}</span>
                  <button onClick={() => del.mutate(r.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New recurring rule">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Amount" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required />
          <label className="block">
            <span className="text-sm font-medium text-foreground">Frequency</span>
            <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="mt-1.5 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <Field label="Start date" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
          <label className="block">
            <span className="text-sm font-medium text-foreground">Bucket</span>
            <select value={form.bucket_id} onChange={(e) => setForm({ ...form, bucket_id: e.target.value })}
              className="mt-1.5 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">— None —</option>
              {buckets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create rule"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
