import { useListarTickets, useCorrigirClassificacaoTicket, useRetreinarModelo, useListarLogsML, getListarTicketsQueryKey, getListarLogsMLQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, Check, Activity, AlertTriangle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function MachineLearningTab() {
  const queryClient = useQueryClient();
  
  // Pegar todos os tickets pra filtrar os que precisam de correção (onde predicaoML existe mas correcaoAdmin não)
  const { data: tickets, isLoading: loadingTickets } = useListarTickets();
  const { data: logs, isLoading: loadingLogs } = useListarLogsML();
  
  const corrigirMutation = useCorrigirClassificacaoTicket();
  const retreinarMutation = useRetreinarModelo();

  const ticketsParaCorrigir = tickets?.filter(t => t.predicaoML && !t.correcaoAdmin) || [];
  const ticketsCorrigidos = tickets?.filter(t => t.correcaoAdmin) || [];

  const handleCorrigir = (id: number, correcao: 'urgent' | 'moderate' | 'light') => {
    corrigirMutation.mutate({ id, data: { correcao } }, {
      onSuccess: () => {
        toast.success("Correção enviada. A IA aprenderá com isso!");
        queryClient.invalidateQueries({ queryKey: getListarTicketsQueryKey() });
      }
    });
  };

  const handleRetreinar = () => {
    retreinarMutation.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(`Modelo retreinado! Acurácia: ${res.acuracia ? (res.acuracia * 100).toFixed(1) + '%' : 'N/A'}`);
        queryClient.invalidateQueries({ queryKey: getListarLogsMLQueryKey() });
      },
      onError: () => {
        toast.error("Erro ao retreinar modelo. Talvez poucas amostras.");
      }
    });
  };

  const getPriorityLabel = (p: string) => {
    if (p === 'urgent') return <Badge className="bg-red-500 hover:bg-red-600">Urgente</Badge>;
    if (p === 'moderate') return <Badge className="bg-yellow-500 hover:bg-yellow-600">Moderado</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600">Leve</Badge>;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Machine Learning</h2>
          <p className="text-gray-500 mt-1">Supervisione e treine o modelo da A.M.E.L.I.A.</p>
        </div>
        
        <Button 
          onClick={handleRetreinar} 
          disabled={retreinarMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          {retreinarMutation.isPending ? "Treinando..." : (
            <><PlayCircle className="w-4 h-4 mr-2" /> Iniciar Retreinamento</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-6">
            <BrainCircuit className="w-8 h-8 text-blue-600 mb-4" />
            <div className="text-sm font-medium text-blue-900 mb-1">Aguardando Avaliação</div>
            <div className="text-3xl font-bold text-blue-700">{ticketsParaCorrigir.length}</div>
            <p className="text-sm text-blue-600/70 mt-2">Casos onde a IA classificou o paciente e aguarda sua validação.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardContent className="p-6">
            <Check className="w-8 h-8 text-purple-600 mb-4" />
            <div className="text-sm font-medium text-purple-900 mb-1">Correções Fornecidas</div>
            <div className="text-3xl font-bold text-purple-700">{ticketsCorrigidos.length}</div>
            <p className="text-sm text-purple-600/70 mt-2">Casos já validados que serão usados no próximo treinamento.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="p-6">
            <Activity className="w-8 h-8 text-emerald-600 mb-4" />
            <div className="text-sm font-medium text-emerald-900 mb-1">Última Acurácia</div>
            <div className="text-3xl font-bold text-emerald-700">
              {logs?.[0]?.acuracia ? `${(logs[0].acuracia * 100).toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-sm text-emerald-600/70 mt-2">No último retreinamento em {logs?.[0] ? new Date(logs[0].treinadoEm).toLocaleDateString() : '--'}.</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Revisão de Classificação
          </h3>
        </div>
        
        <div className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead className="w-[30%]">Sintomas</TableHead>
                <TableHead>Predição da IA</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead className="text-right">Sua Avaliação (Correção)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsParaCorrigir.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    Nenhum ticket aguardando revisão no momento.
                  </TableCell>
                </TableRow>
              ) : (
                ticketsParaCorrigir.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nomeUsuario}</TableCell>
                    <TableCell className="text-sm text-gray-600">{t.descricaoSintomas}</TableCell>
                    <TableCell>{getPriorityLabel(t.predicaoML || '')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${t.confiancaML! > 0.8 ? 'bg-green-500' : t.confiancaML! > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${(t.confiancaML || 0) * 100}%` }} 
                          />
                        </div>
                        <span className="text-xs text-gray-500">{((t.confiancaML || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleCorrigir(t.id, 'light')}>Leve</Button>
                        <Button size="sm" variant="outline" className="border-yellow-200 text-yellow-700 hover:bg-yellow-50" onClick={() => handleCorrigir(t.id, 'moderate')}>Moderado</Button>
                        <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleCorrigir(t.id, 'urgent')}>Urgente</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
