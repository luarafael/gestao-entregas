import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type {
  ClienteInput,
  ListClientesInput,
} from "../schemas/cliente.schema.js";

export const clienteRepository = {
  async list({ search, page, limit }: ListClientesInput) {
    const where: Prisma.ClienteWhereInput = search
      ? {
          OR: ["nome", "telefone", "endereco", "bairro", "cidade"].map(
            (field) => ({
              [field]: { contains: search, mode: "insensitive" },
            }),
          ),
        }
      : {};
    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: [{ nome: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ]);
    return { data, total };
  },
  create(data: ClienteInput) {
    return prisma.cliente.create({ data });
  },
  update(id: string, data: ClienteInput) {
    return prisma.cliente.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.cliente.deleteMany({ where: { id } });
  },
};
