import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { Camera, MessageSquareText, ShoppingBag, type LucideIcon } from "lucide-react-native";
import { useTema } from "@/theme/tema";
import { espacio, radio } from "@/theme/tokens";
import { Texto } from "./Texto";
import { Icono } from "./Icono";
import { useReducirMovimiento } from "./Aparecer";

// Los tres pasos de la app, contados de a uno.
const PASOS: { icono: LucideIcon; titulo: string; texto: string }[] = [
  { icono: Camera, titulo: "Tome una foto", texto: "De su cuarto, sala o cocina, tal como está." },
  { icono: MessageSquareText, titulo: "Cuéntenos qué quiere", texto: "Por ejemplo: un sofá con cojines y una alfombra." },
  { icono: ShoppingBag, titulo: "Véalo en su espacio", texto: "Muebles reales de tiendas, con su precio y dónde comprarlos." },
];
const CAMBIO_MS = 3600;

export function FrasesRotativas() {
  const { c } = useTema();
  const reducir = useReducirMovimiento();
  const [i, setI] = useState(0);
  const [v] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reducir) return;
    const t = setInterval(() => {
      Animated.timing(v, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setI((x) => (x + 1) % PASOS.length);
        Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      });
    }, CAMBIO_MS);
    return () => clearInterval(t);
  }, [reducir, v]);

  const p = PASOS[i];
  return (
    <View style={{ gap: espacio.s12 }} accessible accessibilityLabel={PASOS.map((x, n) => `Paso ${n + 1}: ${x.titulo}. ${x.texto}`).join(" ")}>
      <Animated.View
        style={{
          flexDirection: "row", gap: espacio.s12, alignItems: "center", minHeight: 56,
          opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        <View style={{ width: 44, height: 44, borderRadius: radio.completo, backgroundColor: c.brand100, alignItems: "center", justifyContent: "center" }}>
          <Icono de={p.icono} color="brandInk" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="titleSm">{p.titulo}</Texto>
          <Texto variante="bodySm" color="ink600">{p.texto}</Texto>
        </View>
      </Animated.View>
      {/* Puntos: cuál de los tres pasos se está mostrando */}
      <View style={{ flexDirection: "row", gap: espacio.s8 }}>
        {PASOS.map((_, n) => (
          <View key={n} style={{ height: 6, width: n === i ? 24 : 6, borderRadius: radio.completo, backgroundColor: n === i ? c.brand600 : c.border200 }} />
        ))}
      </View>
    </View>
  );
}
