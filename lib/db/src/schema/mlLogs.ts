import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mlLogsTable = pgTable("ml_logs", {
  id: serial("id").primaryKey(),
  treinadoEm: timestamp("treinado_em").defaultNow().notNull(),
  amostrasUsadas: integer("amostras_usadas").notNull().default(0),
  acuracia: real("acuracia"),
  notas: text("notas"),
});

export const insertMLLogSchema = createInsertSchema(mlLogsTable).omit({
  id: true,
  treinadoEm: true,
});

export type InsertMLLog = z.infer<typeof insertMLLogSchema>;
export type MLLog = typeof mlLogsTable.$inferSelect;
