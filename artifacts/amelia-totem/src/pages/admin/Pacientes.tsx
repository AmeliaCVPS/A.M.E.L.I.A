import { useListarPacientes } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { maskCPF } from "@/lib/masks";

export default function PacientesTab() {
  const { data: pacientes, isLoading } = useListarPacientes();
  const [busca, setBusca] = useState("");

  const pacientesFiltrados = pacientes?.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.cpf.includes(busca)
  ) || [];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-gray-500 mt-1">Base de dados de pacientes cadastrados no totem.</p>
        </div>
        
        <div className="relative w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Buscar por nome ou CPF..." 
            className="pl-10 bg-white border-gray-200"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Cartão SUS</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Data Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">Carregando...</TableCell>
                </TableRow>
              ) : pacientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">Nenhum paciente encontrado.</TableCell>
                </TableRow>
              ) : (
                pacientesFiltrados.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{maskCPF(p.cpf)}</TableCell>
                    <TableCell>{p.cartaoSus || '--'}</TableCell>
                    <TableCell>{p.telefone || '--'}</TableCell>
                    <TableCell>{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</TableCell>
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
