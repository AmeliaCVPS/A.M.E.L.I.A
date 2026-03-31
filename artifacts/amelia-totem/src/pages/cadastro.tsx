import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCadastrarUsuario } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { maskCPF, maskSUS, maskPhone, unmask } from "@/lib/masks";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  nome: z.string().min(3, "Nome completo é obrigatório"),
  cpf: z.string().min(14, "CPF incompleto"),
  cartaoSus: z.string().optional(),
  dataNascimento: z.string().optional(),
  telefone: z.string().optional(),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

export default function Cadastro() {
  const [, setLocation] = useLocation();
  const { setUsuario } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      cartaoSus: "",
      dataNascimento: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  const cadastrarMutation = useCadastrarUsuario();

  function onSubmit(values: z.infer<typeof formSchema>) {
    cadastrarMutation.mutate(
      { 
        data: {
          nome: values.nome,
          cpf: unmask(values.cpf),
          senha: values.senha,
          cartaoSus: values.cartaoSus ? unmask(values.cartaoSus) : undefined,
          telefone: values.telefone ? unmask(values.telefone) : undefined,
          dataNascimento: values.dataNascimento || undefined,
        }
      },
      {
        onSuccess: (response) => {
          setUsuario(response.usuario);
          toast.success("Cadastro realizado com sucesso!");
          setLocation("/triagem");
        },
        onError: (error: any) => {
          toast.error(error?.data?.mensagem || "Erro ao realizar cadastro. Verifique os dados.");
        },
      }
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl relative"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 rounded-full text-white hover:bg-white/20 hover:text-white z-10"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Criar Cadastro</h2>
          <p className="text-blue-200 mt-2 text-center">Preencha seus dados para agilizar seu atendimento</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <ScrollArea className="h-[45vh] pr-4 pb-4">
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Nome Completo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Maria da Silva" 
                          className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">CPF</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30"
                            {...field}
                            onChange={(e) => field.onChange(maskCPF(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cartaoSus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Cartão SUS <span className="text-white/50 text-sm font-normal">(Opcional)</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000 0000 0000 0000" 
                            className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30"
                            {...field}
                            onChange={(e) => field.onChange(maskSUS(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Data de Nascimento <span className="text-white/50 text-sm font-normal">(Opcional)</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30 [color-scheme:dark]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Telefone <span className="text-white/50 text-sm font-normal">(Opcional)</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
                            className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30"
                            {...field}
                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Senha (mínimo 6 dígitos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Criar senha" 
                            className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmarSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Repita a senha" 
                            className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <Button 
              type="submit" 
              className="totem-button w-full bg-white text-blue-900 hover:bg-blue-50 mt-6"
              disabled={cadastrarMutation.isPending}
            >
              {cadastrarMutation.isPending ? "Criando cadastro..." : "Criar Cadastro e Iniciar Triagem"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-blue-200">
            Já tem cadastro?{" "}
            <button 
              onClick={() => setLocation("/login")}
              className="text-white font-bold hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
