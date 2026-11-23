import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useTema } from "@/theme/tema";
import { AnfitrionToast } from "@/componentes/Toast";
import { useSesion } from "@/store/sesion";

export default function Raiz() {
  const { c, oscuro } = useTema();
  const [listas] = useFonts({ Fraunces_700Bold, Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const { estado, cargar } = useSesion();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.surface000);
  }, [c.surface000]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Mientras se leen las fuentes y la sesión guardada no se muestra nada, para no parpadear.
  if (!listas || estado === "cargando") return <View style={{ flex: 1, backgroundColor: c.surface000 }} />;
  const dentro = estado === "dentro";

  return (
    <SafeAreaProvider>
      <StatusBar style={oscuro ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.surface000 } }}>
        {/* Sin sesión solo existen ingresar y registro; con sesión, el resto de la app. */}
        <Stack.Protected guard={dentro}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="nuevo" options={{ gestureEnabled: false }} />
          <Stack.Screen name="generacion/[id]" />
          <Stack.Screen name="propuesta/[id]" />
          <Stack.Screen name="ajustar/[id]" />
          <Stack.Screen name="espacio/nuevo" />
          <Stack.Screen name="espacio/[id]" />
          <Stack.Screen name="proyecto/[id]" />
          <Stack.Screen name="creditos" />
        </Stack.Protected>
        <Stack.Protected guard={!dentro}>
          <Stack.Screen name="ingresar" />
          <Stack.Screen name="registro" />
        </Stack.Protected>
      </Stack>
      <AnfitrionToast />
    </SafeAreaProvider>
  );
}
