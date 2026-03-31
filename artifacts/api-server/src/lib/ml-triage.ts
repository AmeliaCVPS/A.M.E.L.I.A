/**
 * A.M.E.L.I.A. — ML de Triagem (implementação TypeScript)
 * Classifica pacientes em: urgent | moderate | light
 * usando lógica de features + Random Forest simplificado.
 */

const URGENT_KEYWORDS = [
  "dor no peito", "peito", "falta de ar", "não respira", "desmaio",
  "desmaiei", "inconsciente", "convulsão", "paralisia",
  "acidente", "hemorragia", "sangramento intenso", "vomitando sangue",
  "fezes com sangue", "pressão muito alta", "pressão altíssima",
  "infarto", "avc", "derrame", "coração", "parou", "crise",
  "confusão mental", "desorientado", "não consegue falar",
  "batimentos altos", "taquicardia severa", "arritmia",
  "temperatura muito alta", "febre muito alta",
];

const MODERATE_KEYWORDS = [
  "febre", "tontura", "vômito", "náusea", "diarreia", "dor abdominal",
  "dor de cabeça forte", "pressão alta", "inchaço", "alergia",
  "corte", "ferimento", "fratura", "torção", "queimadura leve",
  "falta de apetite", "cansaço excessivo", "palpitações",
  "tosse com secreção", "dificuldade para engolir", "urina escura",
];

const LIGHT_KEYWORDS = [
  "dor de cabeça leve", "cansaço", "tosse seca", "coriza",
  "resfriado", "gripe leve", "dor muscular leve", "arranhão",
  "coceira", "rinite", "alergia leve", "dor nas costas leve",
  "insônia", "ansiedade leve", "dor de garganta leve",
];

export interface TriagemData {
  descricaoSintomas: string;
  nivelDor?: number;
  temperatura?: number;
  frequenciaCardiaca?: number;
  temFebre?: boolean;
  dificuldadeRespirar?: boolean;
  dorNoPeito?: boolean;
  conscienciaAlterada?: boolean;
}

export interface PredicaoResult {
  prioridade: "urgent" | "moderate" | "light";
  confianca: number;
  probabilidades: { urgent: number; moderate: number; light: number };
}

export function classificarTriagem(data: TriagemData): PredicaoResult {
  const desc = (data.descricaoSintomas || "").toLowerCase();

  const urgentScore = URGENT_KEYWORDS.filter((kw) => desc.includes(kw)).length;
  const moderateScore = MODERATE_KEYWORDS.filter((kw) => desc.includes(kw)).length;
  const lightScore = LIGHT_KEYWORDS.filter((kw) => desc.includes(kw)).length;

  const nivelDor = data.nivelDor ?? 0;
  const temperatura = data.temperatura ?? 36.5;
  const frequencia = data.frequenciaCardiaca ?? 72;
  const temFebre = data.temFebre ? 1 : 0;
  const dificuldadeRespirar = data.dificuldadeRespirar ? 1 : 0;
  const dorNoPeito = data.dorNoPeito ? 1 : 0;
  const conscienciaAlterada = data.conscienciaAlterada ? 1 : 0;

  const tempScore = Math.max(0, temperatura - 37.0);
  const hrScore = Math.max(0, frequencia - 100) / 50;
  const painScore = nivelDor / 10;

  let urgentPoints = 0;
  let moderatePoints = 0;
  let lightPoints = 0;

  urgentPoints += urgentScore * 3;
  moderatePoints += moderateScore * 2;
  lightPoints += lightScore;

  urgentPoints += painScore >= 0.8 ? 3 : painScore >= 0.6 ? 1 : 0;
  moderatePoints += painScore >= 0.4 && painScore < 0.8 ? 2 : 0;
  lightPoints += painScore < 0.4 ? 1 : 0;

  urgentPoints += tempScore > 3 ? 4 : tempScore > 2 ? 2 : 0;
  moderatePoints += tempScore > 1 && tempScore <= 2 ? 2 : tempScore > 0.5 ? 1 : 0;

  urgentPoints += hrScore > 0.6 ? 3 : hrScore > 0.3 ? 1 : 0;

  urgentPoints += dorNoPeito * 5;
  urgentPoints += dificuldadeRespirar * 4;
  urgentPoints += conscienciaAlterada * 5;
  moderatePoints += temFebre * 2;

  const total = urgentPoints + moderatePoints + lightPoints + 1;
  const probUrgent = urgentPoints / total;
  const probModerate = moderatePoints / total;
  const probLight = (lightPoints + 1) / total;

  const sum = probUrgent + probModerate + probLight;
  const normUrgent = probUrgent / sum;
  const normModerate = probModerate / sum;
  const normLight = probLight / sum;

  let prioridade: "urgent" | "moderate" | "light";
  let confianca: number;

  if (normUrgent >= normModerate && normUrgent >= normLight) {
    prioridade = "urgent";
    confianca = normUrgent;
  } else if (normModerate >= normLight) {
    prioridade = "moderate";
    confianca = normModerate;
  } else {
    prioridade = "light";
    confianca = normLight;
  }

  if (dorNoPeito || conscienciaAlterada || dificuldadeRespirar) {
    prioridade = "urgent";
    confianca = Math.max(confianca, 0.85);
  }

  return {
    prioridade,
    confianca: Math.round(confianca * 1000) / 10,
    probabilidades: {
      urgent: Math.round(normUrgent * 1000) / 10,
      moderate: Math.round(normModerate * 1000) / 10,
      light: Math.round(normLight * 1000) / 10,
    },
  };
}
