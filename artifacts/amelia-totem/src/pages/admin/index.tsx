import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLogoutUsuario } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, BrainCircuit, Users, History } from "lucide-react";

import FilaEsperaTab from "./FilaEspera";
import MachineLearningTab from "./MachineLearning";
import PacientesTab from "./Pacientes";
import HistoricoTab from "./Historico";

export default function AdminDashboard() {
  const { usuario, setUsuario } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogoutUsuario();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUsuario(null);
        setLocation("/");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 flex">
      <Tabs defaultValue="fila" orientation="vertical" className="flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0f2447] text-white flex flex-col shadow-2xl relative z-10 shrink-0">
          <div className="p-6 pb-2 flex items-center gap-3">
            <img src="/amelia-logo.png" alt="A.M.E.L.I.A" className="w-10 h-10 brightness-0 invert" />
            <div className="font-bold text-xl tracking-tight">Painel Admin</div>
          </div>
          
          <div className="px-6 pb-6 text-blue-300 text-sm">
            Dr(a). {usuario?.nome.split(' ')[0]}
          </div>

          <TabsList className="flex flex-col bg-transparent h-auto p-0 gap-1 w-full items-stretch px-3">
            <TabsTrigger 
              value="fila" 
              className="justify-start gap-3 px-4 py-3 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-xl"
            >
              <LayoutDashboard className="w-5 h-5" /> Fila de Espera
            </TabsTrigger>
            <TabsTrigger 
              value="ml" 
              className="justify-start gap-3 px-4 py-3 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-xl"
            >
              <BrainCircuit className="w-5 h-5" /> Machine Learning
            </TabsTrigger>
            <TabsTrigger 
              value="pacientes" 
              className="justify-start gap-3 px-4 py-3 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-xl"
            >
              <Users className="w-5 h-5" /> Pacientes
            </TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="justify-start gap-3 px-4 py-3 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-xl"
            >
              <History className="w-5 h-5" /> Histórico
            </TabsTrigger>
          </TabsList>

          <div className="p-4 mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" /> Sair
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-[100dvh] overflow-auto p-8">
          <TabsContent value="fila" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
            <FilaEsperaTab />
          </TabsContent>
          <TabsContent value="ml" className="h-full m-0 outline-none">
            <MachineLearningTab />
          </TabsContent>
          <TabsContent value="pacientes" className="h-full m-0 outline-none">
            <PacientesTab />
          </TabsContent>
          <TabsContent value="historico" className="h-full m-0 outline-none">
            <HistoricoTab />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
