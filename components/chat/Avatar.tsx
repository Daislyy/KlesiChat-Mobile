import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { getAvatarColor } from "../../lib/chatTheme";

interface AvatarProps {
  username: string;
  avatar_url?: string;
  size?: number;
  glow?: boolean;
  isDark?: boolean;
}

export default function Avatar({
  username,
  avatar_url,
  size = 32,
  glow = false,
  isDark = false,
}: AvatarProps) {
  const { bg, text } = getAvatarColor(username, isDark);

  if (avatar_url) {
    return (
      <Image
        source={{ uri: avatar_url }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          glow && {
            borderWidth: 2,
            borderColor: isDark ? "#8b5cf6" : "#7c3aed",
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: text + "33",
        },
        glow && {
          borderWidth: 2,
          borderColor: isDark ? "#8b5cf6" : "#7c3aed",
        },
      ]}
    >
      <Text
        style={{
          color: text,
          fontSize: size * 0.38,
          fontWeight: "700",
        }}
      >
        {username[0]?.toUpperCase()}
      </Text>
    </View>
  );
}
