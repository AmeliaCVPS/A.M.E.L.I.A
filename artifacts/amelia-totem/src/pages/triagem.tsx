import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useRealizarTriagem } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, AlertTriangle, Activity, Thermometer,
  HeartPulse, BrainCircuit, Clock, Pill, Stethoscope, Wind,
  Brain, Waves, Zap, Flame, Droplets
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const TOTAL_STEPS = 4;

function BreathingOrb() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(46,74,122,0.35) 0%, transparent 70%)", width: 600, height: 600 }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-72 h-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-3">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className="relative h-2 rounded-full overflow-hidden flex-1 bg-white/15">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-white"
            initial={false}
            animate={{ width: step > i ? "100%" : "0%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Categorias de sintomas ──
const SYMPTOM_CATEGORIES = [
  {
    key: "cabeca",
    icon: Brain,
    label: "Cabeça / Neurológico",
    color: "purple",
    symptoms: [
      "Dor de cabeça",
      "Tontura / vertigem",
      "Visão embaçada",
      "Convulsão",
      "Formigamento no rosto",
      "Dificuldade para falar",
    ],
  },
  {
    key: "respiratorio",
    icon: Wind,
    label: "Respiratório",
    color: "blue",
    symptoms: [
      "Tosse seca",
      "Tosse com catarro",
      "Coriza / nariz entupido",
      "Dor de garganta",
      "Chiado no peito",
      "Pigarro persistente",
    ],
  },
  {
    key: "cardio",
    icon: HeartPulse,
    label: "Coração / Circulação",
    color: "red",
    symptoms: [
      "Palpitações / coração acelerado",
      "Pressão alta conhecida",
      "Inchaço nas pernas / pés",
      "Dormência no braço esquerdo",
      "Falta de ar ao se deitar",
    ],
  },
  {
    key: "gastro",
    icon: Waves,
    label: "Digestivo / Abdominal",
    color: "orange",
    symptoms: [
      "Náusea",
      "Vômito",
      "Diarreia",
      "Dor abdominal",
      "Prisão de ventre",
      "Sangue nas fezes",
      "Azia / refluxo intenso",
    ],
  },
  {
    key: "musculo",
    icon: Zap,
    label: "Músculos / Articulações",
    color: "yellow",
    symptoms: [
      "Dor nas costas",
      "Dor no pescoço",
      "Dor nas articulações",
      "Dor muscular generalizada",
      "Dificuldade para se mover",
      "Rigidez muscular",
    ],
  },
  {
    key: "pele",
    icon: Flame,
    label: "Pele / Alérgico",
    color: "green",
    symptoms: [
      "Manchas / vermelhidão",
      "Coceira intensa",
      "Inchaço no rosto / lábios",
      "Bolhas na pele",
      "Erupção cutânea",
      "Picada de inseto / animal",
    ],
  },
  {
    key: "geral",
    icon: Droplets,
    label: "Geral / Outros",
    color: "slate",
    symptoms: [
      "Calafrios / tremores",
      "Fraqueza / cansaço extremo",
      "Suor excessivo",
      "Perda de apetite",
      "Dor ao urinar",
      "Sangramento inesperado",
      "Desmaio recente",
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; active: string; badge: string }> = {
  purple: { bg: "hover:bg-purple-500/10", active: "bg-purple-500/20 border-purple-400/50", badge: "text-purple-300" },
  blue:   { bg: "hover:bg-blue-500/10",   active: "bg-blue-500/20 border-blue-400/50",     badge: "text-blue-300" },
  red:    { bg: "hover:bg-red-500/10",     active: "bg-red-500/20 border-red-400/50",       badge: "text-red-300" },
  orange: { bg: "hover:bg-orange-500/10", active: "bg-orange-500/20 border-orange-400/50", badge: "text-orange-300" },
  yellow: { bg: "hover:bg-yellow-500/10", active: "bg-yellow-500/20 border-yellow-400/50", badge: "text-yellow-300" },
  green:  { bg: "hover:bg-green-500/10",  active: "bg-green-500/20 border-green-400/50",   badge: "text-green-300" },
  slate:  { bg: "hover:bg-slate-500/10",  active: "bg-slate-500/20 border-slate-400/50",   badge: "text-slate-300" },
};

const DURATIONS = [
  { value: "menos_1h", label: "Menos de 1 hora" },
  { value: "1_6h", label: "1 a 6 horas" },
  { value: "6_24h", label: "6 a 24 horas" },
  { value: "mais_24h", label: "Mais de 24 horas" },
];

const CONDITIONS = [
  { key: "hipertensao", label: "Hipertensão" },
  { key: "diabetes", label: "Diabetes" },
  { key: "cardiopatia", label: "Problemas cardíacos" },
  { key: "asma_dpoc", label: "Asma / DPOC" },
  { key: "renal", label: "Doença renal" },
  { key: "gestante", label: "Gestante" },
];

export default function Triagem() {
  const [, setLocation] = useLocation();
  const { usuario, isLoading: isAuthLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const triagemMutation = useRealizarTriagem();

  const [formData, setFormData] = useState({
    descricaoSintomas: "",
    sintomasSelecionados: [] as string[],
    dorNoPeito: false,
    dificuldadeRespirar: false,
    temFebre: false,
    conscienciaAlterada: false,
    nivelDor: 0,
    temperatura: "",
    frequenciaCardiaca: "",
  });

  const [historico, setHistorico] = useState({
    duracaoSintomas: "",
    condicoes: [] as string[],
    tomaMedicamentos: false,
    quaisMedicamentos: "",
    temAlergias: false,
    quaisAlergias: "",
    ultimaRefeicao: "",
  });

  useEffect(() => {
    if (!isAuthLoading && !usuario) setLocation("/login");
  }, [isAuthLoading, usuario, setLocation]);

  if (isAuthLoading || !usuario) return null;

  const hasSevereSymptom = formData.dorNoPeito || formData.dificuldadeRespirar || formData.conscienciaAlterada;

  const toggleSintoma = (s: string) => {
    setFormData(prev => ({
      ...prev,
      sintomasSelecionados: prev.sintomasSelecionados.includes(s)
        ? prev.sintomasSelecionados.filter(x => x !== s)
        : [...prev.sintomasSelecionados, s],
    }));
  };

  const toggleCondicao = (key: string) => {
    setHistorico(prev => ({
      ...prev,
      condicoes: prev.condicoes.includes(key)
        ? prev.condicoes.filter(c => c !== key)
        : [...prev.condicoes, key],
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      const temDescricao = formData.descricaoSintomas.trim().length >= 5;
      const temSintomas = formData.sintomasSelecionados.length > 0;
      const temAlerta = formData.dorNoPeito || formData.dificuldadeRespirar || formData.conscienciaAlterada || formData.temFebre;
      if (!temDescricao && !temSintomas && !temAlerta) {
        toast.error("Descreva o que está sentindo ou selecione pelo menos um sintoma.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else setLocation("/");
  };

  const buildDescricao = () => {
    const parts: string[] = [];
    if (formData.descricaoSintomas.trim()) parts.push(formData.descricaoSintomas.trim());
    if (formData.sintomasSelecionados.length > 0)
      parts.push(`Sintomas: ${formData.sintomasSelecionados.join(", ")}`);
    if (historico.duracaoSintomas) {
      const dur = DURATIONS.find(d => d.value === historico.duracaoSintomas);
      if (dur) parts.push(`Duração: ${dur.label}`);
    }
    if (historico.condicoes.length > 0) {
      const labels = historico.condicoes.map(c => CONDITIONS.find(x => x.key === c)?.label).filter(Boolean);
      parts.push(`Condições: ${labels.join(", ")}`);
    }
    if (historico.tomaMedicamentos && historico.quaisMedicamentos)
      parts.push(`Medicamentos: ${historico.quaisMedicamentos}`);
    if (historico.temAlergias && historico.quaisAlergias)
      parts.push(`Alergias: ${historico.quaisAlergias}`);
    if (historico.ultimaRefeicao)
      parts.push(`Última refeição: ${historico.ultimaRefeicao}`);
    return parts.join(" | ") || "Não especificado";
  };

  const handleSubmit = () => {
    const descricao = buildDescricao();
    triagemMutation.mutate({
      data: {
        descricaoSintomas: descricao,
        dorNoPeito: formData.dorNoPeito,
        dificuldadeRespirar: formData.dificuldadeRespirar,
        temFebre: formData.temFebre,
        conscienciaAlterada: formData.conscienciaAlterada,
        nivelDor: formData.nivelDor,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : undefined,
        frequenciaCardiaca: formData.frequenciaCardiaca ? parseInt(formData.frequenciaCardiaca) : undefined,
      }
    }, {
      onSuccess: (ticket) => setLocation(`/senha/${ticket.id}`),
      onError: (err: any) => {
        const msg = err?.data?.mensagem || "Erro ao processar triagem. Verifique se está logado e tente novamente.";
        toast.error(msg);
      },
    });
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col p-4 sm:p-6 max-w-4xl mx-auto relative">
      <BreathingOrb />

      {/* Header / Progress */}
      <div className="relative z-10 flex items-center justify-between mb-5 mt-2">
        <Button
          variant="ghost" size="icon"
          className="rounded-full text-white hover:bg-white/20 w-11 h-11 shrink-0"
          onClick={handleBack}
          disabled={triagemMutation.isPending}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1 mx-4">
          <ProgressBar step={step} />
          <p className="text-center text-white/40 text-xs mt-1.5">Etapa {step} de {TOTAL_STEPS}</p>
        </div>
        <div className="w-11 shrink-0" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── ETAPA 1 — SINTOMAS ── */}
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col gap-4"
            >
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-0.5">O que você está sentindo?</h1>
                <p className="text-blue-200/80 text-base">Descreva ou selecione seus sintomas abaixo.</p>
              </motion.div>

              {/* Free text */}
              <Textarea
                value={formData.descricaoSintomas}
                onChange={(e) => setFormData({ ...formData, descricaoSintomas: e.target.value })}
                placeholder="Ex: Dor de cabeça forte desde ontem, com enjoo..."
                className="min-h-[90px] text-lg p-4 bg-white/10 border-white/20 text-white placeholder:text-white/35 focus:border-white/60 rounded-2xl resize-none"
              />

              {/* Symptom category selector */}
              <div className="space-y-2">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Selecione seus sintomas</p>
                {SYMPTOM_CATEGORIES.map((cat) => {
                  const colors = COLOR_MAP[cat.color];
                  const Icon = cat.icon;
                  const selectedInCat = cat.symptoms.filter(s => formData.sintomasSelecionados.includes(s));
                  const isExpanded = expandedCategory === cat.key;

                  return (
                    <div key={cat.key} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${colors.badge}`} />
                          <span className="text-white font-medium text-sm">{cat.label}</span>
                          {selectedInCat.length > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 ${colors.badge} font-bold`}>
                              {selectedInCat.length}
                            </span>
                          )}
                        </div>
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-white/40 text-lg leading-none"
                        >
                          ›
                        </motion.span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 grid grid-cols-2 gap-1.5">
                              {cat.symptoms.map((s) => {
                                const selected = formData.sintomasSelecionados.includes(s);
                                return (
                                  <motion.label
                                    key={s} whileTap={{ scale: 0.97 }}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer border text-sm transition-all ${selected ? colors.active : `bg-black/20 border-transparent ${colors.bg}`}`}
                                  >
                                    <Checkbox
                                      checked={selected}
                                      onCheckedChange={() => toggleSintoma(s)}
                                      className="w-5 h-5 rounded border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white shrink-0"
                                    />
                                    <span className="text-white/90 leading-tight">{s}</span>
                                  </motion.label>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Selected symptoms summary */}
              {formData.sintomasSelecionados.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {formData.sintomasSelecionados.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSintoma(s)}
                      className="px-2.5 py-1 bg-white/15 text-white text-xs rounded-full border border-white/25 hover:bg-red-500/20 hover:border-red-400/40 transition-colors"
                    >
                      {s} ×
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Severe alerts */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                  Sintomas de Emergência — Marque se tiver agora
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "dorNoPeito",          label: "Dor forte no peito",          color: "red" },
                    { key: "dificuldadeRespirar",  label: "Falta de ar severa",          color: "red" },
                    { key: "conscienciaAlterada",  label: "Confusão mental / desmaio",   color: "red" },
                    { key: "temFebre",             label: "Febre alta",                  color: "yellow" },
                  ].map(({ key, label, color }) => {
                    const checked = formData[key as keyof typeof formData] as boolean;
                    const cls = color === "red"
                      ? { active: "bg-red-500/20 border-red-400/40", check: "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" }
                      : { active: "bg-yellow-500/20 border-yellow-400/40", check: "data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500" };
                    return (
                      <motion.label key={key} whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${checked ? cls.active : "bg-black/20 border-transparent hover:bg-white/5"}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => setFormData({ ...formData, [key]: c as boolean })}
                          className={`w-6 h-6 rounded-lg border-white/40 ${cls.check}`}
                        />
                        <span className="text-sm font-medium text-white">{label}</span>
                      </motion.label>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {hasSevereSymptom && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-100 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-sm leading-snug">Sintomas graves detectados. Conclua a triagem e, se piorar, procure um enfermeiro imediatamente.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto pt-2">
                <Button onClick={handleNext} className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-lg py-5 h-auto rounded-2xl font-semibold">
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 2 — HISTÓRICO CLÍNICO ── */}
          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-0.5">Histórico Clínico</h1>
                <p className="text-blue-200/80 text-base mb-4">Essas informações ajudam a AMELIA a priorizar melhor.</p>
              </motion.div>

              <div className="space-y-4 pb-4 overflow-y-auto flex-1">
                {/* Duração */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-300" /> Há quanto tempo está assim?
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATIONS.map((d) => (
                      <motion.button key={d.value} whileTap={{ scale: 0.96 }}
                        onClick={() => setHistorico(prev => ({ ...prev, duracaoSintomas: d.value }))}
                        className={`p-3 rounded-xl text-sm font-medium border transition-all text-left ${historico.duracaoSintomas === d.value
                          ? "bg-blue-500/30 border-blue-400/60 text-white"
                          : "bg-black/20 border-white/10 text-white/70 hover:bg-white/10"}`}
                      >
                        {d.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Condições preexistentes */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-300" /> Condições de saúde conhecidas
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CONDITIONS.map((c) => {
                      const active = historico.condicoes.includes(c.key);
                      return (
                        <motion.label key={c.key} whileTap={{ scale: 0.97 }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all ${active ? "bg-blue-500/20 border-blue-400/50" : "bg-black/20 border-transparent hover:bg-white/5"}`}
                        >
                          <Checkbox
                            checked={active}
                            onCheckedChange={() => toggleCondicao(c.key)}
                            className="w-5 h-5 rounded border-white/40 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                          <span className="text-sm text-white">{c.label}</span>
                        </motion.label>
                      );
                    })}
                  </div>
                </div>

                {/* Medicamentos */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-300" /> Toma algum medicamento regularmente?
                  </h3>
                  <div className="flex gap-2 mb-3">
                    {["Sim", "Não"].map((opt) => {
                      const val = opt === "Sim";
                      return (
                        <motion.button key={opt} whileTap={{ scale: 0.96 }}
                          onClick={() => setHistorico(prev => ({ ...prev, tomaMedicamentos: val }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${historico.tomaMedicamentos === val
                            ? "bg-blue-500/30 border-blue-400/60 text-white"
                            : "bg-black/20 border-white/10 text-white/70 hover:bg-white/10"}`}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {historico.tomaMedicamentos && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <Input
                          value={historico.quaisMedicamentos}
                          onChange={(e) => setHistorico(prev => ({ ...prev, quaisMedicamentos: e.target.value }))}
                          placeholder="Ex: Losartana, Metformina, Rivotril..."
                          className="h-11 bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 rounded-xl"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Alergias */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-blue-300" /> Possui alguma alergia conhecida?
                  </h3>
                  <div className="flex gap-2 mb-3">
                    {["Sim", "Não"].map((opt) => {
                      const val = opt === "Sim";
                      return (
                        <motion.button key={opt} whileTap={{ scale: 0.96 }}
                          onClick={() => setHistorico(prev => ({ ...prev, temAlergias: val }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${historico.temAlergias === val
                            ? "bg-blue-500/30 border-blue-400/60 text-white"
                            : "bg-black/20 border-white/10 text-white/70 hover:bg-white/10"}`}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {historico.temAlergias && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <Input
                          value={historico.quaisAlergias}
                          onChange={(e) => setHistorico(prev => ({ ...prev, quaisAlergias: e.target.value }))}
                          placeholder="Ex: Penicilina, dipirona, látex..."
                          className="h-11 bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 rounded-xl"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Última refeição */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3">Quando foi sua última refeição?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["Menos de 2h", "2 a 6h", "Mais de 6h", "Não lembro"].map((opt) => (
                      <motion.button key={opt} whileTap={{ scale: 0.96 }}
                        onClick={() => setHistorico(prev => ({ ...prev, ultimaRefeicao: opt }))}
                        className={`p-2.5 rounded-xl text-sm font-medium border transition-all ${historico.ultimaRefeicao === opt
                          ? "bg-blue-500/30 border-blue-400/60 text-white"
                          : "bg-black/20 border-white/10 text-white/70 hover:bg-white/10"}`}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button onClick={handleNext} className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-lg py-5 h-auto rounded-2xl font-semibold">
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 3 — SINAIS VITAIS ── */}
          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-0.5">Sinais Vitais</h1>
                <p className="text-blue-200/80 text-base mb-6">Opcional — informe se tiver as medições disponíveis.</p>
              </motion.div>

              <div className="space-y-5 flex-1">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="w-6 h-6 text-blue-300" /> Nível de Dor
                    </h3>
                    <motion.div
                      key={formData.nivelDor}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-3xl font-black w-14 h-14 rounded-full flex items-center justify-center ${formData.nivelDor >= 7 ? "bg-red-500/30 text-red-200" : formData.nivelDor >= 4 ? "bg-yellow-500/30 text-yellow-200" : "bg-white/10 text-white"}`}
                    >
                      {formData.nivelDor}
                    </motion.div>
                  </div>
                  <Slider
                    value={[formData.nivelDor]}
                    max={10} step={1}
                    onValueChange={(vals) => setFormData({ ...formData, nivelDor: vals[0] })}
                    className="py-3"
                  />
                  <div className="flex justify-between mt-2 text-blue-200/60 text-sm">
                    <span>😌 Sem dor</span>
                    <span>😖 Dor máxima</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Thermometer className="w-6 h-6 text-blue-300" />
                      </div>
                      <div>
                        <p className="text-blue-200/70 text-xs font-medium uppercase tracking-wide">Temperatura</p>
                        <p className="text-white/50 text-xs">em °C</p>
                      </div>
                    </div>
                    <Input
                      type="number" step="0.1"
                      value={formData.temperatura}
                      onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                      placeholder="Ex: 37.5"
                      className="h-12 text-xl bg-black/20 border-transparent text-white focus:border-white/30 rounded-xl text-center"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center shrink-0"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <HeartPulse className="w-6 h-6 text-red-300" />
                      </motion.div>
                      <div>
                        <p className="text-blue-200/70 text-xs font-medium uppercase tracking-wide">Batimentos</p>
                        <p className="text-white/50 text-xs">bpm</p>
                      </div>
                    </div>
                    <Input
                      type="number"
                      value={formData.frequenciaCardiaca}
                      onChange={(e) => setFormData({ ...formData, frequenciaCardiaca: e.target.value })}
                      placeholder="Ex: 80"
                      className="h-12 text-xl bg-black/20 border-transparent text-white focus:border-white/30 rounded-xl text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <Button onClick={handleNext} className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-lg py-5 h-auto rounded-2xl font-semibold">
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 4 — REVISÃO ── */}
          {step === 4 && (
            <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-0.5">Revisão</h1>
                <p className="text-blue-200/80 text-base mb-4">Confira antes de gerar sua senha.</p>
              </motion.div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-4 flex-1 overflow-y-auto">
                {formData.descricaoSintomas && (
                  <div>
                    <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-wider mb-1">Queixa Descrita</p>
                    <p className="text-white leading-snug">{formData.descricaoSintomas}</p>
                  </div>
                )}

                {formData.sintomasSelecionados.length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-wider mb-2">Sintomas Selecionados</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.sintomasSelecionados.map(s => (
                          <span key={s} className="px-2.5 py-1 bg-white/10 text-white/90 text-xs rounded-full border border-white/15">{s}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px bg-white/10" />
                <div>
                  <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-wider mb-2">Alertas de Emergência</p>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.dorNoPeito && <span className="px-2.5 py-1 bg-red-500/20 text-red-200 text-xs rounded-full border border-red-500/30">Dor no peito</span>}
                    {formData.dificuldadeRespirar && <span className="px-2.5 py-1 bg-red-500/20 text-red-200 text-xs rounded-full border border-red-500/30">Falta de ar</span>}
                    {formData.conscienciaAlterada && <span className="px-2.5 py-1 bg-red-500/20 text-red-200 text-xs rounded-full border border-red-500/30">Confusão/Desmaio</span>}
                    {formData.temFebre && <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-200 text-xs rounded-full border border-yellow-500/30">Febre alta</span>}
                    {!hasSevereSymptom && !formData.temFebre && <span className="text-white/40 text-sm">Nenhum alerta grave</span>}
                  </div>
                </div>

                {historico.duracaoSintomas && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-wider mb-1">Duração</p>
                      <p className="text-white text-sm">{DURATIONS.find(d => d.value === historico.duracaoSintomas)?.label}</p>
                    </div>
                  </>
                )}

                {historico.condicoes.length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-wider mb-2">Condições de Saúde</p>
                      <div className="flex flex-wrap gap-1.5">
                        {historico.condicoes.map(c => (
                          <span key={c} className="px-2.5 py-1 bg-blue-500/20 text-blue-200 text-xs rounded-full border border-blue-500/30">
                            {CONDITIONS.find(x => x.key === c)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px bg-white/10" />
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Dor", value: `${formData.nivelDor}/10` },
                    { label: "Temp.", value: formData.temperatura ? `${formData.temperatura}°C` : "—" },
                    { label: "BPM", value: formData.frequenciaCardiaca || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-blue-300/70 text-xs font-semibold uppercase tracking-wider">{label}</p>
                      <p className="text-xl text-white font-bold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <AnimatePresence mode="wait">
                  {triagemMutation.isPending ? (
                    <motion.div key="loading"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center p-7 bg-blue-900/50 rounded-2xl border border-blue-400/30"
                    >
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-3">
                        <BrainCircuit className="w-12 h-12 text-blue-300" />
                      </motion.div>
                      <p className="text-lg text-white font-semibold text-center">A.M.E.L.I.A está analisando seus sintomas...</p>
                      <div className="mt-3 flex gap-1.5">
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.div key={i} className="w-2 h-2 rounded-full bg-blue-300"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Button onClick={handleSubmit}
                        className="w-full totem-button bg-green-500 text-white hover:bg-green-400 text-xl py-6 h-auto rounded-2xl font-bold shadow-[0_0_30px_rgba(39,174,96,0.3)]"
                      >
                        <Check className="w-6 h-6 mr-2" />
                        Gerar Minha Senha
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
