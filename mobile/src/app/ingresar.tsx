import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { api, ErrorApi } from "@/servicios/api";
import { useSesion } from "@/store/sesion";
import { usePreferencias } from "@/store/preferencias";
import { espacio, margen } from "@/theme/tokens";
import { Pantalla } from "@/componentes/Pantalla";
import { Texto } from "@/componentes/Texto";
import { CampoTexto } from "@/componentes/CampoTexto";
import { Boton } from "@/componentes/Boton";
import { Aviso } from "@/componentes/Aviso";

export default function Ingresar() {
  const entrar = useSesion((s) => s.entrar);
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorApi | null>(null);

  const motivo = !correo.trim() ? "Escriba su correo" : !clave ? "Escriba su contraseña" : undefined;

  const ingresar = async () => {
    if (motivo) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await api.ingresar(correo.trim(), clave);
      // El saludo de Inicio usa el nombre de la cuenta si la persona no puso otro.
      if (!usePreferencias.getState().nombre) usePreferencias.getState().cambiar({ nombre: r.cuenta.nombre });
      await entrar(r.token, r.cuenta);
    } catch (e) {
      setError(e instanceof ErrorApi ? e : new ErrorApi("No pudimos iniciar sesión. Intente de nuevo", "desconocido", 0));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla bordes={["top", "bottom"]} teclado>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: margen.lateral, gap: margen.secciones }}>
        <View style={{ gap: espacio.s8 }}>
          <Texto variante="displayLg" accessibilityRole="header">Habita</Texto>
          <Texto variante="bodyLg" color="ink600">Muebles reales que combinan con su espacio. Inicie sesión para ver sus diseños.</Texto>
        </View>

        <View style={{ gap: espacio.s16 }}>
          <CampoTexto
            etiqueta="Correo"
            value={correo}
            onChangeText={setCorreo}
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
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={ingresar}
            returnKeyType="go"
          />
        </View>

        {error ? <Aviso tipo={error.sinConexion ? "sinConexion" : "error"} mensaje={error.message} /> : null}

        <View style={{ gap: espacio.s12 }}>
          <Boton titulo="Iniciar sesión" icono={LogIn} onPress={ingresar} cargando={enviando} deshabilitado={!!motivo} motivo={motivo} ancho />
          <Boton titulo="Crear una cuenta" variante="texto" onPress={() => router.push("/registro")} ancho />
        </View>
      </ScrollView>
    </Pantalla>
  );
}
