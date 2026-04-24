import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { MessageCircle, Hash } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { getChatTheme } from "../../lib/chatTheme";
import type { OnlineUser, TypingUser, CurrentUser } from "../../types/chat";
import Avatar from "../../components/chat/Avatar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MembersScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [allUsers, setAllUsers] = useState<(OnlineUser & { id: string })[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isDark, setIsDark] = useState(false);

  const t = getChatTheme(isDark);

  const fetchUnread = async (myId: string) => {
    const { data } = await supabase
      .from("direct_messages")
      .select("sender_id")
      .eq("receiver_id", myId)
      .eq("is_read", false);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((row: { sender_id: string }) => {
        counts[row.sender_id] = (counts[row.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  };

  useEffect(() => {
    let typingChannel: ReturnType<typeof supabase.channel>;
    let unreadChannel: ReturnType<typeof supabase.channel>;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username,avatar_url")
        .eq("id", user.id)
        .single();

      const me: CurrentUser = {
        id: user.id,
        username: profile?.username || "unknown",
        avatar_url: profile?.avatar_url || "",
      };
      setCurrentUser(me);

      // Fetch all users
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id,username,avatar_url");
      if (allProfiles) {
        setAllUsers(
          allProfiles.map((p: any) => ({
            id: p.id,
            username: p.username || "unknown",
            avatar_url: p.avatar_url || "",
          }))
        );
      }

      await fetchUnread(user.id);

      // Typing/presence channel
      typingChannel = supabase.channel("typing-room-members", {
        config: { presence: { key: user.id } },
      });

      const syncPresenceState = () => {
        const state = typingChannel.presenceState();
        const all = Object.values(state).flat() as any[];
        setOnlineUsers(
          all.map((u) => ({
            username: u.username,
            avatar_url: u.avatar_url || "",
          }))
        );
        setTypingUsers(
          all
            .filter((u) => u.isTyping && u.username !== me.username)
            .map((u) => ({
              username: u.username,
              avatar_url: u.avatar_url || "",
              timestamp: Date.now(),
            }))
        );
      };

      typingChannel
        .on("presence", { event: "sync" }, syncPresenceState)
        .on("presence", { event: "join" }, syncPresenceState)
        .on("presence", { event: "leave" }, syncPresenceState)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED")
            await typingChannel.track({
              username: me.username,
              avatar_url: me.avatar_url,
              isTyping: false,
            });
        });

      // Unread DM channel
      unreadChannel = supabase
        .channel("members-unread")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          (payload) => {
            if (payload.new.receiver_id === user.id) {
              setUnreadCounts((prev) => ({
                ...prev,
                [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1,
              }));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "direct_messages" },
          () => fetchUnread(user.id)
        )
        .subscribe();
    };

    init();
    return () => {
      if (typingChannel) supabase.removeChannel(typingChannel);
      if (unreadChannel) supabase.removeChannel(unreadChannel);
    };
  }, []);

  if (!currentUser) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.pageBg,
        }}
      >
        <ActivityIndicator size="large" color={t.loaderTopColor} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.pageBg }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: t.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: t.headerBorder,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: t.appTitle,
            marginBottom: 4,
          }}
        >
          Members
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: t.onlineDot,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: t.sectionLabel,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {allUsers.length} member · {onlineUsers.length} online
          </Text>
        </View>
      </View>

      <FlatList
        data={allUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: ou }) => {
          const isOnline = onlineUsers.some(
            (u) => u.username === ou.username
          );
          const isTyping = typingUsers.some(
            (tv) => tv.username === ou.username
          );
          const isMe = ou.username === currentUser.username;
          const unread = unreadCounts[ou.id] || 0;

          return (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                marginBottom: 4,
              }}
            >
              {/* Avatar with status dot */}
              <View style={{ position: "relative", marginRight: 12 }}>
                <Avatar
                  username={ou.username}
                  avatar_url={ou.avatar_url}
                  size={40}
                  isDark={isDark}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: isOnline
                      ? t.onlineDot
                      : isDark
                        ? "#374151"
                        : "#9ca3af",
                    borderWidth: 2,
                    borderColor: t.pageBg,
                  }}
                />
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: unread > 0 ? "700" : "500",
                      color: t.usernameText,
                    }}
                    numberOfLines={1}
                  >
                    {ou.username}
                  </Text>
                  {isMe && (
                    <Text
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        color: t.subText,
                      }}
                    >
                      (kamu)
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: isTyping
                      ? t.typingText
                      : isOnline
                        ? t.subText
                        : isDark
                          ? "#6b7280"
                          : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  {isTyping
                    ? "✦ mengetik..."
                    : isOnline
                      ? "online"
                      : "offline"}
                </Text>
              </View>

              {/* DM button */}
              {!isMe && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: "/dm", params: { user: ou.id } })
                  }
                  style={{
                    position: "relative",
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      unread > 0
                        ? isDark
                          ? "#3b1fa8"
                          : "#ede9fe"
                        : isDark
                          ? "#1e1e2e"
                          : "#f3f4f6",
                    borderWidth: 1,
                    borderColor:
                      unread > 0 ? "#7c3aed" : t.headerBorder,
                  }}
                >
                  <MessageCircle
                    size={16}
                    color={
                      unread > 0
                        ? "#7c3aed"
                        : isDark
                          ? "#e2e8f0"
                          : "#111827"
                    }
                  />
                  {unread > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        minWidth: 18,
                        height: 18,
                        paddingHorizontal: 4,
                        borderRadius: 10,
                        backgroundColor: "#ef4444",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: isDark ? "#0a0a0f" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        {unread > 99 ? "99+" : unread}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
