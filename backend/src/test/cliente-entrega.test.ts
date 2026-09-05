import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "../../generated/prisma/client.js";
import { cadastrarDestinatarioDaEntrega } from "../repositories/cliente-entrega.js";
import { EntregaRepository } from "../repositories/entrega.repository.js";

const db = vi.hoisted(() => ({ $transaction: vi.fn() }));
vi.mock("../lib/prisma.js", () => ({ prisma: db }));
const txMock = {
  $executeRaw: vi.fn(),
  cliente: { findMany: vi.fn(), create: vi.fn() },
  entrega: { create: vi.fn() },
};
const tx = txMock as unknown as Prisma.TransactionClient;
const data = {
  nomeCliente: "Maria",
  telefoneCliente: "85999990000",
  endereco: "Rua A, 10",
  cidade: "Fortaleza",
  bairro: "Centro",
  valorEntrega: 12,
  observacao: "Portão azul",
};

describe("destinatário automático da entrega", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMock.cliente.findMany.mockResolvedValue([]);
    txMock.entrega.create.mockResolvedValue({ id: "e1" });
    txMock.cliente.create.mockResolvedValue({ id: "c1" });
    db.$transaction.mockImplementation(
      (fn: (client: Prisma.TransactionClient) => unknown) => fn(tx),
    );
  });
  it("salva entrega e destinatário na mesma transação, com valor do motoboy", async () => {
    await new EntregaRepository().create(data, "m1");
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.entrega.create).toHaveBeenCalled();
    expect(txMock.cliente.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nome: "Maria",
        telefone: data.telefoneCliente,
        valorEntregaMotoboy: 12,
      }),
    });
  });
  it("usa o valor motoboy do pedido e mantém a taxa separada", async () => {
    await new EntregaRepository().createCliente({
      ...data,
      valorEntregaMotoboy: 9,
      valorEntrega: 15,
      valorProduto: 70,
      formaPagamento: "PIX",
      statusPagamento: "PAGO",
    });
    const saved = txMock.cliente.create.mock.calls[0][0].data;
    expect(saved.valorEntregaMotoboy).toBe(9);
    for (const field of [
      "valorEntrega",
      "valorProduto",
      "formaPagamento",
      "statusPagamento",
    ])
      expect(saved).not.toHaveProperty(field);
  });
  it("não duplica nem sobrescreve cadastro existente com o mesmo nome e endereço", async () => {
    txMock.cliente.findMany.mockResolvedValue([
      { nome: "MARIA", endereco: "Rua A, 10", cidade: "Fortaleza" },
    ]);
    await cadastrarDestinatarioDaEntrega(tx, data);
    expect(txMock.cliente.create).not.toHaveBeenCalled();
  });
  it("reconhece cidade incorporada ao endereço pelo planejador", async () => {
    txMock.cliente.findMany.mockResolvedValue([
      { nome: "Maria", endereco: "Rua A, 10", cidade: "Fortaleza" },
    ]);
    await cadastrarDestinatarioDaEntrega(tx, {
      ...data,
      endereco: "Rua A, 10, Fortaleza",
      cidade: "",
    });
    expect(txMock.cliente.create).not.toHaveBeenCalled();
  });
  it("mantém compatibilidade com entregas sem nome", async () => {
    await cadastrarDestinatarioDaEntrega(tx, { ...data, nomeCliente: "  " });
    expect(txMock.cliente.create).not.toHaveBeenCalled();
    expect(txMock.$executeRaw).not.toHaveBeenCalled();
  });
  it("propaga falha no cadastro para a transação reverter a entrega", async () => {
    txMock.cliente.create.mockRejectedValueOnce(new Error("Falha de gravação"));
    await expect(new EntregaRepository().create(data, "m1")).rejects.toThrow(
      "Falha de gravação",
    );
  });
});
