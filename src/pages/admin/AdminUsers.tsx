import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Snowflake, Sun, Plus, Minus, KeyRound, ShieldCheck, Shield, Trash2, RotateCcw, Copy, Lock, Ban, ReceiptText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type Role = "admin" | "moderator" | "user";

const AdminUsers = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const [adjOpen, setAdjOpen] = useState(false);
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjNote, setAdjNote] = useState("");

  const [codeOpen, setCodeOpen] = useState(false);
  const [codeType, setCodeType] = useState<"cot" | "imf" | "tax" | "loan">("cot");
  const [codeValue, setCodeValue] = useState("");

  const [roleOpen, setRoleOpen] = useState(false);
  const [roleValue, setRoleValue] = useState<Role>("user");
  const [roleGrant, setRoleGrant] = useState(true);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdValue, setPwdValue] = useState("");

  const [banOpen, setBanOpen] = useState(false);
  const [banValue, setBanValue] = useState(true);

  const [txOpen, setTxOpen] = useState(false);
  const [txType, setTxType] = useState("deposit");
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txStatus, setTxStatus] = useState("completed");
  const [txAffect, setTxAffect] = useState(true);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: accounts }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("accounts").select("*"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const rolesByUser = new Map<string, Role[]>();
      (roles || []).forEach((r: any) => {
        const arr = rolesByUser.get(r.user_id) || [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      return (profiles || []).map((p: any) => ({
        ...p,
        account: (accounts || []).find((a: any) => a.user_id === p.id),
        roles: rolesByUser.get(p.id) || [],
      }));
    },
  });

  const filtered = users.filter((u: any) => {
    if (!q) return true;
    const hay = `${u.first_name} ${u.last_name} ${u.email} ${u.account?.account_number || ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const callAdmin = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions", { body });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    } finally {
      setBusy(false);
    }
  };

  const adjust = async () => {
    if (!selected?.account) return;
    const amt = Number(adjAmount);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    try {
      await callAdmin({
        action: "adjust_balance",
        target_user_id: selected.id,
        amount: amt,
        kind: adjType,
        note: adjNote,
      });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: `${adjType === "credit" ? "Credited" : "Debited"} ${amt} ${selected.account.currency}` });
      setAdjOpen(false); setAdjAmount(""); setAdjNote("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const toggleFreeze = async (u: any) => {
    if (!u.account) return;
    try {
      const res = await callAdmin({ action: "toggle_freeze", target_user_id: u.id });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: res.frozen ? "Account frozen" : "Account unfrozen" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const issueCode = async () => {
    if (!selected) return;
    const code = codeValue.trim().toUpperCase() ||
      `NX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error } = await supabase.from("auth_codes").insert({
      user_id: selected.id,
      code,
      code_type: codeType,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `${codeType.toUpperCase()} code issued`, description: code });
    navigator.clipboard?.writeText(code);
    setCodeOpen(false); setCodeValue("");
  };

  const applyRole = async () => {
    if (!selected) return;
    try {
      await callAdmin({
        action: "set_role",
        target_user_id: selected.id,
        role: roleValue,
        grant: roleGrant,
      });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: roleGrant ? `Granted ${roleValue}` : `Removed ${roleValue}` });
      setRoleOpen(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const sendReset = async () => {
    if (!selected) return;
    try {
      const res = await callAdmin({ action: "reset_password", target_user_id: selected.id });
      setResetLink(res.recovery_link || null);
      toast({ title: "Recovery link generated" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await callAdmin({ action: "delete_user", target_user_id: selected.id });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User deleted" });
      setDeleteOpen(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const setPassword = async () => {
    if (!selected) return;
    if (pwdValue.length < 8) return toast({ title: "Min 8 characters", variant: "destructive" });
    try {
      await callAdmin({ action: "set_password", target_user_id: selected.id, new_password: pwdValue });
      toast({ title: "Password updated", description: `New password set for ${selected.email}` });
      setPwdOpen(false); setPwdValue("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const setBanned = async () => {
    if (!selected) return;
    try {
      await callAdmin({ action: "set_user_banned", target_user_id: selected.id, banned: banValue });
      toast({ title: banValue ? "User blocked" : "User unblocked" });
      setBanOpen(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const createTransaction = async () => {
    if (!selected) return;
    const amt = Number(txAmount);
    if (!amt) return toast({ title: "Enter a non-zero amount (use negative for debits)", variant: "destructive" });
    try {
      await callAdmin({
        action: "create_transaction",
        target_user_id: selected.id,
        tx_type: txType,
        amount: amt,
        description: txDesc,
        status: txStatus,
        affect_balance: txAffect,
      });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Transaction created" });
      setTxOpen(false); setTxAmount(""); setTxDesc("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage balances, freeze accounts, roles and access.</p>
        </div>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, account…" className="pl-9" />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-3">User</th>
                <th className="pb-3">Account</th>
                <th className="pb-3 text-right">Balance</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Roles</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((u: any) => (
                <tr key={u.id}>
                  <td className="py-3">
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="py-3 font-mono text-xs">{u.account?.account_number || "—"}</td>
                  <td className="py-3 text-right font-display font-bold">
                    {u.account ? `${Number(u.account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${u.account.currency}` : "—"}
                  </td>
                  <td className="py-3">
                    {u.account?.frozen
                      ? <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">Frozen</Badge>
                      : <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Active</Badge>}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      {u.roles.map((r: Role) => (
                        <Badge key={r} variant="outline" className={
                          r === "admin" ? "border-primary/30 bg-primary/10 text-primary" :
                          r === "moderator" ? "border-accent/30 bg-accent/10" : ""
                        }>{r}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" disabled={busy} title="Credit"
                        onClick={() => { setSelected(u); setAdjType("credit"); setAdjOpen(true); }}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Debit"
                        onClick={() => { setSelected(u); setAdjType("debit"); setAdjOpen(true); }}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title={u.account?.frozen ? "Unfreeze" : "Freeze"}
                        onClick={() => toggleFreeze(u)}>
                        {u.account?.frozen ? <Sun className="h-3.5 w-3.5" /> : <Snowflake className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Issue code"
                        onClick={() => { setSelected(u); setCodeOpen(true); }}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Manage roles"
                        onClick={() => { setSelected(u); setRoleValue("user"); setRoleGrant(true); setRoleOpen(true); }}>
                        {u.roles.includes("admin") ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Add transaction"
                        onClick={() => { setSelected(u); setTxType("deposit"); setTxAmount(""); setTxDesc(""); setTxStatus("completed"); setTxAffect(true); setTxOpen(true); }}>
                        <ReceiptText className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Send password reset"
                        onClick={() => { setSelected(u); setResetLink(null); setResetOpen(true); }}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Set new password"
                        onClick={() => { setSelected(u); setPwdValue(""); setPwdOpen(true); }}>
                        <Lock className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Block / unblock user"
                        onClick={() => { setSelected(u); setBanValue(true); setBanOpen(true); }}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} title="Delete user"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setSelected(u); setDeleteOpen(true); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust balance */}
      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{adjType} {selected?.first_name}'s account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Amount ({selected?.account?.currency || "USD"})</Label>
              <Input type="number" step="0.01" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
            </div>
            <div className="space-y-2"><Label>Note</Label>
              <Input value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="Reason / reference" />
            </div>
            <Button onClick={adjust} disabled={busy} className="w-full bg-gradient-primary capitalize">
              {busy ? "Working…" : `${adjType} account`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue code */}
      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue authorization code for {selected?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code type</Label>
              <Select value={codeType} onValueChange={(v: any) => setCodeType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cot">COT (Cost of Transfer)</SelectItem>
                  <SelectItem value="imf">IMF Authorization</SelectItem>
                  <SelectItem value="tax">Tax Clearance</SelectItem>
                  <SelectItem value="loan">Loan Authorization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Code (leave blank to auto-generate)</Label>
              <Input value={codeValue} onChange={(e) => setCodeValue(e.target.value.toUpperCase())} placeholder="NX-XXXX-XXXX" className="font-mono" />
            </div>
            <p className="text-xs text-muted-foreground">Code valid for 7 days. Will be copied to your clipboard.</p>
            <Button onClick={issueCode} className="w-full bg-gradient-primary">Issue code</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Roles */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage roles for {selected?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current: {selected?.roles?.join(", ") || "none"}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleValue} onValueChange={(v: any) => setRoleValue(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="moderator">moderator</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={roleGrant ? "grant" : "revoke"} onValueChange={(v) => setRoleGrant(v === "grant")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Grant role</SelectItem>
                  <SelectItem value="revoke">Revoke role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={applyRole} disabled={busy} className="w-full bg-gradient-primary">
              {busy ? "Working…" : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password reset */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Password reset for {selected?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generates a one-time recovery link for <span className="font-medium">{selected?.email}</span>.
              Share it securely — the user can use it to set a new password.
            </p>
            {resetLink ? (
              <div className="space-y-2">
                <Label>Recovery link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={resetLink} className="font-mono text-xs" />
                  <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(resetLink); toast({ title: "Copied" }); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={sendReset} disabled={busy} className="w-full bg-gradient-primary">
                {busy ? "Generating…" : "Generate recovery link"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected?.first_name} {selected?.last_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user and all linked data (account, cards, transactions, loans).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set password */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set new password for {selected?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sets the password directly for <span className="font-medium">{selected?.email}</span>. The user can sign in immediately with it.
            </p>
            <div className="space-y-2">
              <Label>New password (min 8 chars)</Label>
              <Input type="text" value={pwdValue} onChange={(e) => setPwdValue(e.target.value)} className="font-mono" placeholder="Strong password…" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => {
                const r = Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$"[b % 60]).join("");
                setPwdValue(r);
              }}>Generate</Button>
              <Button onClick={setPassword} disabled={busy || pwdValue.length < 8} className="flex-1 bg-gradient-primary">
                {busy ? "Working…" : "Update password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block / unblock */}
      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Block / unblock {selected?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Blocking prevents this user from signing in. Existing sessions will be invalidated on next request.
            </p>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={banValue ? "block" : "unblock"} onValueChange={(v) => setBanValue(v === "block")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block user (suspend login)</SelectItem>
                  <SelectItem value="unblock">Unblock user (restore access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={setBanned} disabled={busy} className={`w-full ${banValue ? "bg-destructive hover:bg-destructive/90" : "bg-gradient-primary"}`}>
              {busy ? "Working…" : banValue ? "Block user" : "Unblock user"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add transaction */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add transaction for {selected?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={txType} onValueChange={setTxType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="transfer_in">Transfer in</SelectItem>
                    <SelectItem value="transfer_out">Transfer out</SelectItem>
                    <SelectItem value="fx">FX</SelectItem>
                    <SelectItem value="loan_disbursement">Loan disbursement</SelectItem>
                    <SelectItem value="bill_payment">Bill payment</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={txStatus} onValueChange={setTxStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount ({selected?.account?.currency || "USD"}) — use negative for debits</Label>
              <Input type="number" step="0.01" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="100.00 or -50.00" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={txDesc} onChange={(e) => setTxDesc(e.target.value)} placeholder="Reason / reference shown to user" rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={txAffect} onChange={(e) => setTxAffect(e.target.checked)} />
              Apply to account balance (only when status is completed)
            </label>
            <Button onClick={createTransaction} disabled={busy} className="w-full bg-gradient-primary">
              {busy ? "Working…" : "Create transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
