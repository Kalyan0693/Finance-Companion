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

export const Route = createFileRoute("/_app/buckets")({ component: BucketsPage });

const COLORS = ["#0d7a5f", "#064e3b", "#c9a84c", "#8b5cf6", "#ef4444", "#3b82f6", "#f97316"];

function BucketsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const { data: buckets = [] } = useQuery({
    queryKey: ["buckets", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("buckets").select("*").order("created_at")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("buckets").insert({
        owner_id: user!.id, name, monthly_budget: parseFloat(budget) || 0, color_hex: color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buckets"] });
      setOpen(false); setName(""); setBudget("");
      toast.success("Bucket created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("buckets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buckets"] }),
  });

  return (
    <div>
      <PageHeader
        title="Buckets"
        subtitle="Categories with monthly budgets."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New bucket</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buckets.map((b) => (
          <Card key={b.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md" style={{ background: b.color_hex }} />
                <div>
                  <div className="font-medium text-foreground">{b.name}</div>
                  <div className="text-xs text-muted-foreground">Budget {formatCurrency(b.monthly_budget)}</div>
                </div>
              </div>
              <button onClick={() => del.mutate(b.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
        {buckets.length === 0 && <p className="text-sm text-muted-foreground">No buckets yet. Create your first one.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New bucket">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <Field label="Name" value={name} onChange={setName} required placeholder="Groceries" />
          <Field label="Monthly budget" type="number" value={budget} onChange={setBudget} placeholder="500" />
          <div>
            <span className="text-sm font-medium text-foreground">Color</span>
            <div className="mt-2 flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-md ring-offset-2 ring-offset-card transition ${color === c ? "ring-2 ring-foreground" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
