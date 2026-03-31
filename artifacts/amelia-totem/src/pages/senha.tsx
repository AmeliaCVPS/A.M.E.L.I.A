import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useObterTicket, useLogoutUsuario } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer, CheckCircle2, ShieldAlert, Clock, Info,
  AlertTriangle, Activity, Thermometer, HeartPulse, FileText
} from "lucide-react";

const getPriorityDetails = (priority: string) => {
  switch (priority) {
    case "urgent":
      return {
        color: "bg-[#E74C3C]",
        textColor: "text-[#E74C3C]",
        borderColor: "border-[#E74C3C]",
        glowColor: "shadow-[0_0_60px_rgba(231,76,60,0.25)]",
        label: "URGENTE",
        emoji: "🚨",
        message: "Por favor, aguarde próximo à porta do consultório. Seu atendimento será priorizado.",
      };
    case "moderate":
      return {
        color: "bg-[#F39C12]",
        textColor: "text-[#F39C12]",
        borderColor: "border-[#F39C12]",
        glowColor: "shadow-[0_0_60px_rgba(243,156,18,0.2)]",
        label: "MODERADO",
        emoji: "⚠️",
        message: "Por favor, aguarde na recepção. Você será chamado em breve.",
      };
    case "light":
    default:
      return {
        color: "bg-[#27AE60]",
        textColor: "text-[#27AE60]",
        borderColor: "border-[#27AE60]",
        glowColor: "shadow-[0_0_60px_rgba(39,174,96,0.2)]",
        label: "LEVE",
        emoji: "✅",
        message: "Por favor, aguarde na recepção. Casos urgentes podem ser chamados antes.",
      };
  }
};

function CalmingBackground({ priority }: { priority: string }) {
  const color =
    priority === "urgent" ? "rgba(231,76,60,0.08)"
    : priority === "moderate" ? "rgba(243,156,18,0.08)"
    : "rgba(39,174,96,0.08)";

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, width: 700, height: 700 }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function BreathingHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="mt-6 flex flex-col items-center gap-3 print:hidden"
    >
      <p className="text-white/40 text-sm">Respire fundo enquanto aguarda</p>
      <div className="relative flex items-center justify-center w-14 h-14">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/20"
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="w-6 h-6 rounded-full bg-white/20"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

