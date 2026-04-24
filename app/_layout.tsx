import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
      setIsReady(true);
    };

    checkSession();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="dm"
          options={{
            animation: "slide_from_right",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
