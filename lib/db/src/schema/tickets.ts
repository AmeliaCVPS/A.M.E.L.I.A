import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usuariosTable } from "./usuarios";

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuariosTable.id),
  codigo: varchar("codigo", { length: 10 }).notNull().unique(),
  prioridade: varchar("prioridade", { length: 10 }).notNull(),
  descricaoSintomas: text("descricao_sintomas").notNull(),
  nivelDor: integer("nivel_dor"),
  temperatura: real("temperatura"),
  frequenciaCardiaca: integer("frequencia_cardiaca"),
  temFebre: boolean("tem_febre").default(false),
  dificuldadeRespirar: boolean("dificuldade_respirar").default(false),
  dorNoPeito: boolean("dor_no_peito").default(false),
  conscienciaAlterada: boolean("consciencia_alterada").default(false),
  predicaoML: varchar("predicao_ml", { length: 10 }),
  confiancaML: real("confianca_ml"),
  correcaoAdmin: varchar("correcao_admin", { length: 10 }),
  status: varchar("status", { length: 20 }).notNull().default("waiting"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  chamadoEm: timestamp("chamado_em"),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({
  id: true,
  criadoEm: true,
  chamadoEm: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
