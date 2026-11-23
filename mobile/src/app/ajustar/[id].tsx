import { useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { SendHorizontal, Sparkles, Undo2 } from "lucide-react-native";
import { api, ErrorApi, urlArchivo } from "@/servicios/api";
import { useConsulta } from "@/hooks/useConsulta";
import { useTema } from "@/theme/tema";
import { alto, espacio, margen, radio, tipografia } from "@/theme/tokens";
import type { MensajeAjuste } from "@/servicios/tipos";
import { Pantalla } from "@/componentes/Pantalla";
import { BarraSuperior } from "@/componentes/BarraSuperior";
import { BotonIcono } from "@/componentes/BotonIcono";
import { Texto } from "@/componentes/Texto";
import { Icono } from "@/componentes/Icono";
import { Chip } from "@/componentes/Chip";
import { Aviso } from "@/componentes/Aviso";
import { Esqueleto } from "@/componentes/Esqueleto";

const SUGERENCIAS = [
  "Cámbielo a color madera clara",
  "Quite lo que estorba alrededor",
  "Está flotando: póngalo en el piso",
  "Muévalo más a la izquierda",
];

type Pendiente = { mensaje: string } | null;

export default function Ajustar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propuestaId = Number(id);
  const { c } = useTema();
  const lista = useRef<FlatList<MensajeAjuste>>(null);
  const { datos, error, cargando, recargar } = useConsulta(() =>
    Promise.all([api.propuesta(propuestaId), api.ajustes(propuestaId)]).then(([propuesta, chat]) => ({ propuesta, chat })),
  );
  const [texto, setTexto] = useState("");
  const [pendiente, setPendiente] = useState<Pendiente>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [deshaciendo, setDeshaciendo] = useState(false);
  // La imagen grande es la vigente; tocar la miniatura de un mensaje la muestra arriba.
  const [vista, setVista] = useState<string | null>(null);

  const p = datos?.propuesta;
  const ajustes = datos?.chat.ajustes ?? [];
  const conImagen = ajustes.filter((a) => a.imagenUrl).length;
  const quedan = datos ? datos.chat.maximo - conImagen : null;
  const vigente = p?.enEspacioUrl ?? p?.imagenUrl ?? null;
  const imagen = urlArchivo(vista ?? vigente);

  const enviar = async (mensaje: string) => {
    const m = mensaje.trim();
    if (!m || pendiente) return;
    setTexto("");
    setErrorEnvio(null);
    setVista(null);
    setPendiente({ mensaje: m });
    try {
      await api.ajustar(propuestaId, m);
      await recargar();
    } catch (e) {
      setErrorEnvio(e instanceof ErrorApi ? e.message : "No pudimos ajustar la imagen. Intente de nuevo");
      setTexto(m);
    } finally {
      setPendiente(null);
      setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const deshacer = async () => {
    setDeshaciendo(true);
    setErrorEnvio(null);
    setVista(null);
    try {
      await api.deshacerAjuste(propuestaId);
      await recargar();
    } catch (e) {
      setErrorEnvio(e instanceof ErrorApi ? e.message : "No pudimos deshacer. Intente de nuevo");
    } finally {
      setDeshaciendo(false);
    }
  };

  return (
    <Pantalla bordes={["top", "bottom"]} teclado>
      <BarraSuperior
        variante="compacta"
        titulo="Ajustar con IA"
        atras={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        acciones={
          <BotonIcono icono={Undo2} etiqueta="Deshacer el último ajuste" onPress={deshacer} deshabilitado={!conImagen || deshaciendo || !!pendiente} />
        }
      />

      {/* Imagen vigente (o la del mensaje que se tocó) */}
      <View style={{ height: "38%", marginHorizontal: margen.lateral, borderRadius: radio.tarjeta, overflow: "hidden", backgroundColor: c.surface200 }}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={{ flex: 1 }} contentFit="contain" transition={200} accessibilityLabel={p ? `Imagen de ${p.nombre}` : "Imagen del mueble"} />
        ) : (
          <Esqueleto alto="100%" radio={0} />
        )}
        {pendiente ? (
          <View style={{ position: "absolute", left: espacio.s12, right: espacio.s12, bottom: espacio.s12, padding: espacio.s8, borderRadius: radio.boton, backgroundColor: c.surface100 }}>
            <Texto variante="labelMd" color="accentInk" centrado>Ajustando la imagen. Toma unos 10 segundos</Texto>
          </View>
        ) : null}
        {vista && vista !== vigente ? (
          <View style={{ position: "absolute", top: espacio.s8, left: espacio.s8 }}>
            <Chip texto="Ver la actual" activo onPress={() => setVista(null)} />
          </View>
        ) : null}
      </View>

      {error ? <View style={{ padding: margen.lateral }}><Aviso tipo={error.sinConexion ? "sinConexion" : "error"} mensaje={error.message} accion={{ texto: "Reintentar", onPress: recargar }} /></View> : null}

      <FlatList
        ref={lista}
        data={ajustes}
        keyExtractor={(a) => String(a.id)}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: margen.lateral, gap: espacio.s12 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <Burbuja de="ia">
            {cargando && !datos ? (
              <Esqueleto alto={16} ancho="80%" />
            ) : (
              <Texto variante="bodyMd">
                Pídame cambios sobre esta imagen: el color del mueble, quitar lo que estorba, moverlo o corregir si se ve flotando.
              </Texto>
            )}
          </Burbuja>
        }
        renderItem={({ item }) => (
          <View style={{ gap: espacio.s8 }}>
            <Burbuja de="persona"><Texto variante="bodyMd">{item.mensaje}</Texto></Burbuja>
            <Burbuja de="ia">
              <Texto variante="bodyMd">{item.respuesta}</Texto>
              {item.imagenUrl ? (
                <Pressable onPress={() => setVista(item.imagenUrl)} accessibilityRole="button" accessibilityLabel="Ver esta versión arriba">
                  <Image source={{ uri: urlArchivo(item.imagenUrl)! }} style={{ width: 88, height: 88, borderRadius: radio.campo, backgroundColor: c.surface200 }} contentFit="cover" />
                </Pressable>
              ) : null}
            </Burbuja>
          </View>
        )}
        ListFooterComponent={
          pendiente ? (
            <View style={{ gap: espacio.s8, marginTop: ajustes.length ? espacio.s12 : 0 }}>
              <Burbuja de="persona"><Texto variante="bodyMd">{pendiente.mensaje}</Texto></Burbuja>
              <Burbuja de="ia"><Esqueleto alto={16} ancho={160} /></Burbuja>
            </View>
          ) : undefined
        }
      />

      <View style={{ paddingHorizontal: margen.lateral, paddingBottom: espacio.s8, gap: espacio.s8, borderTopWidth: 1, borderTopColor: c.border200, backgroundColor: c.surface200 }}>
        {errorEnvio ? <View style={{ paddingTop: espacio.s8 }}><Aviso tipo="error" mensaje={errorEnvio} /></View> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espacio.s8, paddingTop: espacio.s8 }} keyboardShouldPersistTaps="handled">
          {SUGERENCIAS.map((s) => <Chip key={s} texto={s} activo={false} onPress={() => void enviar(s)} deshabilitado={!!pendiente || !p} />)}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center", gap: espacio.s8 }}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escriba qué quiere cambiar"
            placeholderTextColor={c.ink400}
            maxLength={280}
            editable={!pendiente}
            returnKeyType="send"
            onSubmitEditing={() => void enviar(texto)}
            accessibilityLabel="Qué quiere cambiar de la imagen"
            style={[tipografia.bodyLg, {
              flex: 1, minHeight: alto.campo, paddingHorizontal: espacio.s16, color: c.ink900,
              borderRadius: radio.campo, borderWidth: 1, borderColor: c.border400, backgroundColor: c.surface100,
            }]}
          />
          <BotonIcono icono={SendHorizontal} etiqueta="Enviar" color="brandInk" fondo="superficie" onPress={() => void enviar(texto)} deshabilitado={!texto.trim() || !!pendiente} />
        </View>
        {quedan !== null ? (
          <Texto variante="bodySm" color="ink600" centrado>
            {quedan > 0 ? `Le quedan ${quedan} ajustes de imagen en esta propuesta` : "Ya usó todos los ajustes de esta propuesta"}
          </Texto>
        ) : null}
      </View>
    </Pantalla>
  );
}

/** Burbuja del chat: la persona a la derecha (tono de marca), la IA a la izquierda (tarjeta con su ícono). */
function Burbuja({ de, children }: { de: "persona" | "ia"; children: React.ReactNode }) {
  const { c } = useTema();
  const persona = de === "persona";
  return (
    <View style={{ flexDirection: "row", justifyContent: persona ? "flex-end" : "flex-start", gap: espacio.s8 }}>
      {persona ? null : (
        <View style={{ width: 32, height: 32, borderRadius: radio.completo, backgroundColor: c.accent100, alignItems: "center", justifyContent: "center" }}>
          <Icono de={Sparkles} color="accentInk" tamaño={16} />
        </View>
      )}
      <View
        style={{
          maxWidth: "80%", gap: espacio.s8, padding: espacio.s12, borderRadius: radio.tarjeta,
          backgroundColor: persona ? c.brand100 : c.surface100, borderWidth: persona ? 0 : 1, borderColor: c.border200,
        }}
      >
        {children}
      </View>
    </View>
  );
}
