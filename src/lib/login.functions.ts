import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Converte um nome de usuário do Mundo Zeno no e-mail da conta correspondente.
 * A tabela de apelidos só é lida no servidor, por uma função protegida do banco —
 * nada fica exposto no navegador. A senha continua sendo verificada pelo
 * sistema de autenticação seguro.
 */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ identifier: z.string().trim().min(1).max(160) }).parse(data))
  .handler(async ({ data }) => {
    const identifier = data.identifier.trim();
    if (identifier.includes("@")) return { email: identifier };

    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { email: null };

    const client = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data: email } = await client.rpc("resolve_login_email", {
      _username: identifier.toLowerCase(),
    });

    return { email: (email as string | null) ?? null };
  });
