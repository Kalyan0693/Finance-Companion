import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { PageHeader, Card, Button } from "@/components/app/ui";
import { Modal } from "@/components/app/modal";
import { Field } from "@/routes/login";
import { toast } from "sonner";
import { Plus, Users, Mail, Copy } from "lucide-react";

export const Route = createFileRoute("/_app/groups")({ component: GroupsPage });

function GroupsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("groups").select("*").order("created_at")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("groups").insert({ name, owner_id: user!.id }).select().single();
      if (error) throw error;
      await supabase.from("group_members").insert({ group_id: data.id, user_id: user!.id, role: "owner" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      setOpen(false); setName("");
      toast.success("Group created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invite = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invitations").insert({
        group_id: inviteFor!, email: inviteEmail, invited_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation created");
      setInviteFor(null); setInviteEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied");
  };

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle="Share buckets with household, partners, or roommates."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New group</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary-deep">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{g.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{g.type}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">{g.invite_code}</code>
              <button onClick={() => copyCode(g.invite_code)} className="text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setInviteFor(g.id)}>
              <Mail className="h-4 w-4" /> Invite by email
            </Button>
          </Card>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups yet.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New group">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <Field label="Group name" value={name} onChange={setName} required placeholder="The household" />
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create group"}
          </Button>
        </form>
      </Modal>

      <Modal open={!!inviteFor} onClose={() => setInviteFor(null)} title="Invite a member">
        <form onSubmit={(e) => { e.preventDefault(); invite.mutate(); }} className="space-y-4">
          <Field label="Email" type="email" value={inviteEmail} onChange={setInviteEmail} required />
          <Button type="submit" className="w-full" disabled={invite.isPending}>
            {invite.isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
