// Secure admin actions: balance adjust, freeze/unfreeze, role management,
// password reset, delete user. Requires the caller to be an authenticated admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Action =
  | { action: "adjust_balance"; target_user_id: string; amount: number; kind: "credit" | "debit"; note?: string }
  | { action: "toggle_freeze"; target_user_id: string }
  | { action: "set_role"; target_user_id: string; role: "admin" | "moderator" | "user"; grant: boolean }
  | { action: "reset_password"; target_user_id: string }
  | { action: "delete_user"; target_user_id: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // 1) Verify caller JWT and admin role
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Missing bearer token" });

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return json(401, { error: "Invalid session" });
  const actor = userRes.user;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", actor.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json(403, { error: "Admin role required" });

  // 2) Parse body
  let body: Action;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  if (!body?.action || !body?.target_user_id) return json(400, { error: "action and target_user_id required" });

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  const audit = async (action: string, payload: Record<string, unknown>) => {
    await admin.from("admin_actions").insert({
      actor_id: actor.id,
      actor_email: actor.email,
      target_user_id: body.target_user_id,
      action,
      payload,
      ip_address: ip,
      user_agent: ua,
    });
  };

  try {
    switch (body.action) {
      case "adjust_balance": {
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0) return json(400, { error: "amount must be > 0" });
        const { data: account, error: accErr } = await admin
          .from("accounts")
          .select("*")
          .eq("user_id", body.target_user_id)
          .maybeSingle();
        if (accErr || !account) return json(404, { error: "Account not found" });

        const delta = body.kind === "credit" ? amount : -amount;
        const newBalance = Number(account.balance) + delta;
        if (newBalance < 0) return json(400, { error: "Cannot debit below zero" });

        const { error: updErr } = await admin.from("accounts").update({ balance: newBalance }).eq("id", account.id);
        if (updErr) return json(500, { error: updErr.message });

        const { error: txErr } = await admin.from("transactions").insert({
          user_id: body.target_user_id,
          type: "adjustment",
          status: "completed",
          amount: delta,
          currency: account.currency,
          description: body.note?.slice(0, 200) || `Admin ${body.kind}`,
        });
        if (txErr) return json(500, { error: txErr.message });

        await audit("adjust_balance", { amount, kind: body.kind, note: body.note, new_balance: newBalance });
        return json(200, { ok: true, new_balance: newBalance });
      }

      case "toggle_freeze": {
        const { data: account } = await admin.from("accounts").select("*").eq("user_id", body.target_user_id).maybeSingle();
        if (!account) return json(404, { error: "Account not found" });
        const next = !account.frozen;
        const { error } = await admin.from("accounts").update({ frozen: next }).eq("id", account.id);
        if (error) return json(500, { error: error.message });
        await audit("toggle_freeze", { frozen: next });
        return json(200, { ok: true, frozen: next });
      }

      case "set_role": {
        if (!["admin", "moderator", "user"].includes(body.role)) return json(400, { error: "invalid role" });
        if (body.target_user_id === actor.id && body.role === "admin" && !body.grant) {
          return json(400, { error: "You cannot remove your own admin role" });
        }
        if (body.grant) {
          const { error } = await admin
            .from("user_roles")
            .insert({ user_id: body.target_user_id, role: body.role })
            .select()
            .maybeSingle();
          // ignore unique-violation 23505 (already has role)
          if (error && (error as { code?: string }).code !== "23505") return json(500, { error: error.message });
        } else {
          const { error } = await admin
            .from("user_roles")
            .delete()
            .eq("user_id", body.target_user_id)
            .eq("role", body.role);
          if (error) return json(500, { error: error.message });
        }
        await audit("set_role", { role: body.role, grant: body.grant });
        return json(200, { ok: true });
      }

      case "reset_password": {
        const { data: target } = await admin.auth.admin.getUserById(body.target_user_id);
        if (!target?.user?.email) return json(404, { error: "User has no email" });
        const { data, error } = await admin.auth.admin.generateLink({
          type: "recovery",
          email: target.user.email,
        });
        if (error) return json(500, { error: error.message });
        await audit("reset_password", { email: target.user.email });
        return json(200, { ok: true, recovery_link: data.properties?.action_link ?? null });
      }

      case "delete_user": {
        if (body.target_user_id === actor.id) return json(400, { error: "You cannot delete yourself" });
        const { error } = await admin.auth.admin.deleteUser(body.target_user_id);
        if (error) return json(500, { error: error.message });
        await audit("delete_user", {});
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: "Unknown action" });
    }
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});
