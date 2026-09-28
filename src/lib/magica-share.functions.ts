import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Compartilhamento de criações da Tela Mágica entre mesas.
 * Cada criação pertence à mesa/instituição que a criou; o link gera uma CÓPIA
 * na mesa que o abre, sem dar acesso ao restante do histórico.
 */
function token(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const createMagicShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ creationId: z.string().uuid(), days: z.number().int().min(1).max(3650).default(30) }).parse(d))
  .handler(async ({ data, context }) => {
    // RLS garante que só quem enxerga a criação pode compartilhá-la.
    const { data: c } = await context.supabase.from("magic_creations").select("id").eq("id", data.creationId).maybeSingle();
    if (!c) throw new Error("not_found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const value = token();
    const expires_at = new Date(Date.now() + data.days * 86400_000).toISOString();
    const { error } = await supabaseAdmin
      .from("magic_shares")
      .insert({ token: value, creation_id: c.id, created_by: context.userId, expires_at });
    if (error) throw new Error("share_failed");
    return { token: value, expiresAt: expires_at };
  });

export const importMagicShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().trim().min(6).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const code = data.token.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: share } = await supabaseAdmin
      .from("magic_shares")
      .select("creation_id, expires_at")
      .eq("token", code)
      .maybeSingle();
    if (!share || new Date(share.expires_at).getTime() < Date.now()) throw new Error("invalid_share");
    const { data: src } = await supabaseAdmin
      .from("magic_creations")
      .select("kind, title, input_text, result, drawing_url, image_url")
      .eq("id", share.creation_id)
      .maybeSingle();
    if (!src) throw new Error("invalid_share");
    const { data: prof } = await context.supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: row, error } = await context.supabase
      .from("magic_creations")
      .insert({ ...src, owner_id: context.userId, organization_id: prof?.organization_id ?? null, student_id: null })
      .select("id, title")
      .single();
    if (error || !row) throw new Error("import_failed");
    return row;
  });
