import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useRealizarTriagem } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, AlertTriangle, Activity, Thermometer,
  HeartPulse, BrainCircuit, Clock, Pill, Stethoscope, Wind
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
        style={{ background: "radial-gradient(circle, rgba(46,74,122,0.35) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        initial={{ width: 600, height: 600 }}
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
            initial={{ width: "0%" }}
            animate={{ width: step > i ? "100%" : "0%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      ))}
    </div>
  );
}

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
  const triagemMutation = useRealizarTriagem();

  const [formData, setFormData] = useState({
    descricaoSintomas: "",
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
    gravida: false,
  });

  useEffect(() => {
    if (!isAuthLoading && !usuario) setLocation("/login");
  }, [isAuthLoading, usuario, setLocation]);

  if (isAuthLoading || !usuario) return null;

  const hasSevereSymptom = formData.dorNoPeito || formData.dificuldadeRespirar || formData.conscienciaAlterada;

  const toggleCondicao = (key: string) => {
    setHistorico(prev => ({
      ...prev,
      condicoes: prev.condicoes.includes(key)
        ? prev.condicoes.filter(c => c !== key)
        : [...prev.condicoes, key],
    }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.descricaoSintomas.trim()) {
      toast.error("Por favor, descreva o que você está sentindo.");
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else setLocation("/");
  };

  const buildDescricao = () => {
    let desc = formData.descricaoSintomas.trim();
    if (historico.duracaoSintomas) {
      const dur = DURATIONS.find(d => d.value === historico.duracaoSintomas);
      if (dur) desc += ` | Duração: ${dur.label}`;
    }
    if (historico.condicoes.length > 0) {
      const labels = historico.condicoes.map(c => CONDITIONS.find(x => x.key === c)?.label).filter(Boolean);
      desc += ` | Condições: ${labels.join(", ")}`;
    }
    if (historico.tomaMedicamentos && historico.quaisMedicamentos)
      desc += ` | Medicamentos: ${historico.quaisMedicamentos}`;
    if (historico.temAlergias && historico.quaisAlergias)
      desc += ` | Alergias: ${historico.quaisAlergias}`;
    if (historico.ultimaRefeicao)
      desc += ` | Última refeição: ${historico.ultimaRefeicao}`;
    return desc;
  };

  const handleSubmit = () => {
    triagemMutation.mutate({
      data: {
        descricaoSintomas: buildDescricao(),
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
      onError: () => toast.error("Erro ao processar triagem. Tente novamente."),
    });
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col p-6 max-w-4xl mx-auto relative">
      <BreathingOrb />

      <div className="relative z-10 flex items-center justify-between mb-6 mt-2">
        <Button
          variant="ghost" size="icon"
          className="rounded-full text-white hover:bg-white/20 w-12 h-12"
          onClick={handleBack}
          disabled={triagemMutation.isPending}
        >
          <ArrowLeft className="w-7 h-7" />
        </Button>

        <div className="flex-1 mx-6">
          <ProgressBar step={step} />
          <p className="text-center text-white/50 text-sm mt-2">
            Etapa {step} de {TOTAL_STEPS}
          </p>
        </div>

        <div className="w-12" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── ETAPA 1 — SINTOMAS ── */}
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-4xl font-bold text-white mb-1">O que você está sentindo?</h1>
                <p className="text-blue-200 text-lg mb-6">Descreva em poucas palavras o motivo da sua vinda.</p>
              </motion.div>

              <Textarea
                value={formData.descricaoSintomas}
                onChange={(e) => setFormData({ ...formData, descricaoSintomas: e.target.value })}
                placeholder="Ex: Estou com muita dor de cabeça desde ontem e sinto enjoo..."
                className="min-h-[130px] text-xl p-5 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60 rounded-3xl resize-none mb-6"
              />

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Sintomas de Atenção Imediata
                </h3>
                <p className="text-blue-200/80 text-sm mb-5">Você apresenta algum destes sintomas agora?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "dorNoPeito", label: "Dor forte no peito", color: "red" },
                    { key: "dificuldadeRespirar", label: "Falta de ar severa", color: "red" },
                    { key: "conscienciaAlterada", label: "Confusão mental ou desmaio", color: "red" },
                    { key: "temFebre", label: "Febre alta", color: "yellow" },
                  ].map(({ key, label, color }) => {
                    const checked = formData[key as keyof typeof formData] as boolean;
                    const activeClass = color === "red"
                      ? "bg-red-500/20 border-red-400/50"
                      : "bg-yellow-500/20 border-yellow-400/50";
                    const checkClass = color === "red"
                      ? "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      : "data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500";
                    return (
                      <motion.label
                        key={key} whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all ${checked ? activeClass : "bg-black/20 border-transparent hover:bg-white/5"}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => setFormData({ ...formData, [key]: c as boolean })}
                          className={`w-7 h-7 rounded-lg border-white/40 ${checkClass}`}
                        />
                        <span className="text-base font-medium text-white">{label}</span>
                      </motion.label>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {hasSevereSymptom && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-100 flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed">Sintomas graves identificados. Conclua a triagem rapidamente. Se estiver muito mal, procure um enfermeiro imediatamente.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto">
                <Button onClick={handleNext} className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-xl h-18 py-5 rounded-2xl">
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 2 — HISTÓRICO CLÍNICO ── */}
          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col overflow-y-auto"
            >
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-4xl font-bold text-white mb-1">Histórico Clínico</h1>
                <p className="text-blue-200 text-lg mb-6">Essas informações ajudam a AMELIA a priorizar melhor.</p>
              </motion.div>

              <div className="space-y-5 pb-6">
                {/* Duração */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-300" /> Há quanto tempo está assim?
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {DURATIONS.map((d) => (
                      <motion.button
                        key={d.value} whileTap={{ scale: 0.96 }}
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
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-300" /> Possui alguma condição de saúde?
                  </h3>
                  <p className="text-blue-200/70 text-xs mb-3">Selecione todas que se aplicam</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CONDITIONS.map((c) => {
                      const active = historico.condicoes.includes(c.key);
                      return (
                        <motion.label
                          key={c.key} whileTap={{ scale: 0.97 }}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${active ? "bg-blue-500/20 border-blue-400/50" : "bg-black/20 border-transparent hover:bg-white/5"}`}
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
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-300" /> Toma algum medicamento regularmente?
                  </h3>
                  <div className="flex gap-3 mb-3">
                    {["Sim", "Não"].map((opt) => {
                      const val = opt === "Sim";
                      const active = historico.tomaMedicamentos === val && (opt === "Não" ? !historico.tomaMedicamentos : historico.tomaMedicamentos);
                      return (
                        <motion.button
                          key={opt} whileTap={{ scale: 0.96 }}
                          onClick={() => setHistorico(prev => ({ ...prev, tomaMedicamentos: val }))}
                          className={`flex-1 py-3 rounded-xl text-base font-semibold border transition-all ${historico.tomaMedicamentos === val
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
                          placeholder="Ex: Losartana, Metformina..."
                          className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 rounded-xl"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Alergias */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-300" /> Possui alguma alergia conhecida?
                  </h3>
                  <div className="flex gap-3 mb-3">
                    {["Sim", "Não"].map((opt) => {
                      const val = opt === "Sim";
                      return (
                        <motion.button
                          key={opt} whileTap={{ scale: 0.96 }}
                          onClick={() => setHistorico(prev => ({ ...prev, temAlergias: val }))}
                          className={`flex-1 py-3 rounded-xl text-base font-semibold border transition-all ${historico.temAlergias === val
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
                          className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 rounded-xl"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Última refeição */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <h3 className="text-white font-semibold mb-3">Quando foi sua última refeição?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["Menos de 2h", "2 a 6h", "Mais de 6h", "Não me lembro"].map((opt) => (
                      <motion.button
                        key={opt} whileTap={{ scale: 0.96 }}
                        onClick={() => setHistorico(prev => ({ ...prev, ultimaRefeicao: opt }))}
                        className={`p-3 rounded-xl text-sm font-medium border transition-all ${historico.ultimaRefeicao === opt
                          ? "bg-blue-500/30 border-blue-400/60 text-white"
                          : "bg-black/20 border-white/10 text-white/70 hover:bg-white/10"}`}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-2">
                <Button onClick={handleNext} className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-xl py-5 h-18 rounded-2xl">
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 3 — SINAIS VITAIS ── */}
          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-4xl font-bold text-white mb-1">Sinais Vitais</h1>
                <p className="text-blue-200 text-lg mb-8">Se souber, informe suas medições. Caso contrário, pule adiante.</p>
              </motion.div>

              <div className="space-y-6">
                {/* Pain slider */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-7">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                      <Activity className="w-7 h-7 text-blue-300" /> Nível de Dor
                    </h3>
                    <motion.div
                      key={formData.nivelDor}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-4xl font-black w-16 h-16 rounded-full flex items-center justify-center ${formData.nivelDor >= 7 ? "bg-red-500/30 text-red-200" : formData.nivelDor >= 4 ? "bg-yellow-500/30 text-yellow-200" : "bg-white/10 text-white"}`}
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
                  <div className="flex justify-between mt-3 text-blue-200/70 text-sm font-medium">
                    <span>😌 Sem dor</span>
                    <span>😖 Dor máxima</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Thermometer className="w-7 h-7 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <label className="text-blue-200/80 text-xs font-medium mb-1 block uppercase tracking-wider">Temperatura (°C)</label>
                      <Input
                        type="number" step="0.1"
                        value={formData.temperatura}
                        onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                        placeholder="Ex: 37.5"
                        className="h-12 text-2xl bg-black/20 border-transparent text-white focus:border-white/30 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
                    <motion.div
                      className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center shrink-0"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <HeartPulse className="w-7 h-7 text-red-300" />
                    </motion.div>
                    <div className="flex-1">
                      <label className="text-blue-200/80 text-xs font-medium mb-1 block uppercase tracking-wider">Batimentos (bpm)</label>
                      <Input
                        type="number"
                        value={formData.frequenciaCardiaca}
                        onChange={(e) => setFormData({ ...formData, frequenciaCardiaca: e.target.value })}
                        placeholder="Ex: 80"
                        className="h-12 text-2xl bg-black/20 border-transparent text-white focus:border-white/30 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <Button onClick={handleNext} className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-xl py-5 h-18 rounded-2xl">
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 4 — REVISÃO ── */}
          {step === 4 && (
            <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-4xl font-bold text-white mb-1">Revisão</h1>
                <p className="text-blue-200 text-lg mb-6">Confira suas informações antes de gerar a senha.</p>
              </motion.div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-7 space-y-5 flex-1 overflow-y-auto">
                <div>
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Sintomas</p>
                  <p className="text-white text-lg leading-snug">{formData.descricaoSintomas}</p>
                </div>

                <div className="h-px bg-white/10" />

                <div>
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">Alertas Marcados</p>
                  <div className="flex gap-2 flex-wrap">
                    {formData.dorNoPeito && <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-xl text-sm border border-red-500/30">Dor no peito</span>}
                    {formData.dificuldadeRespirar && <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-xl text-sm border border-red-500/30">Falta de ar</span>}
                    {formData.conscienciaAlterada && <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-xl text-sm border border-red-500/30">Confusão/Desmaio</span>}
                    {formData.temFebre && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-xl text-sm border border-yellow-500/30">Febre alta</span>}
                    {!hasSevereSymptom && !formData.temFebre && <span className="text-white/50 text-sm">Nenhum alerta grave</span>}
                  </div>
                </div>

                {historico.duracaoSintomas && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Duração</p>
                      <p className="text-white">{DURATIONS.find(d => d.value === historico.duracaoSintomas)?.label}</p>
                    </div>
                  </>
                )}

                {historico.condicoes.length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Condições de Saúde</p>
                      <div className="flex gap-2 flex-wrap">
                        {historico.condicoes.map(c => (
                          <span key={c} className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-xl text-sm border border-blue-500/30">
                            {CONDITIONS.find(x => x.key === c)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px bg-white/10" />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Dor</p>
                    <p className="text-2xl text-white font-bold">{formData.nivelDor}/10</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Temp.</p>
                    <p className="text-2xl text-white font-bold">{formData.temperatura ? `${formData.temperatura}°C` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">BPM</p>
                    <p className="text-2xl text-white font-bold">{formData.frequenciaCardiaca || "—"}</p>
                  </div>
                </div>

                {(historico.tomaMedicamentos || historico.temAlergias) && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div className="grid grid-cols-2 gap-4">
                      {historico.tomaMedicamentos && (
                        <div>
                          <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Medicamentos</p>
                          <p className="text-white text-sm">{historico.quaisMedicamentos || "Sim (não especificado)"}</p>
                        </div>
                      )}
                      {historico.temAlergias && (
                        <div>
                          <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Alergias</p>
                          <p className="text-white text-sm">{historico.quaisAlergias || "Sim (não especificado)"}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6">
                <AnimatePresence mode="wait">
                  {triagemMutation.isPending ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center p-8 bg-blue-900/50 rounded-3xl border border-blue-400/30 backdrop-blur-sm"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mb-4"
                      >
                        <BrainCircuit className="w-14 h-14 text-blue-300" />
                      </motion.div>
                      <p className="text-xl text-white font-semibold text-center">A.M.E.L.I.A está analisando seus sintomas...</p>
                      <motion.div
                        className="mt-4 flex gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full bg-blue-300"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Button
                        onClick={handleSubmit}
                        className="w-full totem-button bg-green-500 text-white hover:bg-green-400 text-2xl py-7 rounded-2xl shadow-[0_0_40px_rgba(39,174,96,0.25)]"
                      >
                        <Check className="w-7 h-7 mr-3" />
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
