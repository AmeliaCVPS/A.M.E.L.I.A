import { useLocation } from "wouter"
import { AlertTriangle } from "lucide-react"

export default function NotFound() {
  const [, setLocation] = useLocation()
  
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0f2447] to-[#2E4A7A] text-white">
      <div className="text-center mb-8 flex flex-col items-center">
        <AlertTriangle className="w-24 h-24 mb-6 text-blue-300 opacity-80" />
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-3xl font-medium mb-2">Página não encontrada</h2>
        <p className="text-blue-200 max-w-md mx-auto">
          A rota que você tentou acessar não existe no sistema A.M.E.L.I.A.
        </p>
      </div>
      <button 
        onClick={() => setLocation("/")}
        className="px-8 py-4 bg-white text-blue-900 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg text-xl"
      >
        Voltar para o Início
      </button>
    </div>
  )
}