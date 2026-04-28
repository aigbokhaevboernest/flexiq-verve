import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminAuditLog = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 200 privileged admin actions.</p>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-3">When</th>
                <th className="pb-3">Admin</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No actions yet.</td></tr>}
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 text-xs">{r.actor_email || r.actor_id?.slice(0, 8)}</td>
                  <td className="py-3"><Badge variant="outline">{r.action}</Badge></td>
                  <td className="py-3 font-mono text-xs">{r.target_user_id?.slice(0, 8) || "—"}</td>
                  <td className="py-3 text-xs">
                    <code className="rounded bg-muted px-2 py-1">{JSON.stringify(r.payload)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminAuditLog;
