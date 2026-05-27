import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import { PageHeader, Card, Button } from "@/components/app/ui";
import { Modal } from "@/components/app/modal";
import { Field } from "@/routes/login";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Plus, RefreshCw, MoreHorizontal, Pencil, Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/recurring")({ component: RecPage });

type Rule = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: string;
  bucket_id: string | null;
  next_run_date: string;
  is_active: boolean;
  start_date: string;
  buckets?: { name: string; color_hex: string } | null;
};

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatDue(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function RecPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = { name: "", amount: "", frequency: "monthly", bucket_id: "", start_date: new Date().toISOString().slice(0, 10) };
  const [form, setForm] = useState(emptyForm);
  const [menuId, setMenuId] = useState<string | null>(null);

  const { data: rules = [] } = useQuery({
    queryKey: ["recurring", user?.id],
    enabled: !!user,
    queryFn: async () =>
      ((await supabase
        .from("recurring_rules")
        .select("*, buckets(name, color_hex)")
        .order("next_run_date")).data ?? []) as Rule[],
  });
  const { data: buckets = [] } = useQuery({
    queryKey: ["buckets-min2", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("buckets").select("id, name, color_hex").eq("is_active", true)).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        bucket_id: form.bucket_id || null,
        start_date: form.start_date,
        next_run_date: form.start_date,
      };
      if (editingId) {
        const { error } = await supabase.from("recurring_rules").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("recurring_rules").insert({ ...payload, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      setOpen(false); setEditingId(null); setForm(emptyForm);
      toast.success(editingId ? "Rule updated" : "Rule created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("recurring_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("recurring_rules").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recurring"] }); toast.success("Rule deleted"); },
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r: Rule) => {
    setEditingId(r.id);
    setForm({
      name: r.name, amount: String(r.amount), frequency: r.frequency,
      bucket_id: r.bucket_id ?? "", start_date: r.start_date,
    });
    setOpen(true);
    setMenuId(null);
  };

  const memberName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You";

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        subtitle="Manage your subscriptions and regular payments"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Recurring</Button>}
      />

      <Card className="p-0 overflow-hidden">
        {rules.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No recurring rules yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-5 py-3 font-normal">Name</th>
                  <th className="px-5 py-3 font-normal">Amount</th>
                  <th className="px-5 py-3 font-normal">Frequency</th>
                  <th className="px-5 py-3 font-normal">Category</th>
                  <th className="px-5 py-3 font-normal">Member</th>
                  <th className="px-5 py-3 font-normal">Next Due</th>
                  <th className="px-5 py-3 font-normal">Active</th>
                  <th className="px-5 py-3 font-normal w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const d = daysUntil(r.next_run_date);
                  const soon = r.is_active && d >= 0 && d <= 7;
                  const bucketColor = r.buckets?.color_hex || "#64748b";
                  return (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">{formatCurrency(r.amount)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-border bg-accent/50 px-2.5 py-0.5 text-xs capitalize text-foreground">
                          {r.frequency}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {r.buckets ? (
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${bucketColor}22`,
                              color: bucketColor,
                              border: `1px solid ${bucketColor}55`,
                            }}
                          >
                            {r.buckets.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-foreground">{memberName}</td>
                      <td className="px-5 py-4">
                        <span className={cn(soon ? "font-semibold text-gold" : "text-foreground")}>
                          {formatDue(r.next_run_date)}
                          {soon && <span className="ml-1 text-xs">({d}d)</span>}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Toggle
                          checked={r.is_active}
                          onChange={(v) => toggleActive.mutate({ id: r.id, is_active: v })}
                        />
                      </td>
                      <td className="px-5 py-4 relative">
                        <RowMenu
                          open={menuId === r.id}
                          onOpen={() => setMenuId(menuId === r.id ? null : r.id)}
                          onClose={() => setMenuId(null)}
                          onEdit={() => openEdit(r)}
                          onToggle={() => { toggleActive.mutate({ id: r.id, is_active: !r.is_active }); setMenuId(null); }}
                          isActive={r.is_active}
                          onDelete={() => { del.mutate(r.id); setMenuId(null); }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit recurring rule" : "New recurring rule"}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
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
            <span className="text-sm font-medium text-foreground">Category</span>
            <select value={form.bucket_id} onChange={(e) => setForm({ ...form, bucket_id: e.target.value })}
              className="mt-1.5 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">— None —</option>
              {buckets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : editingId ? "Save changes" : "Create rule"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function RowMenu({
  open, onOpen, onClose, onEdit, onToggle, isActive, onDelete,
}: {
  open: boolean; onOpen: () => void; onClose: () => void;
  onEdit: () => void; onToggle: () => void; isActive: boolean; onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={onOpen}
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-popover py-1 shadow-lg">
          <button onClick={onEdit} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button onClick={onToggle} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent">
            {isActive ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
          </button>
          <button onClick={onDelete} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
