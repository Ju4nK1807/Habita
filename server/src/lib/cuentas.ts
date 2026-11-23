import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "../db.ts";

const scryptAsync = promisify(scrypt) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;
const LARGO_CLAVE = 64;

export type Cuenta = { id: number; correo: string; nombre: string; dispositivo: string };

/** Contraseña → "sal:hash" con scrypt. La contraseña nunca se guarda. */
export async function cifrarClave(clave: string) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(clave, sal, LARGO_CLAVE);
  return `${sal.toString("hex")}:${hash.toString("hex")}`;
}

/** Compara en tiempo constante para no revelar nada por lo que tarda. */
export async function claveCorrecta(clave: string, guardado: string) {
  const [salHex, hashHex] = guardado.split(":");
  if (!salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scryptAsync(clave, Buffer.from(salHex, "hex"), esperado.length);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Crea una sesión y devuelve el token que guarda la app. En la base solo queda su hash. */
export function abrirSesion(cuentaId: number) {
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sesiones (token_hash, cuenta_id) VALUES (?, ?)").run(hashToken(token), cuentaId);
  return token;
}

export function cerrarSesion(token: string) {
  db.prepare("DELETE FROM sesiones WHERE token_hash = ?").run(hashToken(token));
}

export function cuentaDeSesion(token: string): Cuenta | undefined {
  const fila = db.prepare(
    "SELECT c.id, c.correo, c.nombre, c.dispositivo FROM sesiones s JOIN cuentas c ON c.id = s.cuenta_id WHERE s.token_hash = ?",
  ).get(hashToken(token)) as Cuenta | undefined;
  if (fila) db.prepare("UPDATE sesiones SET ultimo_uso = datetime('now') WHERE token_hash = ?").run(hashToken(token));
  return fila;
}

export const vistaCuenta = (c: Cuenta) => ({ nombre: c.nombre, correo: c.correo });
