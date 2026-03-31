import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Activity, ArrowRight, UserPlus, LogIn, PhoneCall, ShieldAlert } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { usuario } = useAuth();

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Calming animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-blue-300/5 blur-[80px]"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 flex flex-col items-center max-w-2xl w-full text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-[0_8px_40px_rgba(255,255,255,0.18)] border-4 border-white/60"
        >
          <img src="/amelia-logo.png" alt="A.M.E.L.I.A Logo" className="w-28 h-28 object-contain" />
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          Olá, eu sou a A.M.E.L.I.A.
        </h1>
        
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-xl font-light">
          Atendimento Médico Eficiente e Lenitivo com Inteligência Artificial
        </p>

        <div className="flex flex-col w-full gap-4 max-w-md">
          {usuario ? (
            <Button 
              size="lg" 
              className="totem-button w-full bg-white text-blue-950 hover:bg-gray-100"
              onClick={() => setLocation("/triagem")}
            >
              <Activity className="w-6 h-6 mr-2" />
              Iniciar Triagem
            </Button>
          ) : (
            <>
              <Button 
                size="lg" 
                className="totem-button w-full bg-white text-blue-950 hover:bg-gray-100"
                onClick={() => setLocation("/login")}
              >
                <LogIn className="w-6 h-6 mr-2" />
                Já tenho cadastro
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="totem-button w-full border-white/30 hover:bg-white/10 text-white"
                onClick={() => setLocation("/cadastro")}
              >
                <UserPlus className="w-6 h-6 mr-2" />
                Primeiro acesso
              </Button>
            </>
          )}

          {usuario?.papel === "admin" && (
            <Button 
              size="lg" 
              variant="secondary"
              className="totem-button w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => setLocation("/admin")}
            >
              Painel Administrativo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Priority Legend */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="z-10 mt-16 flex flex-col items-center bg-black/20 p-6 rounded-2xl backdrop-blur-md border border-white/5 w-full max-w-2xl"
      >
        <p className="text-sm uppercase tracking-wider text-white/60 mb-4 font-medium">Cores de Atendimento</p>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#E74C3C] shadow-[0_0_10px_rgba(231,76,60,0.5)]" />
            <span className="font-medium">Urgente</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#F39C12] shadow-[0_0_10px_rgba(243,156,18,0.5)]" />
            <span className="font-medium">Moderado</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#27AE60] shadow-[0_0_10px_rgba(39,174,96,0.5)]" />
            <span className="font-medium">Leve</span>
          </div>
        </div>
      </motion.div>

      {/* Emergency Notice */}
      <div className="fixed bottom-6 left-0 w-full flex justify-center z-10">
        <div className="flex items-center gap-3 px-6 py-3 bg-red-500/20 text-red-200 rounded-full border border-red-500/30 backdrop-blur-sm">
          <ShieldAlert className="w-5 h-5" />
          <span className="font-medium">Emergência grave? Ligue para o SAMU</span>
          <div className="flex items-center gap-2 bg-red-500/30 px-3 py-1 rounded-full ml-2">
            <PhoneCall className="w-4 h-4" />
            <span className="font-bold text-white">192</span>
          </div>
        </div>
      </div>
    </div>
  );
}
