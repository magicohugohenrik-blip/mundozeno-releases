import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev";
const TEXT_MODEL = "openai/gpt-6-astra";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

const LANG_NAME: Record<string, string> = { pt: "português do Brasil", en: "English", es: "español" };

const SAFETY = `Você cria conteúdo educativo para crianças (incluindo neurodivergentes) usado por professores e terapeutas.
Regras fixas: linguagem simples e acolhedora, frases curtas, nada violento, adulto, médico ou assustador; nunca peça dados pessoais.
Responda SEMPRE apenas com um objeto JSON válido, sem texto fora do JSON.`;

function friendly(status: number): string {
  if (status === 402) return "ai_credits";
  if (status === 429) return "ai_busy";
  if (status === 403) return "ai_denied";
  return "ai_error";
}

/** Chama /v1/responses em streaming e devolve o texto final acumulado. */
async function respond(apiKey: string, instructions: string, content: Record<string, unknown>[]): Promise<string> {
  const res = await fetch(`${GATEWAY}/v1/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: TEXT_MODEL,
      instructions,
      input: [{ role: "user", content: [{ type: "input_text", text: "Responda em json." }, ...content] }],
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_object" } },
    }),
  });
  if (!res.ok || !res.body) {
    console.error("magica respond", res.status, await res.text().catch(() => ""));
    throw new Error(friendly(res.status));
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  let refused = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as { type?: string; delta?: string; error?: unknown };
          if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
          else if (ev.type === "response.refusal.delta") refused = true;
          else if (ev.type === "error" || ev.type === "response.failed") throw new Error("ai_error");
        } catch (e) {
          if (e instanceof Error && e.message === "ai_error") throw e;
        }
      }
    }
  }
  if (refused && !out) throw new Error("ai_refused");
  return out;
}

function parseJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("ai_error");
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

/** Contexto profissional: orienta o foco pedagógico/clínico da IA. */
const PROFESSION_CONTEXT: Record<string, string> = {
  general: "Profissional multidisciplinar de educação infantil. Foque em aprendizagem lúdica e ampla.",
  speech:
    "Fonoaudiólogo(a). Foque em consciência fonológica, sons das letras, sílabas, rimas, praxias orofaciais e vocabulário. Nunca sugira receitas.",
  psychopedagogy:
    "Psicopedagogo(a). Foque em atenção, memória de trabalho, funções executivas, raciocínio e organização do pensamento. Nunca sugira receitas.",
  occupational:
    "Terapeuta ocupacional. Foque em coordenação motora, sequência de rotinas, autonomia e integração sensorial. Nunca sugira receitas.",
  math:
    "Professor(a) de matemática. Foque em números, contagem, quantidades, somas simples, formas geométricas, padrões e lógica. Nunca sugira receitas.",
  literacy:
    "Professor(a) de alfabetização. Foque em letras, sílabas, formação de palavras, leitura inicial e escrita. Nunca sugira receitas.",
  nutrition:
    "Nutricionista infantil. Foque em alimentos, grupos alimentares, hábitos saudáveis e receitas simples e seguras para crianças com ajuda de um adulto.",
  psychology:
    "Psicólogo(a) infantil. Foque em emoções, autorregulação, empatia e habilidades socioemocionais. Nunca sugira receitas.",
};

function professionLine(p?: string): string {
  const c = PROFESSION_CONTEXT[p ?? "general"] ?? PROFESSION_CONTEXT["general"]!;
  return `Perfil do profissional que está usando o quadro: ${c}\nAdapte todo o conteúdo a esse perfil.`;
}

const baseInput = z.object({
  image: z.string().max(4_000_000).startsWith("data:image/"),
  texts: z.array(z.string().max(300)).max(20),
  lang: z.enum(["pt", "en", "es"]),
  profession: z.string().max(40).optional(),
});


export const interpretBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => baseInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("ai_error");
    const text = await respond(
      apiKey,
      `${SAFETY}\nIdioma da resposta: ${LANG_NAME[data.lang]}.
${professionLine(data.profession)}
Interprete o desenho e os textos do quadro. Formato:
{"object":"o que foi desenhado","emoji":"um emoji","context":"tema (ex: alimentação)","intent":"o que o profissional quer","summary":"1 frase explicando o que entendeu","suggestions":["activity","game","story","explain","challenge","recipe","transform","cartoon3d"]}
Em suggestions coloque de 3 a 6 ações mais úteis, na ordem de relevância; inclua "recipe" só se o perfil for de nutrição e o tema for comida.`,
      [
        { type: "input_text", text: `Textos escritos no quadro: ${data.texts.join(" | ") || "(nenhum)"}` },
        { type: "input_image", image_url: data.image },
      ],
    );
    const j = parseJson(text);
    return z
      .object({
        object: z.string().catch(""),
        emoji: z.string().catch("✨"),
        context: z.string().catch(""),
        intent: z.string().catch(""),
        summary: z.string().catch(""),
        suggestions: z.array(z.string()).catch([]),
      })
      .parse(j);
  });

const ACTION_PROMPTS: Record<string, string> = {
  activity: `Crie uma atividade interativa. Escolha o tipo mais adequado entre: quiz, truefalse, sequence, classify, count, memory.
Formatos:
quiz: {"kind":"activity","type":"quiz","title":"","instruction":"","questions":[{"question":"","options":[{"label":"","emoji":""}],"answer":"label correto"}]} (3 a 5 perguntas, 3 opções)
truefalse: {"kind":"activity","type":"truefalse","title":"","instruction":"","statements":[{"text":"","emoji":"","answer":true}]} (4 a 6)
sequence: {"kind":"activity","type":"sequence","title":"","instruction":"","steps":[{"label":"","emoji":""}]} (3 a 5 na ordem correta)
classify: {"kind":"activity","type":"classify","title":"","instruction":"","categories":["A","B"],"items":[{"label":"","emoji":"","category":"A"}]} (6 itens)
count: {"kind":"activity","type":"count","title":"","instruction":"","rounds":[{"emoji":"","count":3,"options":[2,3,4]}]} (3 rodadas, count de 1 a 9)
memory: {"kind":"activity","type":"memory","title":"","instruction":"","pairs":[{"label":"","emoji":""}]} (4 a 6 pares)`,
  game: `Crie um pequeno jogo. Use o tipo "memory" ou "quiz" no mesmo formato de atividade: {"kind":"activity","type":"memory"|"quiz",...}.
memory: {"kind":"activity","type":"memory","title":"","instruction":"","pairs":[{"label":"","emoji":""}]} (6 pares)
quiz: {"kind":"activity","type":"quiz","title":"","instruction":"","questions":[{"question":"","options":[{"label":"","emoji":""}],"answer":""}]}`,
  challenge: `Crie um desafio curto como quiz de 1 pergunta: {"kind":"activity","type":"quiz","title":"","instruction":"","questions":[{"question":"","options":[{"label":"","emoji":""}],"answer":""}]}`,
  story: `Crie uma história curta (4 a 6 parágrafos pequenos): {"kind":"story","title":"","emoji":"","paragraphs":[""]}`,
  explain: `Explique o tema para uma criança: {"kind":"explain","title":"","emoji":"","paragraphs":[""],"funFact":""}`,
  recipe: `Crie uma receita simples e saudável adequada para crianças (com ajuda de um adulto): {"kind":"recipe","title":"","emoji":"","ingredients":[""],"steps":[""],"tip":""}`,
};

export const generateMagic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    baseInput
      .extend({
        action: z.enum(["activity", "game", "challenge", "story", "explain", "recipe"]),
        understood: z.string().max(600),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("ai_error");
    const text = await respond(
      apiKey,
      `${SAFETY}\nIdioma da resposta: ${LANG_NAME[data.lang]}.\n${professionLine(data.profession)}\n${ACTION_PROMPTS[data.action]}\nUse emojis nos itens sempre que possível.`,
      [
        {
          type: "input_text",
          text: `O que foi entendido do quadro: ${data.understood}\nTextos do quadro: ${data.texts.join(" | ") || "(nenhum)"}`,
        },
        { type: "input_image", image_url: data.image },
      ],
    );
    return { json: JSON.stringify(parseJson(text)) };
  });

export const transformDrawing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    baseInput
      .extend({ mode: z.enum(["transform", "cartoon3d"]), preserve: z.boolean(), understood: z.string().max(600) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("ai_error");
    const [meta, b64] = data.image.split(",");
    const mime = /data:(.*?);/.exec(meta ?? "")?.[1] ?? "image/png";
    const bytes = Uint8Array.from(atob(b64 ?? ""), (c) => c.charCodeAt(0));
    const style =
      data.mode === "cartoon3d"
        ? "Recrie como uma ilustração 3D estilo cartoon infantil, cores vivas, iluminação suave, fundo limpo."
        : "Transforme em uma ilustração infantil bonita e colorida, traço limpo, fundo limpo.";
    const keep = data.preserve
      ? "Preserve fielmente a composição, as formas, as proporções e o jeito infantil do desenho original, para que a criança reconheça o próprio desenho."
      : "Mantenha a mesma ideia e composição do desenho.";
    const prompt = `${style} ${keep} Conteúdo: ${data.understood}. Sem texto escrito na imagem. Adequado para crianças.`;
    const form = new FormData();
    form.set("model", IMAGE_MODEL);
    form.set("prompt", prompt);
    form.set("image", new File([bytes], "board.png", { type: mime }));
    const res = await fetch(`${GATEWAY}/v1/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      console.error("magica image", res.status, await res.text().catch(() => ""));
      throw new Error(friendly(res.status));
    }
    const j = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const first = j.data?.[0];
    const url = first?.b64_json ? `data:image/png;base64,${first.b64_json}` : first?.url;
    if (!url) throw new Error("ai_error");
    return { imageUrl: url };
  });
