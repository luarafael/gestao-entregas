import type { Prisma } from "../../generated/prisma/client.js";

interface DadosDestinatario {
  nomeCliente?: string | null;
  telefoneCliente?: string | null;
  endereco: string;
  bairro?: string | null;
  cidade?: string | null;
  observacao?: string | null;
  valorEntrega?: number;
  valorEntregaMotoboy?: number;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

export async function cadastrarDestinatarioDaEntrega(
  tx: Prisma.TransactionClient,
  entrega: DadosDestinatario,
) {
  const nome = entrega.nomeCliente?.trim();
  if (!nome) return;
  const endereco = entrega.endereco.trim();
  const cidade = entrega.cidade?.trim() ?? "";
  // Serializa cadastros automáticos do mesmo destinatário, inclusive entre motoboys.
  const address = [endereco, cidade].filter(Boolean).join(", ");
  const key = JSON.stringify([normalize(nome), normalize(address)]);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  const candidates = await tx.cliente.findMany({
    where: { nome: { equals: nome, mode: "insensitive" } },
  });
  const existing = candidates.find(
    (cliente) =>
      normalize(
        [cliente.endereco, cliente.cidade].filter(Boolean).join(", "),
      ) === normalize(address),
  );
  if (existing) return;
  await tx.cliente.create({
    data: {
      nome,
      telefone: entrega.telefoneCliente?.trim() ?? "",
      endereco,
      bairro:
        entrega.bairro?.trim() === "—" ? "" : (entrega.bairro?.trim() ?? ""),
      cidade,
      observacao: entrega.observacao?.trim() ?? "",
      valorEntregaMotoboy: entrega.valorEntregaMotoboy ?? entrega.valorEntrega,
    },
  });
}
