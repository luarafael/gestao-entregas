import { Router } from "express";
import {
  asyncHandler,
  getRouteParam,
  getValidatedQuery,
  validateBody,
  validateQuery,
} from "../middleware/index.js";
import { requireRole } from "../middleware/auth.middleware.js";
import {
  clienteSchema,
  listClientesSchema,
  type ListClientesInput,
} from "../schemas/cliente.schema.js";
import { clienteService } from "../services/cliente.service.js";

export const clienteRoutes = Router();
clienteRoutes.use(requireRole("ADMIN", "MOTOBOY"));
clienteRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await clienteService.delete(getRouteParam(req, "id"));
    res.status(204).send();
  }),
);
clienteRoutes.get(
  "/",
  validateQuery(listClientesSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await clienteService.list(getValidatedQuery<ListClientesInput>(req)),
    );
  }),
);
clienteRoutes.post(
  "/",
  validateBody(clienteSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await clienteService.create(req.body));
  }),
);
clienteRoutes.put(
  "/:id",
  validateBody(clienteSchema),
  asyncHandler(async (req, res) => {
    res.json(await clienteService.update(getRouteParam(req, "id"), req.body));
  }),
);
