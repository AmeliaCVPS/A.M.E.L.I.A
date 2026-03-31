import { useListarTickets } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function HistoricoTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Convertendo pra cast pro tipo params
  const { data: tickets, isLoading } = useListarTickets(
    statusFilter !== "all" ? { status: statusFilter as any } : undefined
  );

  const getPriorityLabel = (p: string) => {
    if (p === 'urgent') return <Badge className="bg-red-500">Urgente</Badge>;
    if (p === 'moderate') return <Badge className="bg-yellow-500">Moderado</Badge>;
    return <Badge className="bg-green-500">Leve</Badge>;
  };

  const getStatusLabel = (s: string) => {
    switch(s) {
      case 'waiting': return <Badge variant="outline" className="text-gray-500">Aguardando</Badge>;
      case 'called': return <Badge variant="outline" className="text-blue-500 border-blue-500">Chamado</Badge>;
      case 'attended': return <Badge variant="outline" className="text-green-500 border-green-500">Atendido</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-red-500 border-red-500">Cancelado</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Histórico de Triagens</h2>
          <p className="text-gray-500 mt-1">Todas as senhas geradas pelo sistema.</p>
        </div>
        
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="waiting">Aguardando</SelectItem>
              <SelectItem value="called">Chamados</SelectItem>
              <SelectItem value="attended">Atendidos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead>Senha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">Carregando...</TableCell>
                </TableRow>
              ) : tickets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">Nenhum ticket encontrado.</TableCell>
                </TableRow>
              ) : (
                tickets?.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-gray-900">{t.codigo}</TableCell>
                    <TableCell>{t.nomeUsuario}</TableCell>
                    <TableCell>{getPriorityLabel(t.prioridade)}</TableCell>
                    <TableCell>{getStatusLabel(t.status)}</TableCell>
                    <TableCell>{new Date(t.criadoEm).toLocaleString('pt-BR')}</TableCell>
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
