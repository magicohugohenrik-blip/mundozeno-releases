import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Operações administrativas do Mundo Zeno (gestores de mesa e contas de mesa).
 * Tudo roda no servidor: as senhas são geradas aqui e devolvidas uma única vez,
 * nunca ficam no código do navegador.
 */

const MANAGER_DOMAIN = "gestor.mundozeno.local";
const DEVICE_DOMAIN = "mesa.mundozeno.local";

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function randomPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function deviceCode(): string {
  const block = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    return Array.from(bytes, (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  };
  return `MESA-${block()}-${block()}`;
}

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function assertSuper(context: { supabase: { rpc: (...args: never[]) => unknown }; userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (context.supabase as any).rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (!data) throw new Error("Apenas o super administrador pode fazer isso.");
}

async function canManageDevice(
  context: { supabase: unknown; userId: string },
  admin: Admin,
  deviceId: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = context.supabase as any;
  const { data: isSuper } = await sb.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
  if (isSuper) return true;
  const { data: isOrgAdmin } = await sb.rpc("has_role", { _user_id: context.userId, _role: "org_admin" });
  if (!isOrgAdmin) return false;
  const [{ data: profile }, { data: device }] = await Promise.all([
    admin.from("profiles").select("organization_id").eq("id", context.userId).maybeSingle(),
    admin.from("devices").select("organization_id").eq("id", deviceId).maybeSingle(),
  ]);
  return Boolean(profile?.organization_id && device?.organization_id === profile.organization_id);
}

async function uniqueUsername(admin: Admin, base: string): Promise<string> {
  let candidate = base || "usuario";
  let n = 1;
  // Garante um nome de usuário livre na tabela de apelidos de login.
  for (;;) {
    const { data } = await admin.from("login_aliases").select("username").eq("username", candidate).maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

/** Super admin cria a conta de um gestor de mesas dentro de uma instituição. */
export const createManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        fullName: z.string().trim().min(2),
        username: z.string().trim().min(3).max(40),
        organizationId: z.string().uuid(),
        password: z.string().min(8).max(72).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const username = await uniqueUsername(supabaseAdmin, slug(data.username));
    const email = `${username}@${MANAGER_DOMAIN}`;
    const password = data.password || randomPassword();

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Não foi possível criar o gestor.");

    const userId = created.user.id;
    await supabaseAdmin.from("login_aliases").upsert({ username, email });
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.fullName, organization_id: data.organizationId });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "table_manager" });

    return { userId, username, password };
  });

/** Super admin cria a mesa: código de ativação + conta própria da mesa. */
export const createDeviceWithAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        label: z.string().trim().max(80).optional(),
        location: z.string().trim().max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const label = data.label?.trim() || "Mesa";
    const code = deviceCode();
    const username = await uniqueUsername(supabaseAdmin, `mesa-${slug(label)}`);
    const email = `${username}@${DEVICE_DOMAIN}`;
    const password = randomPassword();

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: label },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Não foi possível criar a conta da mesa.");

    const userId = created.user.id;
    await supabaseAdmin.from("login_aliases").upsert({ username, email });
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: label, organization_id: data.organizationId });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "professional" });

    const { data: device, error: deviceErr } = await supabaseAdmin
      .from("devices")
      .insert({
        organization_id: data.organizationId,
        code,
        label,
        location: data.location || null,
        status: "pending",
        auth_user_id: userId,
        login_username: username,
      })
      .select("id")
      .single();
    if (deviceErr || !device) throw new Error(deviceErr?.message ?? "Não foi possível criar a mesa.");

    return { deviceId: device.id, code, username, password };
  });

/** Vincula um gestor a uma mesa (sempre dentro da instituição da mesa). */
export const linkManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ deviceId: z.string().uuid(), userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await canManageDevice(context, supabaseAdmin, data.deviceId))) {
      throw new Error("Sem permissão para alterar os gestores desta mesa.");
    }

    const [{ data: device }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("devices").select("organization_id").eq("id", data.deviceId).maybeSingle(),
      supabaseAdmin.from("profiles").select("organization_id").eq("id", data.userId).maybeSingle(),
    ]);
    if (!device || !profile || device.organization_id !== profile.organization_id) {
      throw new Error("O gestor precisa pertencer à mesma instituição da mesa.");
    }

    const { error } = await supabaseAdmin
      .from("device_managers")
      .upsert({ device_id: data.deviceId, user_id: data.userId }, { onConflict: "device_id,user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove o vínculo entre gestor e mesa. */
export const unlinkManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ deviceId: z.string().uuid(), userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await canManageDevice(context, supabaseAdmin, data.deviceId))) {
      throw new Error("Sem permissão para alterar os gestores desta mesa.");
    }
    const { error } = await supabaseAdmin
      .from("device_managers")
      .delete()
      .eq("device_id", data.deviceId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Super admin redefine a senha de um gestor ou de uma mesa. */
export const resetAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = randomPassword();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password });
    if (error) throw new Error(error.message);
    return { password };
  });
