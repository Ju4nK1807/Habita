import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { UserPlus } from "lucide-react-native";
import { api, ErrorApi } from "@/servicios/api";
import { useSesion } from "@/store/sesion";
import { usePreferencias } from "@/store/preferencias";
import { espacio, margen } from "@/theme/tokens";
import { Pantalla } from "@/componentes/Pantalla";
import { BarraSuperior } from "@/componentes/BarraSuperior";
import { Texto } from "@/componentes/Texto";
import { CampoTexto } from "@/componentes/CampoTexto";
import { Boton } from "@/componentes/Boton";
import { Aviso } from "@/componentes/Aviso";

const CLAVE_MIN = 8;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Registro() {
  const entrar = useSesion((s) => s.entrar);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [tocados, setTocados] = useState({ correo: false, clave: false, repetida: false });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorApi | null>(null);

  const errores = {
    correo: correo && !CORREO.test(correo.trim()) ? "Ese correo no parece válido. Revíselo" : null,
    clave: clave && clave.length < CLAVE_MIN ? `Use al menos ${CLAVE_MIN} caracteres` : null,
    repetida: repetida && repetida !== clave ? "Las contraseñas no coinciden" : null,
  };
  const motivo =
    !nombre.trim() ? "Escriba su nombre"
    : !correo.trim() ? "Escriba su correo"
    : errores.correo ?? (!clave ? "Escriba una contraseña" : errores.clave ?? (!repetida ? "Repita la contraseña" : errores.repetida ?? undefined));

  const crear = async () => {
    setTocados({ correo: true, clave: true, repetida: true });
    if (motivo) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await api.registrarse(nombre.trim(), correo.trim(), clave);
      usePreferencias.getState().cambiar({ nombre: r.cuenta.nombre });
      await entrar(r.token, r.cuenta);
    } catch (e) {
      setError(e instanceof ErrorApi ? e : new ErrorApi("No pudimos crear la cuenta. Intente de nuevo", "desconocido", 0));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla bordes={["top", "bottom"]} teclado>
      <BarraSuperior variante="compacta" titulo="Crear cuenta" atras={() => (router.canGoBack() ? router.back() : router.replace("/ingresar"))} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: margen.lateral, gap: margen.secciones }}>
        <Texto variante="bodyLg" color="ink600">
          Con su cuenta guarda sus espacios, diseños y proyectos, y los ve desde cualquier teléfono.
        </Texto>

        <View style={{ gap: espacio.s16 }}>
          <CampoTexto etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Cómo quiere que le saludemos" autoComplete="name" textContentType="name" max={40} />
          <CampoTexto
            etiqueta="Correo"
            value={correo}
            onChangeText={setCorreo}
            onBlur={() => setTocados((t) => ({ ...t, correo: true }))}
            error={tocados.correo ? errores.correo : null}
            placeholder="nombre@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <CampoTexto
            etiqueta="Contraseña"
            value={clave}
            onChangeText={setClave}
            onBlur={() => setTocados((t) => ({ ...t, clave: true }))}
            error={tocados.clave ? errores.clave : null}
            ayuda={`Mínimo ${CLAVE_MIN} caracteres.`}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <CampoTexto
            etiqueta="Repita la contraseña"
            value={repetida}
            onChangeText={setRepetida}
            onBlur={() => setTocados((t) => ({ ...t, repetida: true }))}
            error={tocados.repetida ? errores.repetida : null}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={crear}
            returnKeyType="go"
          />
        </View>

        {error ? <Aviso tipo={error.sinConexion ? "sinConexion" : "error"} mensaje={error.message} /> : null}

        <Boton titulo="Crear cuenta" icono={UserPlus} onPress={crear} cargando={enviando} deshabilitado={!!motivo} motivo={motivo} ancho />
      </ScrollView>
    </Pantalla>
  );
}
