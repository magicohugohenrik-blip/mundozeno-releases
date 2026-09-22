/**
 * Perfil pedagógico: habilidades trabalhadas pelas atividades.
 * Cada jogo declara uma ou mais habilidades; os relatórios futuros
 * agrupam o desempenho por habilidade sem precisar mudar os jogos.
 */
export type SkillId =
  | "reconhecimento-letras"
  | "vogais"
  | "consciencia-fonologica"
  | "som-inicial"
  | "associacao-imagem-palavra"
  | "formacao-palavras"
  | "leitura"
  | "compreensao"
  | "memoria"
  | "atencao"
  | "sequenciamento"
  | "articulacao"
  | "praxias-orais"
  | "sopro"
  | "nomeacao"
  | "vocabulario"
  | "discriminacao-auditiva"
  | "memoria-auditiva"
  | "compreensao-oral";

export const skillLabels: Record<"pt" | "en" | "es", Record<SkillId, string>> = {
  pt: {
    "reconhecimento-letras": "Reconhecimento de letras",
    vogais: "Vogais",
    "consciencia-fonologica": "Consciência fonológica",
    "som-inicial": "Som inicial",
    "associacao-imagem-palavra": "Associação imagem/palavra",
    "formacao-palavras": "Formação de palavras",
    leitura: "Leitura",
    compreensao: "Compreensão",
    memoria: "Memória",
    atencao: "Atenção",
    sequenciamento: "Sequenciamento",
    articulacao: "Articulação",
    "praxias-orais": "Praxias orais",
    sopro: "Sopro e respiração",
    nomeacao: "Nomeação",
    vocabulario: "Vocabulário",
    "discriminacao-auditiva": "Discriminação auditiva",
    "memoria-auditiva": "Memória auditiva",
    "compreensao-oral": "Compreensão oral",
  },
  en: {
    "reconhecimento-letras": "Letter recognition",
    vogais: "Vowels",
    "consciencia-fonologica": "Phonological awareness",
    "som-inicial": "Initial sound",
    "associacao-imagem-palavra": "Image/word matching",
    "formacao-palavras": "Word building",
    leitura: "Reading",
    compreensao: "Comprehension",
    memoria: "Memory",
    atencao: "Attention",
    sequenciamento: "Sequencing",
    articulacao: "Articulation",
    "praxias-orais": "Oral motor skills",
    sopro: "Blowing and breathing",
    nomeacao: "Naming",
    vocabulario: "Vocabulary",
    "discriminacao-auditiva": "Auditory discrimination",
    "memoria-auditiva": "Auditory memory",
    "compreensao-oral": "Listening comprehension",
  },
  es: {
    "reconhecimento-letras": "Reconocimiento de letras",
    vogais: "Vocales",
    "consciencia-fonologica": "Conciencia fonológica",
    "som-inicial": "Sonido inicial",
    "associacao-imagem-palavra": "Asociación imagen/palabra",
    "formacao-palavras": "Formación de palabras",
    leitura: "Lectura",
    compreensao: "Comprensión",
    memoria: "Memoria",
    atencao: "Atención",
    sequenciamento: "Secuenciación",
    articulacao: "Articulación",
    "praxias-orais": "Praxias orales",
    sopro: "Soplo y respiración",
    nomeacao: "Nombrar",
    vocabulario: "Vocabulario",
    "discriminacao-auditiva": "Discriminación auditiva",
    "memoria-auditiva": "Memoria auditiva",
    "compreensao-oral": "Comprensión oral",
  },
};
