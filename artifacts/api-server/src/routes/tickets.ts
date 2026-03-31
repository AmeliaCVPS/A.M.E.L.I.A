import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, usuariosTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

async function enriquecerTicket(ticket: typeof ticketsTable.$inferSelect) {
  const usuarios = await db.select({ nome: usuariosTable.nome })
    .from(usuariosTable)
    .where(eq(usuariosTable.id, ticket.usuarioId))
    .limit(1);

  return {
    ...ticket,
    nomeUsuario: usuarios[0]?.nome ?? "",
  };
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { status, priority } = req.query as Record<string, string>;

    let query = db.select().from(ticketsTable);
    const conditions = [];

    if (status) conditions.push(eq(ticketsTable.status, status));
    if (priority) conditions.push(eq(ticketsTable.prioridade, priority));

    const tickets = conditions.length > 0
      ? await db.select().from(ticketsTable).where(and(...conditions))
      : await db.select().from(ticketsTable);

    const enriched = await Promise.all(tickets.map(enriquecerTicket));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Erro ao listar tickets");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tickets = await db.select().from(ticketsTable)
      .where(eq(ticketsTable.id, id))
      .limit(1);

    if (tickets.length === 0) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    const ticket = tickets[0];

    if (ticket.usuarioId !== req.session.userId && req.session.papel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    res.json(await enriquecerTicket(ticket));
  } catch (err) {
    req.log.error({ err }, "Erro ao buscar ticket");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!["waiting", "called", "attended", "cancelled"].includes(status)) {
      res.status(400).json({ error: "Status inválido" });
      return;
    }

    const extraFields: Partial<typeof ticketsTable.$inferSelect> = {};
    if (status === "called") {
      (extraFields as any).chamadoEm = new Date();
    }

    const [updated] = await db.update(ticketsTable)
      .set({ status, ...extraFields })
      .where(eq(ticketsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    res.json(await enriquecerTicket(updated));
  } catch (err) {
    req.log.error({ err }, "Erro ao atualizar status");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/:id/corrigir", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { correcao } = req.body;

    if (!["urgent", "moderate", "light"].includes(correcao)) {
      res.status(400).json({ error: "Correção inválida" });
      return;
    }

    const [updated] = await db.update(ticketsTable)
      .set({ correcaoAdmin: correcao })
      .where(eq(ticketsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    res.json(await enriquecerTicket(updated));
  } catch (err) {
    req.log.error({ err }, "Erro ao corrigir ticket");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
