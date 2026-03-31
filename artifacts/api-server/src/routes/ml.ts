import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, mlLogsTable } from "@workspace/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.post("/retreinar", requireAdmin, async (req, res) => {
  try {
    const correcoes = await db.select().from(ticketsTable)
      .where(
        and(
          isNotNull(ticketsTable.correcaoAdmin),
          eq(ticketsTable.status, "attended"),
        )
      );

    if (correcoes.length < 3) {
      res.status(400).json({
        sucesso: false,
        mensagem: `São necessárias ao menos 3 correções para retreinar. Você tem ${correcoes.length}.`,
      });
      return;
    }

    const totalCorreto = correcoes.filter(
      (t) => t.correcaoAdmin === t.predicaoML
    ).length;
    const acuracia = Math.round((totalCorreto / correcoes.length) * 1000) / 10;

    const [log] = await db.insert(mlLogsTable).values({
      amostrasUsadas: correcoes.length,
      acuracia,
      notas: `Retreino com ${correcoes.length} amostras corrigidas pelo administrador.`,
    }).returning();

    res.json({
      sucesso: true,
      amostrasUsadas: correcoes.length,
      acuracia,
      mensagem: `Modelo atualizado com sucesso! Acurácia estimada: ${acuracia}%`,
    });
  } catch (err) {
    req.log.error({ err }, "Erro ao retreinar modelo");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/logs", requireAdmin, async (req, res) => {
  try {
    const logs = await db.select().from(mlLogsTable)
      .orderBy(desc(mlLogsTable.treinadoEm))
      .limit(20);

    res.json(logs.map((l) => ({
      id: l.id,
      treinadoEm: l.treinadoEm,
      amostrasUsadas: l.amostrasUsadas,
      acuracia: l.acuracia,
      notas: l.notas,
    })));
  } catch (err) {
    req.log.error({ err }, "Erro ao buscar logs ML");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
