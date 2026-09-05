import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { clienteRoutes } from "../routes/cliente.routes.js";
import { errorHandler } from "../middleware/index.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../repositories/cliente.repository.js", () => ({
  clienteRepository: repository,
}));
vi.mock("../utils/jwt.utils.js", () => ({
  verifyAuthToken: (role: string) => ({
    sub: role,
    role,
    email: "test@example.com",
    nome: "Teste",
  }),
}));

describe("cadastro compartilhado de clientes", () => {
  let server: Server;
  let base: string;
  it("não transforma os dados de um pedido em padrões do cliente", async () => {
    repository.create.mockResolvedValue({
      id: "c1",
      ...cliente,
      valorProduto: 30,
      formaPagamento: "PIX",
      statusPagamento: "PAGO",
    });
    const result = await fetch(base, {
      method: "POST",
      headers: {
        Authorization: "Bearer ADMIN",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...cliente,
        valorEntregaMotoboy: 9,
        valorProduto: 30,
        formaPagamento: "PIX",
        statusPagamento: "PAGO",
      }),
    });
    expect(result.status).toBe(201);
    expect(repository.create).toHaveBeenLastCalledWith({
      ...cliente,
      valorEntregaMotoboy: 9,
    });
    const body = await result.json();
    for (const field of [
      "valorProduto",
      "formaPagamento",
      "statusPagamento",
      "valorEntrega",
    ])
      expect(body).not.toHaveProperty(field);
  });
  it.each(["ADMIN", "MOTOBOY"])("exclui cliente como %s", async (role) => {
    repository.delete.mockResolvedValue({ count: 1 });
    const result = await fetch(`${base}/c1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${role}` },
    });
    expect(result.status).toBe(204);
    expect(repository.delete).toHaveBeenLastCalledWith("c1");
  });
  it("retorna 404 ao excluir cliente inexistente", async () => {
    repository.delete.mockResolvedValue({ count: 0 });
    const result = await fetch(`${base}/inexistente`, {
      method: "DELETE",
      headers: { Authorization: "Bearer ADMIN" },
    });
    expect(result.status).toBe(404);
  });
  const cliente = {
    nome: "Maria",
    telefone: "",
    endereco: "Rua A, 10",
    bairro: "Centro",
    cidade: "Fortaleza",
    observacao: "",
  };
  beforeAll(async () => {
    const app = express();
    app.use(express.json(), requireAuth, clienteRoutes, errorHandler);
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Servidor indisponível");
    base = `http://127.0.0.1:${address.port}`;
  });
  afterAll(
    () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  it("bloqueia acesso sem autenticação", async () => {
    expect((await fetch(base)).status).toBe(401);
  });
  it.each(["ADMIN", "MOTOBOY"])(
    "permite cadastrar e consultar a mesma base como %s",
    async (role) => {
      repository.create.mockResolvedValue({ id: "c1", ...cliente });
      repository.list.mockResolvedValue({
        data: [{ id: "c1", ...cliente }],
        total: 1,
      });
      const headers = {
        Authorization: `Bearer ${role}`,
        "Content-Type": "application/json",
      };
      const created = await fetch(base, {
        method: "POST",
        headers,
        body: JSON.stringify(cliente),
      });
      expect(created.status).toBe(201);
      const listed = await fetch(`${base}?search=Maria`, { headers });
      expect(listed.status).toBe(200);
      expect(await listed.json()).toMatchObject({
        data: [{ id: "c1", nome: "Maria" }],
        meta: { total: 1 },
      });
      expect(repository.list).toHaveBeenLastCalledWith({
        search: "Maria",
        page: 1,
        limit: 20,
      });
    },
  );
  it("rejeita endereço vazio e paginação inválida", async () => {
    const headers = {
      Authorization: "Bearer MOTOBOY",
      "Content-Type": "application/json",
    };
    expect(
      (
        await fetch(base, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...cliente, endereco: "  " }),
        })
      ).status,
    ).toBe(400);
    expect((await fetch(`${base}?limit=10000`, { headers })).status).toBe(400);
  });
});
