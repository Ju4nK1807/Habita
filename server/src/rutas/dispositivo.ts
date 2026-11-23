import type { RequestHandler, Response } from "express";
import { ErrorApi } from "../errores.ts";
import { prepararDispositivo } from "../lib/creditos.ts";
import { cuentaDeSesion, type Cuenta } from "../lib/cuentas.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Identifica de quién son los datos. Con sesión iniciada, son los de la cuenta (en cualquier
 * teléfono); sin sesión, los del teléfono (encabezado X-Dispositivo), que sirve para registrarse.
 */
export const requiereDispositivo: RequestHandler = (req, res, next) => {
  const token = req.header("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const cuenta = token ? cuentaDeSesion(token) : undefined;
  if (cuenta) {
    res.locals.cuenta = cuenta;
    res.locals.token = token;
    res.locals.dispositivo = cuenta.dispositivo;
    return next();
  }
  const id = req.header("x-dispositivo");
  if (!id || !UUID.test(id)) {
    throw new ErrorApi(401, "sin_dispositivo", "La app no envió su identificador. Ciérrela y ábrala de nuevo");
  }
  prepararDispositivo(id.toLowerCase());
  res.locals.dispositivo = id.toLowerCase();
  next();
};

/** Las rutas de datos exigen sesión: sin ella la app muestra la pantalla de inicio de sesión. */
export const requiereSesion: RequestHandler = (_req, res, next) => {
  if (!res.locals.cuenta) throw new ErrorApi(401, "sin_sesion", "Su sesión terminó. Inicie sesión de nuevo");
  next();
};

export const dispositivo = (res: Response): string => res.locals.dispositivo as string;
export const cuenta = (res: Response): Cuenta | undefined => res.locals.cuenta as Cuenta | undefined;
