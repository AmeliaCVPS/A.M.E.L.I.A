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
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogIn, Eye, EyeOff, AlertCircle, UserX, KeyRound, BadgeX } from "lucide-react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const formSchema = z.object({
  identificadorType: z.enum(["cpf", "sus"]),
  identificador: z.string().min(1, "Campo obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type ErrorType = "not_found" | "wrong_password" | "invalid_format" | "generic" | null;

const ERROR_CONFIG: Record<NonNullable<ErrorType>, { icon: typeof AlertCircle; title: string; color: string; bg: string; border: string }> = {
  not_found: {
    icon: UserX,
    title: "Usuário não encontrado",
    color: "text-orange-200",
    bg: "bg-orange-500/15",
    border: "border-orange-500/40",
  },
  wrong_password: {
    icon: KeyRound,
    title: "Senha incorreta",
    color: "text-red-200",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
  },
  invalid_format: {
    icon: BadgeX,
    title: "Formato inválido",
    color: "text-yellow-200",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/40",
  },
  generic: {
    icon: AlertCircle,
    title: "Erro ao acessar",
    color: "text-red-200",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
  },
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { setUsuario } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<{ type: ErrorType; mensagem: string } | null>(null);

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
    setLoginError(null);
    const cleanIdentificador = unmask(values.identificador);

    const expectedLen = values.identificadorType === "cpf" ? 11 : 15;
    if (cleanIdentificador.length !== expectedLen) {
      setLoginError({
        type: "invalid_format",
        mensagem: values.identificadorType === "cpf"
          ? "CPF inválido. Um CPF tem 11 dígitos (ex: 000.000.000-00)."
          : "Cartão SUS inválido. Deve ter 15 dígitos.",
      });
      form.setError("identificador", { message: "Formato incorreto" });
      return;
    }

    loginMutation.mutate(
      {
        data: {
          identificador: cleanIdentificador,
          senha: values.senha,
        }
      },
      {
        onSuccess: (response) => {
          setLoginError(null);
          setUsuario(response.usuario);
          toast.success(`Bem-vindo, ${response.usuario.nome}!`);
          if (response.usuario.papel === "admin") {
            setLocation("/admin");
          } else {
            setLocation("/triagem");
          }
        },
        onError: (error: any) => {
          const mensagem = error?.data?.mensagem || "Erro ao acessar. Tente novamente.";
          const campo = error?.data?.campo;
          const errorKey = error?.data?.error || "";

          let type: ErrorType = "generic";
          if (errorKey === "Não cadastrado") type = "not_found";
          else if (errorKey === "Senha inválida") type = "wrong_password";
          else if (errorKey === "Formato inválido") type = "invalid_format";

          setLoginError({ type, mensagem });

          if (campo === "senha") {
            form.setError("senha", { message: "Senha incorreta" });
          } else if (campo === "identificador") {
            form.setError("identificador", { message: "Verifique o número digitado" });
          }
        },
      }
    );
  }

  const errCfg = loginError?.type ? ERROR_CONFIG[loginError.type] : null;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl relative"
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          form.clearErrors("identificador");
                          setLoginError(null);
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
                      className={`h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30 ${form.formState.errors.identificador ? "border-red-400/70 bg-red-500/10" : ""}`}
                      {...field}
                      onChange={(e) => {
                        setLoginError(null);
                        form.clearErrors("identificador");
                        const val = e.target.value;
                        field.onChange(identificadorType === "cpf" ? maskCPF(val) : maskSUS(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-300 text-sm" />
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
                        className={`h-14 text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/30 pr-12 ${form.formState.errors.senha && loginError?.type === "wrong_password" ? "border-red-400/70 bg-red-500/10" : ""}`}
                        {...field}
                        onChange={(e) => {
                          setLoginError(null);
                          form.clearErrors("senha");
                          field.onChange(e);
                        }}
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
                  <FormMessage className="text-red-300 text-sm" />
                </FormItem>
              )}
            />

            {/* ── Error banner ── */}
            <AnimatePresence>
              {loginError && errCfg && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${errCfg.bg} ${errCfg.border}`}
                >
                  <errCfg.icon className={`w-5 h-5 mt-0.5 shrink-0 ${errCfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${errCfg.color}`}>{errCfg.title}</p>
                    <p className="text-white/80 text-sm mt-0.5 leading-snug">{loginError.mensagem}</p>
                    {loginError.type === "not_found" && (
                      <button
                        type="button"
                        onClick={() => setLocation("/cadastro")}
                        className={`mt-2 text-sm font-bold underline underline-offset-2 ${errCfg.color} hover:opacity-80`}
                      >
                        Clique aqui para criar seu cadastro →
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="totem-button w-full bg-white text-blue-900 hover:bg-blue-50 mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Acessando..." : "Entrar e Iniciar Triagem"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
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
