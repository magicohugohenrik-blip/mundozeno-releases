// Anamnese da criança preenchida no cadastro (inspirada no fluxo clínico da BIA).
// Guardada em students.anamnesis (jsonb) — texto livre curto por campo.

export interface AnamnesisField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  group: string;
}

export const anamnesisFields: AnamnesisField[] = [
  // Identificação e queixa
  { key: "responsible", label: "Responsável", placeholder: "Nome do responsável", type: "text", group: "Identificação" },
  { key: "contact", label: "Contato", placeholder: "Telefone ou e-mail", type: "text", group: "Identificação" },
  { key: "school_grade", label: "Escolaridade / série", placeholder: "Ex.: Maternal II", type: "text", group: "Identificação" },
  { key: "referred_by", label: "Encaminhado por", placeholder: "Escola, pediatra, neurologista…", type: "text", group: "Identificação" },
  { key: "main_complaint", label: "Queixa principal", placeholder: "O que motivou a avaliação", type: "textarea", group: "Identificação" },

  // Gestação e nascimento
  { key: "pregnancy", label: "Gestação", placeholder: "Intercorrências, uso de medicação…", type: "textarea", group: "Gestação e nascimento" },
  { key: "birth_type", label: "Tipo de parto", placeholder: "", type: "select", options: ["", "Normal", "Cesárea", "Fórceps", "Não informado"], group: "Gestação e nascimento" },
  { key: "birth_weeks", label: "Semanas de gestação", placeholder: "Ex.: 38", type: "text", group: "Gestação e nascimento" },
  { key: "birth_issues", label: "Intercorrências no nascimento", placeholder: "UTI neonatal, icterícia, oxigenação…", type: "textarea", group: "Gestação e nascimento" },

  // Desenvolvimento
  { key: "milestone_head", label: "Sustentou a cabeça", placeholder: "Idade aproximada", type: "text", group: "Desenvolvimento" },
  { key: "milestone_sit", label: "Sentou sozinha", placeholder: "Idade aproximada", type: "text", group: "Desenvolvimento" },
  { key: "milestone_walk", label: "Andou", placeholder: "Idade aproximada", type: "text", group: "Desenvolvimento" },
  { key: "milestone_speak", label: "Primeiras palavras", placeholder: "Idade aproximada", type: "text", group: "Desenvolvimento" },
  { key: "motor", label: "Coordenação motora", placeholder: "Motricidade fina e ampla", type: "textarea", group: "Desenvolvimento" },

  // Comunicação e comportamento
  { key: "communication", label: "Comunicação", placeholder: "Fala, gestos, comunicação alternativa…", type: "textarea", group: "Comunicação e comportamento" },
  { key: "social", label: "Interação social", placeholder: "Contato visual, brincar com outras crianças…", type: "textarea", group: "Comunicação e comportamento" },
  { key: "attention", label: "Atenção e concentração", placeholder: "Tempo de permanência em atividades", type: "textarea", group: "Comunicação e comportamento" },
  { key: "behavior", label: "Comportamento", placeholder: "Crises, estereotipias, agitação…", type: "textarea", group: "Comunicação e comportamento" },
  { key: "sensory", label: "Sensibilidade sensorial", placeholder: "Sons, luzes, texturas, toque…", type: "textarea", group: "Comunicação e comportamento" },

  // Rotina e saúde
  { key: "sleep", label: "Sono", placeholder: "Qualidade e rotina do sono", type: "textarea", group: "Rotina e saúde" },
  { key: "feeding", label: "Alimentação", placeholder: "Seletividade, autonomia…", type: "textarea", group: "Rotina e saúde" },
  { key: "health_history", label: "Histórico de saúde", placeholder: "Doenças, cirurgias, convulsões…", type: "textarea", group: "Rotina e saúde" },
  { key: "medications", label: "Medicações em uso", placeholder: "Nome e dosagem", type: "textarea", group: "Rotina e saúde" },
  { key: "therapies", label: "Terapias em andamento", placeholder: "Fono, TO, psicologia, ABA…", type: "textarea", group: "Rotina e saúde" },
  { key: "family_history", label: "Histórico familiar", placeholder: "Casos semelhantes na família", type: "textarea", group: "Rotina e saúde" },

  // Objetivos
  { key: "strengths", label: "Interesses e pontos fortes", placeholder: "O que a criança gosta e faz bem", type: "textarea", group: "Objetivos" },
  { key: "goals", label: "Objetivos terapêuticos/pedagógicos", placeholder: "O que se espera desenvolver", type: "textarea", group: "Objetivos" },
  { key: "notes", label: "Observações gerais", placeholder: "Qualquer informação relevante", type: "textarea", group: "Objetivos" },
];

export const anamnesisGroups = [...new Set(anamnesisFields.map((f) => f.group))];

export type Anamnesis = Record<string, string>;

export function emptyAnamnesis(): Anamnesis {
  return {};
}

export function anamnesisFilled(a: Anamnesis | null | undefined): number {
  if (!a) return 0;
  return anamnesisFields.filter((f) => (a[f.key] ?? "").trim().length > 0).length;
}

/** Texto legível da anamnese, usado no relatório e no prompt da avaliação. */
export function anamnesisToText(a: Anamnesis | null | undefined): string {
  if (!a) return "";
  return anamnesisFields
    .filter((f) => (a[f.key] ?? "").trim())
    .map((f) => `${f.label}: ${a[f.key]!.trim()}`)
    .join("\n");
}
