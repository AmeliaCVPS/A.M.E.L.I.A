import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usuariosTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/cadastro", async (req, res) => {
  try {
    const { nome, cpf, cartaoSus, dataNascimento, telefone, senha } = req.body;

    if (!nome || !cpf || !senha) {
      res.status(400).json({ error: "Dados inválidos", mensagem: "Nome, CPF e senha são obrigatórios." });
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      res.status(400).json({ error: "CPF inválido", mensagem: "CPF deve ter 11 dígitos." });
      return;
    }

    if (senha.length < 4) {
      res.status(400).json({ error: "Senha inválida", mensagem: "A senha deve ter ao menos 4 caracteres." });
      return;
    }

    const existente = await db.select().from(usuariosTable)
      .where(eq(usuariosTable.cpf, cpfLimpo))
      .limit(1);

    if (existente.length > 0) {
      res.status(400).json({ error: "CPF já cadastrado", mensagem: "Este CPF já está cadastrado. Faça login." });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const susLimpo = cartaoSus ? cartaoSus.replace(/\D/g, "") : null;

    const [novoUsuario] = await db.insert(usuariosTable).values({
      nome: nome.trim(),
      cpf: cpfLimpo,
      cartaoSus: susLimpo || null,
      dataNascimento: dataNascimento || null,
      telefone: telefone || null,
      senhaHash,
      papel: "paciente",
    }).returning();

    req.session.userId = novoUsuario.id;
    req.session.papel = novoUsuario.papel;
    req.session.nomeUsuario = novoUsuario.nome;

    res.status(201).json({
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        cpf: novoUsuario.cpf,
        cartaoSus: novoUsuario.cartaoSus,
        dataNascimento: novoUsuario.dataNascimento,
        telefone: novoUsuario.telefone,
        papel: novoUsuario.papel,
        criadoEm: novoUsuario.criadoEm,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Erro no cadastro");
    res.status(500).json({ error: "Erro interno", mensagem: "Tente novamente." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identificador, senha } = req.body;

    if (!identificador || !senha) {
      res.status(400).json({ error: "Dados inválidos", mensagem: "Informe o identificador e a senha." });
      return;
    }

    const idLimpo = identificador.replace(/\D/g, "");

    if (idLimpo.length !== 11 && idLimpo.length !== 15) {
      res.status(400).json({ error: "Formato inválido", mensagem: "Digite um CPF (11 dígitos) ou Cartão SUS (15 dígitos) válido.", campo: "identificador" });
      return;
    }

    const usuarios = await db.select().from(usuariosTable)
      .where(or(
        eq(usuariosTable.cpf, idLimpo),
        eq(usuariosTable.cartaoSus, idLimpo),
      ))
      .limit(1);

    if (usuarios.length === 0) {
      const tipo = idLimpo.length === 11 ? "CPF" : "Cartão SUS";
      res.status(401).json({ error: "Não cadastrado", mensagem: `Este ${tipo} não possui cadastro. Clique em "Criar meu cadastro" para se registrar.`, campo: "identificador" });
      return;
    }

    const usuario = usuarios[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaValida) {
      res.status(401).json({ error: "Senha inválida", mensagem: "Senha incorreta. Verifique e tente novamente.", campo: "senha" });
      return;
    }

    req.session.userId = usuario.id;
    req.session.papel = usuario.papel;
    req.session.nomeUsuario = usuario.nome;

    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        cpf: usuario.cpf,
        cartaoSus: usuario.cartaoSus,
        dataNascimento: usuario.dataNascimento,
        telefone: usuario.telefone,
        papel: usuario.papel,
        criadoEm: usuario.criadoEm,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Erro no login");
    res.status(500).json({ error: "Erro interno", mensagem: "Tente novamente." });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ sucesso: true, mensagem: "Logout realizado com sucesso." });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const usuarios = await db.select().from(usuariosTable)
      .where(eq(usuariosTable.id, req.session.userId!))
      .limit(1);

    if (usuarios.length === 0) {
      res.status(401).json({ error: "Usuário não encontrado" });
      return;
    }

    const u = usuarios[0];
    res.json({
      id: u.id,
      nome: u.nome,
      cpf: u.cpf,
      cartaoSus: u.cartaoSus,
      dataNascimento: u.dataNascimento,
      telefone: u.telefone,
      papel: u.papel,
      criadoEm: u.criadoEm,
    });
  } catch (err) {
    req.log.error({ err }, "Erro ao buscar usuário atual");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
