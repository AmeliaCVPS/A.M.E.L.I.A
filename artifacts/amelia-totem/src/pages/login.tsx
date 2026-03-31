import { useState } from "react";
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
import { useLoginUsuario } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { maskCPF, maskSUS, unmask } from "@/lib/masks";
import { motion } from "framer-motion";
import { ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const formSchema = z.object({
  identificadorType: z.enum(["cpf", "sus"]),
  identificador: z.string().min(1, "Campo obrigatório"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setUsuario } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identificadorType: "cpf",
      identificador: "",
      senha: "",
    },
  });

  const identificadorType = form.watch("identificadorType");

  const loginMutation = useLoginUsuario();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const cleanIdentificador = unmask(values.identificador);
    
    loginMutation.mutate(
      { 
        data: {
          identificador: cleanIdentificador,
          senha: values.senha,
        }
      },
      {
        onSuccess: (response) => {
          setUsuario(response.usuario);
          toast.success(`Bem-vindo, ${response.usuario.nome}!`);
          if (response.usuario.papel === "admin") {
            setLocation("/admin");
          } else {
            setLocation("/triagem");
          }
        },
        onError: (error: any) => {
          toast.error(error?.data?.mensagem || "CPF/SUS ou senha incorretos.");
        },
      }
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 rounded-full text-white hover:bg-white/20 hover:text-white"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Acessar Totem</h2>
          <p className="text-blue-200 mt-2 text-center">Insira seus dados para iniciar a triagem</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="identificadorType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-white">Acessar com</FormLabel>
                  <FormControl>
                    <ToggleGroup 
                      type="single" 
                      value={field.value} 
                      onValueChange={(val) => {
                        if (val) {
                          field.onChange(val);
                          form.setValue("identificador", "");
                        }
                      }}
                      className="justify-start bg-black/20 p-1 rounded-xl"
                    >
                      <ToggleGroupItem value="cpf" className="rounded-lg data-[state=on]:bg-white data-[state=on]:text-blue-900 text-white">
                        CPF
                      </ToggleGroupItem>
                      <ToggleGroupItem value="sus" className="rounded-lg data-[state=on]:bg-white data-[state=on]:text-blue-900 text-white">
                        Cartão SUS
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identificador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    {identificadorType === "cpf" ? "Número do CPF" : "Número do Cartão SUS"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={identificadorType === "cpf" ? "000.000.000-00" : "000 0000 0000 0000"} 
                      className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(identificadorType === "cpf" ? maskCPF(val) : maskSUS(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Sua senha" 
                        className="h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30 pr-12"
                        {...field}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="totem-button w-full bg-white text-blue-900 hover:bg-blue-50 mt-8"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Acessando..." : "Entrar e Iniciar Triagem"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <p className="text-blue-200">
            Ainda não tem cadastro?{" "}
            <button 
              onClick={() => setLocation("/cadastro")}
              className="text-white font-bold hover:underline"
            >
              Criar meu cadastro
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
