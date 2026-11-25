import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { Armchair, BedDouble, LampFloor, Sofa, Sparkles, Sprout, type LucideIcon } from "lucide-react-native";
import { useTema } from "@/theme/tema";
import { espacio, radio, type Colores } from "@/theme/tokens";
import { Texto } from "./Texto";
import { Icono } from "./Icono";
import { useReducirMovimiento } from "./Aparecer";

// Ilustración de lo que hace la app: un cuarto donde se van probando muebles de distintos colores.
const OPCIONES: { icono: LucideIcon; color: keyof Colores; nombre: string }[] = [
  { icono: Sofa, color: "brand600", nombre: "Sofá terracota" },
  { icono: Armchair, color: "accent600", nombre: "Sillón verde salvia" },
  { icono: BedDouble, color: "warning600", nombre: "Cama mostaza" },
  { icono: Sofa, color: "ink600", nombre: "Sofá grafito" },
];
const CAMBIO_MS = 3200;

export function EscenaCuarto({ alto = 232 }: { alto?: number }) {
  const { c } = useTema();
  const reducir = useReducirMovimiento();
  const [i, setI] = useState(0);
  const [entrada] = useState(() => new Animated.Value(reducir ? 1 : 0));
  const [escaneo] = useState(() => new Animated.Value(0));
  const [pulso] = useState(() => new Animated.Value(0));
  const [vaiven] = useState(() => new Animated.Value(0));
  const piso = Math.round(alto * 0.3);

  // Cada mueble "cae" y se acomoda en el piso; luego cambia por la siguiente opción.
  useEffect(() => {
    if (reducir) {
      entrada.setValue(1);
      return;
    }
    entrada.setValue(0);
    const a = Animated.spring(entrada, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true });
    a.start();
    const t = setTimeout(() => {
      Animated.timing(entrada, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setI((x) => (x + 1) % OPCIONES.length));
    }, CAMBIO_MS);
    return () => {
      a.stop();
      clearTimeout(t);
    };
  }, [i, reducir, entrada]);

  // Movimientos continuos: la línea que "mira" el cuarto, el destello y la planta.
  useEffect(() => {
    if (reducir) return;
    const bucles = [
      Animated.loop(Animated.timing(escaneo, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true })),
      Animated.loop(Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(vaiven, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(vaiven, { toValue: -1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
    ];
    bucles.forEach((b) => b.start());
    return () => bucles.forEach((b) => b.stop());
  }, [reducir, escaneo, pulso, vaiven]);

  const op = OPCIONES[i];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Ilustración de un cuarto donde se prueban distintos muebles y colores"
      style={{ height: alto, borderRadius: radio.tarjeta, backgroundColor: c.brand100, overflow: "hidden", borderWidth: 1, borderColor: c.border200 }}
    >
      {/* Ventana y cuadro en la pared */}
      <View style={{ position: "absolute", left: espacio.s20, top: espacio.s24, width: 64, height: 72, borderRadius: radio.campo, backgroundColor: c.surface000, borderWidth: 2, borderColor: c.border200 }}>
        <View style={{ position: "absolute", left: 29, top: 0, bottom: 0, width: 2, backgroundColor: c.border200 }} />
        <View style={{ position: "absolute", top: 33, left: 0, right: 0, height: 2, backgroundColor: c.border200 }} />
      </View>
      <View style={{ position: "absolute", right: espacio.s32, top: espacio.s32, width: 52, height: 38, borderRadius: 4, borderWidth: 2, borderColor: c.border400, backgroundColor: c.surface200 }} />

      {/* Piso con zócalo */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: piso, backgroundColor: c.surface300 }}>
        <View style={{ height: 4, backgroundColor: c.border200 }} />
      </View>

      {/* Planta que se mece */}
      <Animated.View style={{ position: "absolute", left: espacio.s24, bottom: piso - 6, transform: [{ rotate: vaiven.interpolate({ inputRange: [-1, 1], outputRange: ["-5deg", "5deg"] }) }] }}>
        <Icono de={Sprout} tamaño={40} color="accent600" />
      </Animated.View>

      {/* Lámpara */}
      <View style={{ position: "absolute", right: espacio.s24, bottom: piso - 6 }}>
        <Icono de={LampFloor} tamaño={64} color="ink600" />
      </View>

      {/* Sombra y mueble que cambia */}
      <Animated.View
        style={{
          position: "absolute", alignSelf: "center", bottom: piso - 12, width: 120, height: 12, borderRadius: radio.completo, backgroundColor: c.ink900,
          opacity: entrada.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] }),
          transform: [{ scaleX: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute", alignSelf: "center", bottom: piso - 8,
          opacity: entrada.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-48, 0] }) },
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
          ],
        }}
      >
        <Icono de={op.icono} tamaño={88} color={op.color} />
      </Animated.View>

      {/* Nombre de la opción sobre el piso */}
      <Animated.View style={{ position: "absolute", left: 0, right: 0, bottom: espacio.s8, alignItems: "center", opacity: entrada }}>
        <View style={{ paddingHorizontal: espacio.s12, paddingVertical: espacio.s4, borderRadius: radio.completo, backgroundColor: c.surface100, borderWidth: 1, borderColor: c.border200 }}>
          <Texto variante="labelMd">{op.nombre}</Texto>
        </View>
      </Animated.View>

      {/* Línea que recorre el cuarto, como cuando la IA mira la foto */}
      {reducir ? null : (
        <Animated.View
          style={{
            position: "absolute", left: 0, right: 0, top: 0, height: 2, backgroundColor: c.accent600,
            opacity: escaneo.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.6, 0.6, 0] }),
            transform: [{ translateY: escaneo.interpolate({ inputRange: [0, 1], outputRange: [0, alto] }) }],
          }}
        />
      )}

      {/* Destello */}
      <Animated.View
        style={{
          position: "absolute", top: espacio.s12, right: espacio.s12, width: 36, height: 36, borderRadius: radio.completo, backgroundColor: c.accent100,
          alignItems: "center", justifyContent: "center",
          transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }],
        }}
      >
        <Icono de={Sparkles} tamaño={20} color="accentInk" />
      </Animated.View>
    </View>
  );
}
