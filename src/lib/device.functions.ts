import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Ativação e entrada automática da mesa.
 * A mesa envia apenas o código de ativação gerado pelo super administrador.
 * O servidor confere o código e devolve um token de entrada de uso único —
 * o usuário e a senha da mesa nunca trafegam para o navegador.
 */
export const activateDevice = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ code: z.string().trim().min(6).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();

    const { data: device } = await supabaseAdmin
      .from("devices")
      .select("id, code, label, location, status, organization_id, auth_user_id")
      .eq("code", code)
      .maybeSingle();

    if (!device) return { ok: false as const, reason: "not_found" as const };
    if (device.status === "blocked") return { ok: false as const, reason: "blocked" as const };
    if (!device.auth_user_id) return { ok: false as const, reason: "no_account" as const };

    const { data: user } = await supabaseAdmin.auth.admin.getUserById(device.auth_user_id);
    const email = user?.user?.email;
    if (!email) return { ok: false as const, reason: "no_account" as const };

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (error || !tokenHash) return { ok: false as const, reason: "no_account" as const };

    const { data: org } = device.organization_id
      ? await supabaseAdmin.from("organizations").select("name").eq("id", device.organization_id).maybeSingle()
      : { data: null };

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("devices")
      .update(
        device.status === "active"
          ? { status: "active", last_seen_at: now }
          : { status: "active", activated_at: now, last_seen_at: now },
      )
      .eq("id", device.id);

    return {
      ok: true as const,
      code: device.code,
      label: device.label,
      location: device.location,
      organization: org?.name ?? null,
      tokenHash,
    };
  });
