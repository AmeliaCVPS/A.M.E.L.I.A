import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useRealizarTriagem } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, AlertTriangle, Activity, Thermometer, HeartPulse, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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

  if (isAuthLoading) return null;

  if (!usuario) {
    setLocation("/login");
    return null;
  }

  const handleNext = () => {
    if (step === 1 && !formData.descricaoSintomas.trim()) {
      toast.error("Por favor, descreva o que você está sentindo.");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else setLocation("/");
  };

  const handleSubmit = () => {
    triagemMutation.mutate({
      data: {
        descricaoSintomas: formData.descricaoSintomas,
        dorNoPeito: formData.dorNoPeito,
        dificuldadeRespirar: formData.dificuldadeRespirar,
        temFebre: formData.temFebre,
        conscienciaAlterada: formData.conscienciaAlterada,
        nivelDor: formData.nivelDor,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : undefined,
        frequenciaCardiaca: formData.frequenciaCardiaca ? parseInt(formData.frequenciaCardiaca) : undefined,
      }
    }, {
      onSuccess: (ticket) => {
        setLocation(`/senha/${ticket.id}`);
      },
      onError: () => {
        toast.error("Erro ao processar triagem. Tente novamente.");
      }
    });
  };

  const hasSevereSymptom = formData.dorNoPeito || formData.dificuldadeRespirar || formData.conscienciaAlterada;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col p-6 max-w-4xl mx-auto">
      {/* Header / Progress */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-white hover:bg-white/20"
          onClick={handleBack}
          disabled={triagemMutation.isPending}
        >
          <ArrowLeft className="w-8 h-8" />
        </Button>
        
        <div className="flex gap-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-16 h-2 rounded-full transition-colors duration-300 ${
                step >= s ? "bg-white" : "bg-white/20"
              }`}
            />
          ))}
        </div>
        
        <div className="w-10"></div> {/* spacer for centering */}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-4xl font-bold text-white mb-2">O que você está sentindo?</h1>
            <p className="text-blue-200 text-xl mb-8">Por favor, descreva em poucas palavras o motivo da sua vinda.</p>
            
            <Textarea 
              value={formData.descricaoSintomas}
              onChange={(e) => setFormData({...formData, descricaoSintomas: e.target.value})}
              placeholder="Ex: Estou com muita dor de cabeça desde ontem e sinto enjoo..."
              className="min-h-[150px] text-2xl p-6 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white rounded-3xl resize-none mb-8"
            />

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
              <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                Sintomas de Atenção
              </h3>
              <p className="text-blue-200 mb-6">Você apresenta algum destes sintomas agora?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-colors ${formData.dorNoPeito ? 'bg-red-500/20 border-red-500/50' : 'bg-black/20 border-transparent hover:bg-black/30'}`}>
                  <Checkbox 
                    checked={formData.dorNoPeito}
                    onCheckedChange={(c) => setFormData({...formData, dorNoPeito: c as boolean})}
                    className="w-8 h-8 rounded-lg border-white/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <span className="text-lg font-medium">Dor forte no peito</span>
                </label>
                
                <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-colors ${formData.dificuldadeRespirar ? 'bg-red-500/20 border-red-500/50' : 'bg-black/20 border-transparent hover:bg-black/30'}`}>
                  <Checkbox 
                    checked={formData.dificuldadeRespirar}
                    onCheckedChange={(c) => setFormData({...formData, dificuldadeRespirar: c as boolean})}
                    className="w-8 h-8 rounded-lg border-white/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <span className="text-lg font-medium">Falta de ar severa</span>
                </label>
                
                <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-colors ${formData.conscienciaAlterada ? 'bg-red-500/20 border-red-500/50' : 'bg-black/20 border-transparent hover:bg-black/30'}`}>
                  <Checkbox 
                    checked={formData.conscienciaAlterada}
                    onCheckedChange={(c) => setFormData({...formData, conscienciaAlterada: c as boolean})}
                    className="w-8 h-8 rounded-lg border-white/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <span className="text-lg font-medium">Confusão ou desmaio</span>
                </label>
                
                <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-colors ${formData.temFebre ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-black/20 border-transparent hover:bg-black/30'}`}>
                  <Checkbox 
                    checked={formData.temFebre}
                    onCheckedChange={(c) => setFormData({...formData, temFebre: c as boolean})}
                    className="w-8 h-8 rounded-lg border-white/50 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                  />
                  <span className="text-lg font-medium">Febre alta</span>
                </label>
              </div>

              {hasSevereSymptom && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-100 flex items-start gap-3"
                >
                  <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                  <p>Sintomas graves identificados. Por favor, conclua a triagem rapidamente. Se a situação for muito grave, procure um enfermeiro imediatamente.</p>
                </motion.div>
              )}
            </div>
            
            <div className="mt-auto pt-8">
              <Button 
                onClick={handleNext} 
                className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-xl h-20 rounded-2xl"
              >
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Medições (Opcional)</h1>
            <p className="text-blue-200 text-xl mb-12">Como está sua dor? Se souber, informe seus sinais vitais.</p>

            <div className="space-y-12">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-300" />
                    Nível de Dor
                  </h3>
                  <div className="text-4xl font-bold bg-white/10 w-16 h-16 rounded-full flex items-center justify-center">
                    {formData.nivelDor}
                  </div>
                </div>
                
                <Slider 
                  value={[formData.nivelDor]} 
                  max={10} 
                  step={1}
                  onValueChange={(vals) => setFormData({...formData, nivelDor: vals[0]})}
                  className="py-4"
                />
                
                <div className="flex justify-between mt-4 text-blue-200 text-lg font-medium">
                  <span>Sem Dor (0)</span>
                  <span>Dor Máxima (10)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Thermometer className="w-8 h-8 text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <label className="text-blue-200 text-sm font-medium mb-1 block">Temperatura (°C)</label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={formData.temperatura}
                      onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                      placeholder="Ex: 37.5"
                      className="h-14 text-2xl bg-black/20 border-transparent text-white focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-8 h-8 text-red-300" />
                  </div>
                  <div className="flex-1">
                    <label className="text-blue-200 text-sm font-medium mb-1 block">Batimentos (bpm)</label>
                    <Input 
                      type="number" 
                      value={formData.frequenciaCardiaca}
                      onChange={(e) => setFormData({...formData, frequenciaCardiaca: e.target.value})}
                      placeholder="Ex: 80"
                      className="h-14 text-2xl bg-black/20 border-transparent text-white focus:border-white/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Button 
                onClick={handleNext} 
                className="w-full totem-button bg-white text-blue-900 hover:bg-blue-50 text-xl h-20 rounded-2xl"
              >
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Revisão</h1>
            <p className="text-blue-200 text-xl mb-8">Confira as informações antes de gerar sua senha.</p>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 space-y-6 flex-1">
              <div>
                <h4 className="text-blue-300 text-sm font-medium uppercase tracking-wider mb-2">Sintomas Descritos</h4>
                <p className="text-2xl text-white font-medium">{formData.descricaoSintomas}</p>
              </div>
              
              <div className="h-px w-full bg-white/10" />
              
              <div>
                <h4 className="text-blue-300 text-sm font-medium uppercase tracking-wider mb-3">Alertas Marcados</h4>
                <div className="flex gap-2 flex-wrap">
                  {formData.dorNoPeito && <span className="px-4 py-2 bg-red-500/20 text-red-100 rounded-xl text-lg border border-red-500/30">Dor no peito</span>}
                  {formData.dificuldadeRespirar && <span className="px-4 py-2 bg-red-500/20 text-red-100 rounded-xl text-lg border border-red-500/30">Falta de ar</span>}
                  {formData.conscienciaAlterada && <span className="px-4 py-2 bg-red-500/20 text-red-100 rounded-xl text-lg border border-red-500/30">Confusão/Desmaio</span>}
                  {formData.temFebre && <span className="px-4 py-2 bg-yellow-500/20 text-yellow-100 rounded-xl text-lg border border-yellow-500/30">Febre alta</span>}
                  {!hasSevereSymptom && !formData.temFebre && <span className="text-white/60 text-lg">Nenhum alerta grave marcado</span>}
                </div>
              </div>
              
              <div className="h-px w-full bg-white/10" />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-blue-300 text-sm font-medium uppercase tracking-wider mb-1">Dor</h4>
                  <p className="text-3xl text-white font-bold">{formData.nivelDor}/10</p>
                </div>
                <div>
                  <h4 className="text-blue-300 text-sm font-medium uppercase tracking-wider mb-1">Temp.</h4>
                  <p className="text-3xl text-white font-bold">{formData.temperatura ? `${formData.temperatura}°C` : '--'}</p>
                </div>
                <div>
                  <h4 className="text-blue-300 text-sm font-medium uppercase tracking-wider mb-1">BPM</h4>
                  <p className="text-3xl text-white font-bold">{formData.frequenciaCardiaca || '--'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {triagemMutation.isPending ? (
                <div className="flex flex-col items-center justify-center p-8 bg-blue-900/50 rounded-3xl border border-blue-400/30 backdrop-blur-sm">
                  <BrainCircuit className="w-16 h-16 text-blue-300 animate-pulse mb-4" />
                  <p className="text-2xl text-white font-medium text-center">A.M.E.L.I.A está analisando seus sintomas...</p>
                  <p className="text-blue-200 mt-2">Aguarde um momento</p>
                </div>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="w-full totem-button bg-green-500 text-white hover:bg-green-600 text-2xl h-24 rounded-2xl shadow-[0_0_40px_rgba(39,174,96,0.3)]"
                >
                  <Check className="w-8 h-8 mr-3" />
                  Gerar Minha Senha
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
