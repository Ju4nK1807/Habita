import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { api, ErrorApi } from "@/servicios/api";
import { useSesion } from "@/store/sesion";
import { usePreferencias } from "@/store/preferencias";
import { useTema } from "@/theme/tema";
import { espacio, margen, radio } from "@/theme/tokens";
import { Pantalla } from "@/componentes/Pantalla";
import { Texto } from "@/componentes/Texto";
import { CampoTexto } from "@/componentes/CampoTexto";
import { Boton } from "@/componentes/Boton";
import { Aviso } from "@/componentes/Aviso";
import { Aparecer } from "@/componentes/Aparecer";
import { EscenaCuarto } from "@/componentes/EscenaCuarto";
import { FrasesRotativas } from "@/componentes/FrasesRotativas";

export default function Ingresar() {
  const { c } = useTema();
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
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: margen.lateral, gap: margen.secciones }}>
        <Aparecer style={{ gap: espacio.s4 }}>
          <Texto variante="displayLg" accessibilityRole="header">Habita</Texto>
          <Texto variante="bodyLg" color="ink600">Vea cómo quedan muebles reales en su espacio antes de comprarlos.</Texto>
        </Aparecer>

        <Aparecer retraso={100}>
          <EscenaCuarto />
        </Aparecer>

        <Aparecer retraso={200}>
          <FrasesRotativas />
        </Aparecer>

        <Aparecer retraso={300}>
          <View style={{ gap: espacio.s16, padding: margen.tarjeta, borderRadius: radio.tarjeta, borderWidth: 1, borderColor: c.border200, backgroundColor: c.surface100 }}>
            <Texto variante="titleMd" accessibilityRole="header">Inicie sesión</Texto>
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
            {error ? <Aviso tipo={error.sinConexion ? "sinConexion" : "error"} mensaje={error.message} /> : null}
            <Boton titulo="Iniciar sesión" icono={LogIn} onPress={ingresar} cargando={enviando} deshabilitado={!!motivo} motivo={motivo} ancho />
          </View>
        </Aparecer>

        <Aparecer retraso={400} style={{ alignItems: "center", gap: espacio.s4 }}>
          <Texto variante="bodyMd" color="ink600">¿Es nuevo en Habita?</Texto>
          <Boton titulo="Crear una cuenta" variante="texto" onPress={() => router.push("/registro")} />
        </Aparecer>
      </ScrollView>
    </Pantalla>
  );
}
