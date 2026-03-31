import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Cadastro from "@/pages/cadastro";
import Triagem from "@/pages/triagem";
import Senha from "@/pages/senha";
import AdminDashboard from "@/pages/admin/index";

const queryClient = new QueryClient();

// Protected Route Component for Admin
function AdminRoute({ component: Component }: { component: any }) {
  const { usuario, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;
  if (!usuario || usuario.papel !== 'admin') {
    setLocation('/');
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/cadastro" component={Cadastro} />
      <Route path="/triagem" component={Triagem} />
      <Route path="/senha/:id" component={Senha} />
      <Route path="/admin">
        <AdminRoute component={AdminDashboard} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
