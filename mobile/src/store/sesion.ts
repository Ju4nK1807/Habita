import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { useBorrador } from "./borrador";

const CLAVE_TOKEN = "habita.sesion";
const CLAVE_CUENTA = "habita.cuenta";

export type Cuenta = { nombre: string; correo: string };

type Sesion = {
  /** "cargando" mientras se lee el teléfono al abrir la app; así no parpadea la pantalla de ingreso. */
  estado: "cargando" | "fuera" | "dentro";
  token: string | null;
  cuenta: Cuenta | null;
  cargar: () => Promise<void>;
  entrar: (token: string, cuenta: Cuenta) => Promise<void>;
  salir: () => Promise<void>;
};

/** El token vive en SecureStore (llavero del teléfono), no en almacenamiento normal. */
export const useSesion = create<Sesion>()((set) => ({
  estado: "cargando",
  token: null,
  cuenta: null,
  cargar: async () => {
    const [token, cuenta] = await Promise.all([SecureStore.getItemAsync(CLAVE_TOKEN), SecureStore.getItemAsync(CLAVE_CUENTA)]);
    set(token ? { estado: "dentro", token, cuenta: cuenta ? (JSON.parse(cuenta) as Cuenta) : null } : { estado: "fuera", token: null, cuenta: null });
  },
  entrar: async (token, cuenta) => {
    await Promise.all([SecureStore.setItemAsync(CLAVE_TOKEN, token), SecureStore.setItemAsync(CLAVE_CUENTA, JSON.stringify(cuenta))]);
    // Lo que quedó a medias en el teléfono (foto, espacio elegido) era de otra sesión.
    useBorrador.getState().reiniciar();
    set({ estado: "dentro", token, cuenta });
  },
  salir: async () => {
    await Promise.all([SecureStore.deleteItemAsync(CLAVE_TOKEN), SecureStore.deleteItemAsync(CLAVE_CUENTA)]);
    set({ estado: "fuera", token: null, cuenta: null });
  },
}));
