import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, type StyleProp, type ViewStyle } from "react-native";

/** Si la persona pidió reducir el movimiento en su teléfono, las animaciones se saltan. */
export function useReducirMovimiento() {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducir);
    const s = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducir);
    return () => s.remove();
  }, []);
  return reducir;
}

type Props = { children: React.ReactNode; retraso?: number; desde?: number; style?: StyleProp<ViewStyle> };

/** Entra subiendo y apareciendo. Con `retraso` se escalonan varios elementos. */
export function Aparecer({ children, retraso = 0, desde = 16, style }: Props) {
  const reducir = useReducirMovimiento();
  const [v] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducir) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration: 420, delay: retraso, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reducir, retraso, v]);

  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [desde, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}
