ALTER TABLE "clientes"
ADD COLUMN "valor_produto" DECIMAL(10,2),
ADD COLUMN "forma_pagamento" "FormaPagamentoEntrega",
ADD COLUMN "status_pagamento" "StatusPagamentoCliente",
ADD COLUMN "valor_entrega_motoboy" DECIMAL(10,2),
ADD COLUMN "valor_entrega" DECIMAL(10,2);
