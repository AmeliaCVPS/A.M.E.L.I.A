import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, usuariosTable } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

async function enriquecerTicket(ticket: typeof ticketsTable.$inferSelect) {
  const usuarios = await db.select({ nome: usuariosTable.nome })
    .from(usuariosTable)
    .where(eq(usuariosTable.id, ticket.usuarioId))
    .limit(1);

  return { ...ticket, nomeUsuario: usuarios[0]?.nome ?? "" };
}

router.get("/fila", requireAdmin, async (req, res) => {
  try {
    const ticketsAtivos = await db.select().from(ticketsTable)
      .where(
        and(
          eq(ticketsTable.status, "waiting"),
        )
      )
      .orderBy(asc(ticketsTable.criadoEm));

    const enriched = await Promise.all(ticketsAtivos.map(enriquecerTicket));

    res.json({
      urgente: enriched.filter((t) => t.prioridade === "urgent"),
      moderado: enriched.filter((t) => t.prioridade === "moderate"),
      leve: enriched.filter((t) => t.prioridade === "light"),
    });
  } catch (err) {
    req.log.error({ err }, "Erro ao buscar fila");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/chamar/:prioridade", requireAdmin, async (req, res) => {
  try {
    const { prioridade } = req.params;

    if (!["urgent", "moderate", "light"].includes(prioridade)) {
      res.status(400).json({ error: "Prioridade inválida" });
      return;
    }

    const proximo = await db.select().from(ticketsTable)
      .where(and(
        eq(ticketsTable.prioridade, prioridade),
        eq(ticketsTable.status, "waiting"),
      ))
      .orderBy(asc(ticketsTable.criadoEm))
      .limit(1);

    if (proximo.length === 0) {
      res.json({ encontrado: false });
      return;
    }

    const [chamado] = await db.update(ticketsTable)
      .set({ status: "called", chamadoEm: new Date() })
      .where(eq(ticketsTable.id, proximo[0].id))
      .returning();

    res.json({
      encontrado: true,
      ticket: await enriquecerTicket(chamado),
    });
  } catch (err) {
    req.log.error({ err }, "Erro ao chamar próximo");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/resetar-fila", requireAdmin, async (req, res) => {
  try {
    await db.update(ticketsTable)
      .set({ status: "cancelled" })
      .where(eq(ticketsTable.status, "waiting"));

    await db.update(ticketsTable)
      .set({ status: "cancelled" })
      .where(eq(ticketsTable.status, "called"));

    res.json({ sucesso: true, mensagem: "Fila resetada com sucesso." });
  } catch (err) {
    req.log.error({ err }, "Erro ao resetar fila");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/estatisticas", requireAdmin, async (req, res) => {
  try {
    const todos = await db.select().from(ticketsTable);

    const total = todos.length;
    const aguardando = todos.filter((t) => t.status === "waiting" || t.status === "called").length;
    const urgente = todos.filter((t) => t.prioridade === "urgent").length;
    const moderado = todos.filter((t) => t.prioridade === "moderate").length;
    const leve = todos.filter((t) => t.prioridade === "light").length;
    const atendidos = todos.filter((t) => t.status === "attended").length;
    const correcoesPendentes = todos.filter(
      (t) => t.status === "attended" && !t.correcaoAdmin
    ).length;

    res.json({ total, aguardando, urgente, moderado, leve, atendidos, correcoesPendentes });
  } catch (err) {
    req.log.error({ err }, "Erro ao buscar estatísticas");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/pacientes", requireAdmin, async (req, res) => {
  try {
    const pacientes = await db.select().from(usuariosTable)
      .where(eq(usuariosTable.papel, "paciente"));

    res.json(pacientes.map((u) => ({
      id: u.id,
      nome: u.nome,
      cpf: u.cpf,
      cartaoSus: u.cartaoSus,
      dataNascimento: u.dataNascimento,
      telefone: u.telefone,
      papel: u.papel,
      criadoEm: u.criadoEm,
    })));
  } catch (err) {
    req.log.error({ err }, "Erro ao listar pacientes");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