export default function Senha() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { setUsuario } = useAuth();

  const { data: ticket, isLoading } = useObterTicket(parseInt(id), {
    query: { enabled: !!id },
  });

  const logoutMutation = useLogoutUsuario();

  const handleFinish = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUsuario(null);
        setLocation("/");
      },
    });
  };

  useEffect(() => {
    if (!isLoading && !ticket) setLocation("/");
  }, [ticket, isLoading, setLocation]);

  if (isLoading || !ticket) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/15 border-t-white rounded-full"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/50 text-lg"
        >
          Carregando sua senha...
        </motion.p>
      </div>
    );
  }

  const details = getPriorityDetails(ticket.prioridade);

  // Build symptom flags list
  const flags: { label: string; severity: "red" | "yellow" }[] = [];
  if (ticket.dorNoPeito) flags.push({ label: "Dor forte no peito", severity: "red" });
  if (ticket.dificuldadeRespirar) flags.push({ label: "Falta de ar", severity: "red" });
  if (ticket.conscienciaAlterada) flags.push({ label: "Confusão / Desmaio", severity: "red" });
  if (ticket.temFebre) flags.push({ label: "Febre alta", severity: "yellow" });

  // Parse extended info from descricaoSintomas
  const descParts = ticket.descricaoSintomas?.split(" | ") ?? [];
  const descPrincipal = descParts[0] ?? ticket.descricaoSintomas;
  const infoExtra = descParts.slice(1);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 relative print:p-0 print:bg-white print:block">
      <CalmingBackground priority={ticket.prioridade} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative z-10 w-full max-w-2xl bg-white rounded-[36px] overflow-hidden print:shadow-none print:rounded-none print:border-2 print:border-black ${details.glowColor}`}
      >
        {/* ── HEADER ── */}
        <div className={`${details.color} p-8 text-center relative print:!bg-gray-100`}>
          <div className="absolute top-5 left-5 opacity-20 print:opacity-50">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <img src="/amelia-logo.png" alt="AMELIA" className="w-9 h-9 object-contain" />
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-lg font-medium tracking-wide mb-1 print:text-black"
          >
            Sua Senha de Atendimento
          </motion.p>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-8xl sm:text-9xl font-black text-white tracking-tighter leading-none print:text-black"
          >
            {ticket.codigo}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-white/25 rounded-full text-white font-bold text-lg tracking-widest print:bg-gray-300 print:text-black"
          >
            <span>{details.emoji}</span>
            <span>{details.label}</span>
          </motion.div>
        </div>

        {/* ── CONTENT ── */}
        <div className="p-7 sm:p-9 space-y-6 text-gray-800">

          {/* Patient name + time */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{ticket.nomeUsuario}</h3>
            <div className="flex items-center justify-center gap-2 text-gray-500 mt-1">
              <Clock className="w-4 h-4" />
              <span className="text-base">
                Gerado em {new Date(ticket.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {" — "}
                {new Date(ticket.criadoEm).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </motion.div>

          {/* Guidance message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`p-5 rounded-2xl border-2 ${details.borderColor} bg-gray-50 flex gap-3 items-start print:border-gray-400`}
          >
            <Info className={`w-6 h-6 shrink-0 mt-0.5 ${details.textColor} print:text-black`} />
            <p className="text-lg font-medium text-gray-800 leading-snug">{details.message}</p>
          </motion.div>

          {/* ── SYMPTOMS SECTION (visible + printed) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="border border-gray-200 rounded-2xl overflow-hidden print:border-gray-400"
          >
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2 print:border-gray-400">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resumo da Triagem</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Main description */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Queixa Principal</p>
                <p className="text-gray-800 font-medium leading-snug">{descPrincipal}</p>
              </div>

              {/* Extra info from clinical history */}
              {infoExtra.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5">
                  {infoExtra.map((info, i) => {
                    const [label, value] = info.split(": ");
                    return (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-gray-400 font-medium shrink-0">{label}:</span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Symptom flags */}
              {flags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sintomas de Atenção</p>
                  <div className="flex flex-wrap gap-2">
                    {flags.map((f) => (
                      <span
                        key={f.label}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          f.severity === "red"
                            ? "bg-red-50 text-red-700 border-red-200 print:border-red-500"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200 print:border-yellow-500"
                        }`}
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vitals */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100 print:border-gray-300">
                  <Activity className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400 font-medium">Dor</p>
                  <p className="text-xl font-bold text-gray-800">{ticket.nivelDor ?? "—"}<span className="text-xs font-normal text-gray-400">/10</span></p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100 print:border-gray-300">
                  <Thermometer className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400 font-medium">Temp.</p>
                  <p className="text-xl font-bold text-gray-800">{ticket.temperatura ? `${ticket.temperatura}°` : "—"}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100 print:border-gray-300">
                  <HeartPulse className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400 font-medium">BPM</p>
                  <p className="text-xl font-bold text-gray-800">{ticket.frequenciaCardiaca ?? "—"}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI confidence - screen only */}
          {ticket.confiancaML && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-800 print:hidden"
            >
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Triagem realizada por IA A.M.E.L.I.A.</p>
                <p className="text-xs opacity-70">Confiança do modelo: {Number(ticket.confiancaML).toFixed(1)}%</p>
              </div>
            </motion.div>
          )}

          {/* Urgent notice */}
          {ticket.prioridade === "urgent" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 print:border-red-500"
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">A equipe médica já foi notificada da sua chegada.</p>
            </motion.div>
          )}

          {/* Print footer */}
          <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
            A.M.E.L.I.A — Atendimento Médico Eficiente e Lenitivo com Inteligência Artificial<br />
            Este documento é a comprovação de sua triagem. Guarde-o até ser atendido.
          </div>
        </div>
      </motion.div>

      {/* Breathing hint */}
      <BreathingHint />

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="relative z-10 w-full max-w-2xl mt-6 grid grid-cols-2 gap-4 print:hidden"
      >
        <Button
          variant="outline" size="lg"
          onClick={() => window.print()}
          className="totem-button bg-white/10 text-white border-white/25 hover:bg-white/20 h-16 text-lg rounded-2xl"
        >
          <Printer className="w-5 h-5 mr-2" />
          Imprimir Senha
        </Button>
        <Button
          onClick={handleFinish}
          className="totem-button bg-blue-600 text-white hover:bg-blue-500 h-16 text-lg rounded-2xl"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Finalizar
        </Button>
      </motion.div>
    </div>
  );
}
