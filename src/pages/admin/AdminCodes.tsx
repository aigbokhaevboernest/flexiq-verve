import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2 } from "lucide-react";

const AdminCodes = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: codes = [] } = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("auth_codes")
        .select("*, profiles!inner(first_name,last_name,email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const remove = async (id: string) => {
    await supabase.from("auth_codes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-codes"] });
    toast({ title: "Code revoked" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Authorization Codes</h1>
        <p className="mt-1 text-sm text-muted-foreground">All codes you've issued. Issue new ones from the Users page.</p>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="pb-3">User</th><th className="pb-3">Type</th><th className="pb-3">Code</th><th className="pb-3">Status</th><th className="pb-3">Expires</th><th className="pb-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {codes.map((c: any) => (
              <tr key={c.id}>
                <td className="py-3">
                  <p className="font-medium">{c.profiles?.first_name} {c.profiles?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{c.profiles?.email}</p>
                </td>
                <td className="py-3 uppercase font-semibold">{c.code_type}</td>
                <td className="py-3 font-mono">{c.code}</td>
                <td className="py-3">
                  {c.used ? <Badge variant="outline" className="border-muted bg-muted/40">Used</Badge>
                   : <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Active</Badge>}
                </td>
                <td className="py-3 text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(c.code); toast({ title: "Copied" }); }}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {codes.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No codes issued yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminCodes;
