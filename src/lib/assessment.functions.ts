import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAssessment } from "@/lib/assessment.server";

/**
 * Gera uma avaliação pedagógica da criança combinando anamnese, CIDs e a
 * jogabilidade registrada (sessões + eventos finos de acerto/erro/tempo).
 */
export const generateAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        studentId: z.string().uuid(),
        periodDays: z.number().int().min(7).max(365).default(90),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) =>
    buildAssessment(context.supabase, context.userId, data.studentId, data.periodDays),
  );
