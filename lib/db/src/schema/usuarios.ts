import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usuariosTable = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: varchar("cpf", { length: 11 }).notNull().unique(),
  cartaoSus: varchar("cartao_sus", { length: 15 }).unique(),
  dataNascimento: varchar("data_nascimento", { length: 10 }),
  telefone: varchar("telefone", { length: 20 }),
  senhaHash: text("senha_hash").notNull(),
  papel: varchar("papel", { length: 20 }).notNull().default("paciente"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const insertUsuarioSchema = createInsertSchema(usuariosTable).omit({
  id: true,
  criadoEm: true,
});

export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuariosTable.$inferSelect;
