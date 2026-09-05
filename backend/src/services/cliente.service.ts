import { clienteRepository } from "../repositories/cliente.repository.js";
import type {
  ClienteInput,
  ListClientesInput,
} from "../schemas/cliente.schema.js";
import { buildPaginatedResult } from "../utils/pagination.utils.js";
import { Prisma } from "../../generated/prisma/client.js";
import { NotFoundError } from "../errors/app.error.js";
import type { Cliente } from "../../generated/prisma/client.js";

function serialize(cliente: Cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    endereco: cliente.endereco,
    bairro: cliente.bairro,
    cidade: cliente.cidade,
    observacao: cliente.observacao,
    criadoEm: cliente.criadoEm,
    atualizadoEm: cliente.atualizadoEm,
    valorEntregaMotoboy:
      cliente.valorEntregaMotoboy == null
        ? null
        : Number(cliente.valorEntregaMotoboy),
  };
}

export const clienteService = {
  async delete(id: string) {
    const result = await clienteRepository.delete(id);
    if (result.count === 0) throw new NotFoundError("Cliente não encontrado");
  },
  async list(filters: ListClientesInput) {
    const { data, total } = await clienteRepository.list(filters);
    return buildPaginatedResult(
      data.map(serialize),
      total,
      filters.page,
      filters.limit,
    );
  },
  async create(data: ClienteInput) {
    return serialize(await clienteRepository.create(data));
  },
  async update(id: string, data: ClienteInput) {
    try {
      return serialize(await clienteRepository.update(id, data));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("Cliente não encontrado");
      }
      throw error;
    }
  },
};
