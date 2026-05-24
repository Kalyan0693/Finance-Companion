import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { PageHeader, Card, Button } from "@/components/app/ui";
import { Modal } from "@/components/app/modal";
import { Field } from "@/routes/login";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/transactions")({ component: TxPage });

function TxPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: "", amount: "", type: "expense" as "expense" | "income",
    transaction_date: new Date().toISOString().slice(0, 10),
    bucket_id: "", group_id: "",
  });

  const { data: tx = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("transactions").select("*, buckets(name, color_hex)").order("transaction_date", { ascending: false }).limit(100)).data ?? [],
  });

  const { data: buckets = [] } = useQuery({
    queryKey: ["buckets-min", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("buckets").select("id, name, group_id").eq("is_active", true)).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const bucket = buckets.find((b) => b.id === form.bucket_id);
      const { error } = await supabase.from("transactions").insert({
        user_id: user!.id,
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        transaction_date: form.transaction_date,
        bucket_id: form.bucket_id || null,
        group_id: bucket?.group_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setForm({ ...form, description: "", amount: "" });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${tx.length} recorded`}
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add</Button>}
      />
      <Card className="p-0 overflow-hidden">
        {tx.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tx.map((t: any) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {t.buckets && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: t.buckets.color_hex }} />}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(t.transaction_date)} · {t.buckets?.name ?? "Uncategorized"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${t.type === "expense" ? "text-destructive" : "text-success"}`}>
                    {t.type === "expense" ? "−" : "+"}{formatCurrency(t.amount, t.currency_code)}
                  </span>
                  <button onClick={() => del.mutate(t.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add transaction">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required />
            <label className="block">
              <span className="text-sm font-medium text-foreground">Type</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="mt-1.5 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
          </div>
          <Field label="Date" type="date" value={form.transaction_date} onChange={(v) => setForm({ ...form, transaction_date: v })} />
          <label className="block">
            <span className="text-sm font-medium text-foreground">Bucket</span>
            <select value={form.bucket_id} onChange={(e) => setForm({ ...form, bucket_id: e.target.value })}
              className="mt-1.5 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">— None —</option>
              {buckets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Saving…" : "Save transaction"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
