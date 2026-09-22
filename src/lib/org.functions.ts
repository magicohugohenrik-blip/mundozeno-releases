import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface OrgResult {
  id: string;
  name: string;
  type: string;
  city: string | null;
  join_code: string;
}

/**
 * Create a brand-new institution and link the calling professional to it as
 * org_admin. Runs with the service-role client so the org row can be read back
 * and the profile linked in the same call — the client path is blocked by RLS
 * (org SELECT requires current_org(), which is null until the profile is set).
 */
export const createOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(2, "Informe o nome da instituição."),
        city: z.string().optional(),
        type: z.enum(["escola", "clinica", "outro"]).default("escola"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: org, error } = await supabaseAdmin
      .from("organizations")
      .insert({ name: data.name, city: data.city || null, type: data.type })
      .select("id, name, type, city, join_code")
      .single();
    if (error || !org) {
      throw new Error(error?.message ?? "Não foi possível criar a instituição.");
    }

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", context.userId);
    if (profileErr) throw new Error(profileErr.message);

    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "org_admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      city: org.city,
      join_code: org.join_code,
    } satisfies OrgResult;
  });

/**
 * Join an existing institution with a shareable join code. The caller becomes a
 * `professional` in that institution. Lookup happens with the service-role
 * client because orgs are hidden from users who aren't members yet.
 */
export const joinOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        code: z.string().min(4, "Informe o código da instituição."),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const code = data.code.trim().toUpperCase();
    const { data: org, error } = await supabaseAdmin
      .from("organizations")
      .select("id, name, type, city, join_code")
      .eq("join_code", code)
      .maybeSingle();
    if (error || !org) {
      throw new Error("Código de instituição não encontrado. Confira com o administrador.");
    }

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", context.userId);
    if (profileErr) throw new Error(profileErr.message);

    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "professional" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      city: org.city,
      join_code: org.join_code,
    } satisfies OrgResult;
  });
