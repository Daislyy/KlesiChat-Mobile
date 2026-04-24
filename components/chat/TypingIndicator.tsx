import React from "react";
import { View, Text } from "react-native";
import type { TypingUser } from "../../types/chat";
import type { ChatTheme } from "../../lib/chatTheme";
import Avatar from "./Avatar";
import TypingDots from "./TypingDots";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  typingLabel: string;
  isDark: boolean;
  t: ChatTheme;
}

export default function TypingIndicator({
  typingUsers,
  typingLabel,
  isDark,
  t,
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
      {/* Stacked avatars */}
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        {typingUsers.slice(0, 3).map((u, i) => (
          <View
            key={u.username}
            style={{
              marginLeft: i > 0 ? -8 : 0,
              zIndex: typingUsers.length - i,
            }}
          >
            <Avatar
              username={u.username}
              avatar_url={u.avatar_url}
              size={28}
              isDark={isDark}
            />
          </View>
        ))}
      </View>

      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 11,
            color: t.typingText,
            marginLeft: 4,
          }}
        >
          {typingLabel}
        </Text>
        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: t.typingBubbleBg,
            borderWidth: 1,
            borderColor: t.typingBubbleBorder,
            borderRadius: 18,
            borderBottomLeftRadius: 4,
          }}
        >
          <TypingDots isDark={isDark} />
        </View>
      </View>
    </View>
  );
}
