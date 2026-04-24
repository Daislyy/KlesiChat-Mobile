import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

interface TypingDotsProps {
  isDark: boolean;
}

function AnimatedDot({ delay, isDark }: { delay: number; isDark: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(600 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: isDark ? "#8b5cf6" : "#7c3aed",
        transform: [{ translateY }],
        opacity: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1],
        }),
      }}
    />
  );
}

export default function TypingDots({ isDark }: TypingDotsProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, padding: 2 }}>
      {[0, 200, 400].map((delay, i) => (
        <AnimatedDot key={i} delay={delay} isDark={isDark} />
      ))}
    </View>
  );
}
