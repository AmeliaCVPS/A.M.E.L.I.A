import { useObterEstatisticas, useObterFilaEspera, useChamarProximoTicket, useAtualizarStatusTicket, getObterFilaEsperaQueryKey, getObterEstatisticasQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function FilaEsperaTab() {
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading: loadingStats } = useObterEstatisticas({
    query: { refetchInterval: 30000 }
  });
  
  const { data: fila, isLoading: loadingFila } = useObterFilaEspera({
    query: { refetchInterval: 30000 }
  });

  const chamarMutation = useChamarProximoTicket();
  const atualizarStatusMutation = useAtualizarStatusTicket();

  const handleChamar = (priority: 'urgent' | 'moderate' | 'light') => {
    chamarMutation.mutate(
      { prioridade: priority },
      {
        onSuccess: (res: any) => {
          if (res.encontrado && res.ticket) {
            toast.success(`Senha ${res.ticket.codigo} chamada! (${res.ticket.nomeUsuario})`);
            queryClient.invalidateQueries({ queryKey: getObterFilaEsperaQueryKey() });
            queryClient.invalidateQueries({ queryKey: getObterEstatisticasQueryKey() });
          } else {
            toast.info(`Nenhum paciente aguardando na fila ${priority}`);
          }
        }
      }
    );
  };

  const handleAtualizarStatus = (id: number, status: 'attended' | 'cancelled') => {
    atualizarStatusMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast.success("Status atualizado");
          queryClient.invalidateQueries({ queryKey: getObterFilaEsperaQueryKey() });
          queryClient.invalidateQueries({ queryKey: getObterEstatisticasQueryKey() });
        }
      }
    );
  };

  if (loadingStats || loadingFila) return <div className="p-8 text-center text-gray-500">Carregando dados...</div>;

  const renderFila = (titulo: string, tickets: any[], colorClass: string, badgeColor: string) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${colorClass}`}>
        <h3 className="font-bold text-gray-800">{titulo}</h3>
        <Badge variant="secondary" className="bg-white/50 text-gray-800">{tickets?.length || 0}</Badge>
      </div>
      <div className="p-4 flex-1 overflow-auto max-h-[500px]">
        {tickets?.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">Fila vazia</div>
        ) : (
          <div className="space-y-3">
            {tickets?.map(t => (
              <div key={t.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-lg ${badgeColor}`}>{t.codigo}</span>
                      {t.status === 'called' && <Badge className="bg-blue-100 text-blue-800 border-none">Chamado</Badge>}
                    </div>
                    <p className="font-medium text-gray-900 mt-1">{t.nomeUsuario}</p>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1" title={t.descricaoSintomas}>{t.descricaoSintomas}</p>
                  </div>
                </div>
                
                {t.status === 'called' ? (
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <Button size="sm" variant="outline" className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => handleAtualizarStatus(t.id, 'attended')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Atendido
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => handleAtualizarStatus(t.id, 'cancelled')}>
                      <XCircle className="w-4 h-4 mr-1" /> Faltou
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full mt-2" 
                    variant="secondary"
                    onClick={() => {
                      // Manual call specific ticket not in API easily without modifying status directly?
                      // We can just update status to called.
                      handleAtualizarStatus(t.id, 'called');
                    }}
                  >
                    Chamar Paciente
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Fila de Espera</h2>
          <p className="text-gray-500 mt-1">Gerencie os pacientes aguardando atendimento</p>
        </div>
        
        {/* Painel de Ações Rápidas */}
        <div className="flex gap-3">
          <Button onClick={() => handleChamar('urgent')} className="bg-[#E74C3C] hover:bg-[#c0392b] text-white">
            <Volume2 className="w-4 h-4 mr-2" /> Chamar Urgente
          </Button>
          <Button onClick={() => handleChamar('moderate')} className="bg-[#F39C12] hover:bg-[#d68910] text-white">
            <Volume2 className="w-4 h-4 mr-2" /> Chamar Moderado
          </Button>
          <Button onClick={() => handleChamar('light')} className="bg-[#27AE60] hover:bg-[#219653] text-white">
            <Volume2 className="w-4 h-4 mr-2" /> Chamar Leve
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-gray-500 text-sm font-medium mb-1">Aguardando</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.aguardando || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#E74C3C]">
          <CardContent className="p-6">
            <div className="text-gray-500 text-sm font-medium mb-1">Urgentes</div>
            <div className="text-3xl font-bold text-[#E74C3C]">{stats?.urgente || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#F39C12]">
          <CardContent className="p-6">
            <div className="text-gray-500 text-sm font-medium mb-1">Moderados</div>
            <div className="text-3xl font-bold text-[#F39C12]">{stats?.moderado || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#27AE60]">
          <CardContent className="p-6">
            <div className="text-gray-500 text-sm font-medium mb-1">Leves</div>
            <div className="text-3xl font-bold text-[#27AE60]">{stats?.leve || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-4">
        {renderFila("Urgente", fila?.urgente || [], "bg-red-50", "text-[#E74C3C]")}
        {renderFila("Moderado", fila?.moderado || [], "bg-yellow-50", "text-[#F39C12]")}
        {renderFila("Leve", fila?.leve || [], "bg-green-50", "text-[#27AE60]")}
      </div>
    </div>
  );
}
