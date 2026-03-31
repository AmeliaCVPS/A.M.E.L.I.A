import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, usuariosTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { classificarTriagem } from "../lib/ml-triage.js";

const router = Router();

const contadores: Record<string, number> = { urgent: 0, moderate: 0, light: 0 };
const prefixos: Record<string, string> = { urgent: "U", moderate: "M", light: "L" };

async function initContadores() {
  for (const prioridade of ["urgent", "moderate", "light"]) {
    const ultimoTicket = await db.select().from(ticketsTable)
      .where(eq(ticketsTable.prioridade, prioridade))
      .orderBy(desc(ticketsTable.id))
      .limit(1);

    if (ultimoTicket.length > 0) {
      const num = parseInt(ultimoTicket[0].codigo.slice(1));
      if (!isNaN(num)) contadores[prioridade] = num;
    }
  }
}

initContadores().catch(console.error);

function proximoCodigo(prioridade: string): string {
  contadores[prioridade] = (contadores[prioridade] || 0) + 1;
  return `${prefixos[prioridade]}${String(contadores[prioridade]).padStart(3, "0")}`;
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      descricaoSintomas,
      nivelDor,
      temperatura,
      frequenciaCardiaca,
      temFebre,
      dificuldadeRespirar,
      dorNoPeito,
      conscienciaAlterada,
    } = req.body;

    if (!descricaoSintomas || descricaoSintomas.trim().length < 5) {
      res.status(400).json({ error: "Dados inválidos", mensagem: "Descreva seus sintomas." });
      return;
    }

    const predicao = classificarTriagem({
      descricaoSintomas,
      nivelDor: nivelDor ?? 0,
      temperatura: temperatura ?? 36.5,
      frequenciaCardiaca: frequenciaCardiaca ?? 72,
      temFebre: !!temFebre,
      dificuldadeRespirar: !!dificuldadeRespirar,
      dorNoPeito: !!dorNoPeito,
      conscienciaAlterada: !!conscienciaAlterada,
    });

    const codigo = proximoCodigo(predicao.prioridade);

    const [ticket] = await db.insert(ticketsTable).values({
      usuarioId: req.session.userId!,
      codigo,
      prioridade: predicao.prioridade,
      descricaoSintomas: descricaoSintomas.trim(),
      nivelDor: nivelDor ?? null,
      temperatura: temperatura ?? null,
      frequenciaCardiaca: frequenciaCardiaca ?? null,
      temFebre: !!temFebre,
      dificuldadeRespirar: !!dificuldadeRespirar,
      dorNoPeito: !!dorNoPeito,
      conscienciaAlterada: !!conscienciaAlterada,
      predicaoML: predicao.prioridade,
      confiancaML: predicao.confianca,
      status: "waiting",
    }).returning();

    const usuarios = await db.select({ nome: usuariosTable.nome })
      .from(usuariosTable)
      .where(eq(usuariosTable.id, ticket.usuarioId))
      .limit(1);

    res.status(201).json({
      ...ticket,
      nomeUsuario: usuarios[0]?.nome ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Erro na triagem");
    res.status(500).json({ error: "Erro interno", mensagem: "Tente novamente." });
  }
});

export default router;
