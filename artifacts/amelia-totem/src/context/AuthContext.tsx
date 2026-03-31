import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Usuario } from '@workspace/api-client-react';
import { useObterUsuarioAtual } from '@workspace/api-client-react';

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (user: Usuario | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  
  const { data, isLoading } = useObterUsuarioAtual({
    query: {
      retry: false,
      staleTime: Infinity,
    }
  });

  useEffect(() => {
    if (data) {
      setUsuario(data);
    }
  }, [data]);

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
