import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Keyboard, Platform, useColorScheme } from "react-native";
import { MessageCircle, Users, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showListener = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: keyboardVisible
          ? { display: "none" }
          : {
              backgroundColor: isDark ? "#262626" : "#ffffff",
              borderTopColor: isDark ? "#3a3a3a" : "#e8e8e8",
              borderTopWidth: 1,
              height: 54 + bottomPadding,
              paddingBottom: bottomPadding,
              paddingTop: 6,
            },
        tabBarActiveTintColor: isDark ? "#f0f0f0" : "#1a1a1a",
        tabBarInactiveTintColor: isDark ? "#555555" : "#aaaaaa",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "Members",
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
