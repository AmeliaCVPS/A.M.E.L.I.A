import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useObterTicket, useLogoutUsuario } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Printer, CheckCircle2, ShieldAlert, Clock, Info } from "lucide-react";

const getPriorityDetails = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return {
        color: 'bg-[#E74C3C]',
        textColor: 'text-[#E74C3C]',
        borderColor: 'border-[#E74C3C]',
        label: 'URGENTE',
        message: 'Por favor, aguarde próximo à porta do consultório. Seu atendimento será priorizado.',
      };
    case 'moderate':
      return {
        color: 'bg-[#F39C12]',
        textColor: 'text-[#F39C12]',
        borderColor: 'border-[#F39C12]',
        label: 'MODERADO',
        message: 'Por favor, aguarde na recepção. Você será chamado em breve.',
      };
    case 'light':
    default:
      return {
        color: 'bg-[#27AE60]',
        textColor: 'text-[#27AE60]',
        borderColor: 'border-[#27AE60]',
        label: 'LEVE',
        message: 'Por favor, aguarde na recepção. Casos urgentes podem ser passados à frente.',
      };
  }
};

export default function Senha() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { setUsuario } = useAuth();
  
  const { data: ticket, isLoading } = useObterTicket(parseInt(id), {
    query: {
      enabled: !!id,
    }
  });

  const logoutMutation = useLogoutUsuario();

  const handleFinish = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUsuario(null);
        setLocation("/");
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Se não encontrar o ticket após carregar, volta pro início
  useEffect(() => {
    if (!isLoading && !ticket) {
      setLocation("/");
    }
  }, [ticket, isLoading, setLocation]);

  if (isLoading || !ticket) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const details = getPriorityDetails(ticket.prioridade);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 print:p-0 print:bg-white print:text-black">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden print:shadow-none print:border-2 print:border-black"
      >
        {/* Header - Colored by priority */}
        <div className={`${details.color} p-10 text-center relative print:!bg-gray-200 print:!text-black`}>
          <div className="absolute top-6 left-6 opacity-30">
            <img src="/amelia-logo.png" alt="Logo" className="w-16 h-16 grayscale brightness-0 invert" />
          </div>
          <h2 className="text-white/90 text-2xl font-medium tracking-wide mb-2 print:text-black">Sua Senha</h2>
          <div className="text-8xl md:text-9xl font-bold text-white tracking-tighter print:text-black">
            {ticket.codigo}
          </div>
          <div className="inline-block mt-4 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-bold text-xl tracking-widest print:bg-black print:text-white print:!bg-opacity-100">
            {details.label}
          </div>
        </div>

        {/* Content */}
        <div className="p-10 text-gray-800 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-bold text-gray-900">{ticket.nomeUsuario}</h3>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-lg">
              <Clock className="w-5 h-5" />
              <span>Gerado em {new Date(ticket.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border-2 ${details.borderColor} bg-gray-50 flex gap-4 items-start print:border-gray-400`}>
            <Info className={`w-8 h-8 shrink-0 ${details.textColor} print:text-black`} />
            <p className="text-xl font-medium text-gray-800 leading-relaxed">
              {details.message}
            </p>
          </div>

          {ticket.confiancaML && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-800 print:hidden">
              <CheckCircle2 className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-semibold">Triagem realizada por IA A.M.E.L.I.A.</p>
                <p className="text-sm opacity-80">Nível de confiança: {(ticket.confiancaML * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {ticket.prioridade === 'urgent' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-xl print:border print:border-red-500">
              <ShieldAlert className="w-6 h-6" />
              <p className="font-medium">Equipe médica já foi notificada da sua chegada.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions (Not printed) */}
      <div className="w-full max-w-2xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <Button 
          variant="outline" 
          size="lg"
          onClick={handlePrint}
          className="totem-button bg-white/10 text-white border-white/20 hover:bg-white/20 h-20 text-xl rounded-2xl"
        >
          <Printer className="w-6 h-6 mr-3" />
          Imprimir Senha
        </Button>
        <Button 
          onClick={handleFinish}
          className="totem-button bg-blue-600 text-white hover:bg-blue-500 h-20 text-xl rounded-2xl"
        >
          <CheckCircle2 className="w-6 h-6 mr-3" />
          Finalizar
        </Button>
      </div>
    </div>
  );
}
