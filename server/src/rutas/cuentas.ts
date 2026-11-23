import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, transaccion } from "../db.ts";
import { ErrorApi } from "../errores.ts";
import { prepararDispositivo } from "../lib/creditos.ts";
import { abrirSesion, cerrarSesion, cifrarClave, claveCorrecta, vistaCuenta, type Cuenta } from "../lib/cuentas.ts";
import { texto } from "../lib/validar.ts";
import { cuenta } from "./dispositivo.ts";

export const cuentas = Router();

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CLAVE_MIN = 8;

// Contra quien prueba contraseñas: tras 5 fallos seguidos con un correo, se espera 5 minutos.
const MAX_FALLOS = 5;
const ESPERA_MS = 5 * 60_000;
const fallos = new Map<string, { n: number; hasta: number }>();

function leerCorreo(v: unknown) {
  const correo = texto(v, "el correo", 120)!.trim().toLowerCase();
  if (!CORREO.test(correo)) throw new ErrorApi(400, "dato_invalido", "Ese correo no parece válido. Revíselo");
  return correo;
}

function leerClave(v: unknown) {
  if (typeof v !== "string" || !v) throw new ErrorApi(400, "dato_invalido", "Escriba su contraseña");
  if (v.length > 200) throw new ErrorApi(400, "dato_invalido", "La contraseña es demasiado larga");
  return v;
}

cuentas.post("/cuentas/registro", async (req, res) => {
  const nombre = texto(req.body?.nombre, "su nombre", 40)!.trim();
  const correo = leerCorreo(req.body?.correo);
  const clave = leerClave(req.body?.clave);
  if (clave.length < CLAVE_MIN) throw new ErrorApi(400, "clave_corta", `La contraseña debe tener al menos ${CLAVE_MIN} caracteres`);
  if (db.prepare("SELECT 1 FROM cuentas WHERE correo = ?").get(correo)) {
    throw new ErrorApi(409, "correo_usado", "Ya hay una cuenta con ese correo. Inicie sesión");
  }

  const hash = await cifrarClave(clave);
  // Cada cuenta nueva empieza vacía (sin espacios ni diseños) y con sus créditos de bienvenida,
  // aunque se cree desde un teléfono que ya se había usado.
  const propio = randomUUID();
  prepararDispositivo(propio);

  const token = transaccion(() => {
    const r = db.prepare("INSERT INTO cuentas (correo, nombre, clave_hash, dispositivo) VALUES (?, ?, ?, ?)").run(correo, nombre, hash, propio);
    return abrirSesion(Number(r.lastInsertRowid));
  });
  res.status(201).json({ token, cuenta: { nombre, correo } });
});

cuentas.post("/cuentas/ingreso", async (req, res) => {
  const correo = leerCorreo(req.body?.correo);
  const clave = leerClave(req.body?.clave);

  const f = fallos.get(correo);
  if (f && f.n >= MAX_FALLOS && Date.now() < f.hasta) {
    throw new ErrorApi(429, "muchos_intentos", "Demasiados intentos. Espere 5 minutos y vuelva a intentarlo");
  }
  const fila = db.prepare("SELECT id, correo, nombre, dispositivo, clave_hash FROM cuentas WHERE correo = ?").get(correo) as
    (Cuenta & { clave_hash: string }) | undefined;
  // El mismo mensaje si el correo no existe o la contraseña falla: no revela qué correos tienen cuenta.
  if (!fila || !(await claveCorrecta(clave, fila.clave_hash))) {
    const n = (f && Date.now() < f.hasta ? f.n : 0) + 1;
    fallos.set(correo, { n, hasta: Date.now() + ESPERA_MS });
    throw new ErrorApi(401, "credenciales", "Correo o contraseña incorrectos");
  }
  fallos.delete(correo);
  res.json({ token: abrirSesion(fila.id), cuenta: vistaCuenta(fila) });
});

cuentas.post("/cuentas/salida", (_req, res) => {
  const token = res.locals.token as string | undefined;
  if (token) cerrarSesion(token);
  res.status(204).end();
});

cuentas.get("/cuentas/yo", (_req, res) => {
  const c = cuenta(res);
  if (!c) throw new ErrorApi(401, "sin_sesion", "Su sesión terminó. Inicie sesión de nuevo");
  res.json(vistaCuenta(c));
});
