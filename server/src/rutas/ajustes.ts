import { Router } from "express";
import { ajustar, deshacer, historial, MAX_AJUSTES } from "../lib/chat.ts";
import { id, texto } from "../lib/validar.ts";
import { dispositivo } from "./dispositivo.ts";

/** Chat "Ajustar con IA" de cada propuesta. */
export const ajustes = Router();

ajustes.get("/propuestas/:id/ajustes", (req, res) => {
  res.json({ ajustes: historial(id(req.params.id), dispositivo(res)), maximo: MAX_AJUSTES });
});

ajustes.post("/propuestas/:id/ajustes", async (req, res) => {
  const mensaje = texto(req.body?.mensaje, "su mensaje", 280)!.trim();
  res.status(201).json(await ajustar(id(req.params.id), dispositivo(res), mensaje));
});

ajustes.post("/propuestas/:id/ajustes/deshacer", (req, res) => {
  res.json({ ajustes: deshacer(id(req.params.id), dispositivo(res)), maximo: MAX_AJUSTES });
});
