import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Mic, X, StopCircle } from "lucide-react-native";
import { Audio } from "expo-av";
import { supabase } from "../lib/supabase";
import { getChatTheme, formatDuration } from "../lib/chatTheme";
import { playNotificationSound } from "../lib/audioNotification";
import type { CurrentUser, DirectMessage } from "../types/chat";
import Avatar from "../components/chat/Avatar";
import VoiceMessagePlayer from "../components/chat/VoiceMessagePlayer";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DMScreen() {
  const { user: userId } = useLocalSearchParams<{ user: string }>();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    username: string;
    avatar_url: string;
  } | null>(null);
  const [isDark, setIsDark] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const t = getChatTheme(isDark);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const fetchMessages = useCallback(
    async (myId: string, theirId: string) => {
      const { data: dms } = await supabase
        .from("direct_messages")
        .select(
          "*,sender:profiles!direct_messages_sender_id_fkey(username,avatar_url)"
        )
        .or(
          `and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`
        )
        .order("created_at", { ascending: true });

      if (dms) {
        setMessages(
          dms.map((m: any) => ({
            ...m,
            sender_username: m.sender?.username || "",
            sender_avatar: m.sender?.avatar_url || "",
          }))
        );
      }
    },
    []
  );

  useEffect(() => {
    if (!userId) {
      router.back();
      return;
    }

    let channel: ReturnType<typeof supabase.channel>;
    let autoRefreshInterval: ReturnType<typeof setInterval>;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const [{ data: me }, { data: other }] = await Promise.all([
        supabase
          .from("profiles")
          .select("username,avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("id,username,avatar_url")
          .eq("id", userId)
          .single(),
      ]);

      const meUser: CurrentUser = {
        id: user.id,
        username: me?.username || "",
        avatar_url: me?.avatar_url || "",
      };
      setCurrentUser(meUser);
      setOtherUser({
        id: userId,
        username: other?.username || "",
        avatar_url: other?.avatar_url || "",
      });

      await fetchMessages(user.id, userId);
      setTimeout(scrollToBottom, 200);

      autoRefreshInterval = setInterval(
        () => fetchMessages(user.id, userId),
        2000
      );

      // Mark as read
      await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", userId);

      // Realtime
      channel = supabase
        .channel(`dm-${[user.id, userId].sort().join("-")}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          async (payload) => {
            const isRelevant =
              (payload.new.sender_id === user.id &&
                payload.new.receiver_id === userId) ||
              (payload.new.sender_id === userId &&
                payload.new.receiver_id === user.id);
            if (!isRelevant) return;

            const { data: sender } = await supabase
              .from("profiles")
              .select("username,avatar_url")
              .eq("id", payload.new.sender_id)
              .single();

            const newMsg: DirectMessage = {
              ...(payload.new as any),
              sender_username: sender?.username || "",
              sender_avatar: sender?.avatar_url || "",
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (newMsg.sender_id !== user.id) playNotificationSound();
            setTimeout(scrollToBottom, 50);
          }
        )
        .subscribe();
    };

    init();
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [userId, scrollToBottom, fetchMessages]);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(
        () => setRecordingDuration((d) => d + 1),
        1000
      );
    } catch {
      alert("Izin mikrofon ditolak.");
    }
  }

  async function stopAndSendRecording() {
    if (!recordingRef.current || !currentUser || !otherUser) return;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const duration = recordingDuration;
    setIsRecording(false);
    setIsSendingAudio(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No recording URI");

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const fileName = `${currentUser.id}/${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from("voice-messages")
        .upload(fileName, arrayBuffer, {
          contentType: "audio/m4a",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("voice-messages")
        .getPublicUrl(fileName);

      await supabase.from("direct_messages").insert({
        content: "🎤 Pesan suara",
        type: "audio",
        audio_url: urlData.publicUrl,
        audio_duration: duration,
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
      });
    } catch {
      alert("Gagal mengirim pesan suara. Coba lagi.");
    } finally {
      setIsSendingAudio(false);
    }
  }

  function cancelRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }

  async function handleSend() {
    if (!input.trim() || !currentUser || !otherUser) return;
    const content = input.trim();
    setInput("");
    await supabase.from("direct_messages").insert({
      content,
      type: "text",
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
    });
  }

  if (!currentUser || !otherUser) {
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
        <Text style={{ color: t.loaderText, marginTop: 12 }}>memuat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.pageBg }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: t.headerBg,
            borderBottomWidth: 1,
            borderBottomColor: t.headerBorder,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: t.headerBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={16} color={isDark ? "#e2e8f0" : "#111827"} />
          </TouchableOpacity>
          <Avatar
            username={otherUser.username}
            avatar_url={otherUser.avatar_url}
            size={34}
            isDark={isDark}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: "600",
                fontSize: 14,
                color: isDark ? "#e2e8f0" : "#111827",
              }}
            >
              {otherUser.username}
            </Text>
            <Text style={{ fontSize: 11, color: t.subText }}>
              Pesan Pribadi
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            gap: 8,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.4,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 32 }}>💬</Text>
              <Text style={{ fontSize: 13, color: t.subText }}>
                Belum ada pesan. Mulai percakapan!
              </Text>
            </View>
          }
          style={{ backgroundColor: t.msgAreaBg }}
          renderItem={({ item: msg }) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <View
                style={{
                  flexDirection: isMe ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {!isMe && (
                  <Avatar
                    username={msg.sender_username}
                    avatar_url={msg.sender_avatar}
                    size={28}
                    isDark={isDark}
                  />
                )}
                <View
                  style={{
                    maxWidth: "70%",
                    padding: 10,
                    paddingHorizontal: 14,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    borderBottomLeftRadius: isMe ? 18 : 4,
                    borderBottomRightRadius: isMe ? 4 : 18,
                    backgroundColor: isMe
                      ? "#7c3aed"
                      : isDark
                        ? "#1e1e2e"
                        : "#f3f4f6",
                  }}
                >
                  {msg.type === "audio" && msg.audio_url ? (
                    <VoiceMessagePlayer
                      url={msg.audio_url}
                      duration={msg.audio_duration}
                      isMe={isMe}
                      isDark={isDark}
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 14,
                        lineHeight: 21,
                        color: isMe
                          ? "#fff"
                          : isDark
                            ? "#e2e8f0"
                            : "#111827",
                      }}
                    >
                      {msg.content}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontSize: 10,
                      opacity: 0.6,
                      marginTop: 4,
                      textAlign: isMe ? "right" : "left",
                      color: isMe
                        ? "#fff"
                        : isDark
                          ? "#e2e8f0"
                          : "#111827",
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                {isMe && (
                  <Avatar
                    username={currentUser.username}
                    avatar_url={currentUser.avatar_url}
                    size={28}
                    isDark={isDark}
                  />
                )}
              </View>
            );
          }}
        />

        {/* Input */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: t.headerBg,
            borderTopWidth: 1,
            borderTopColor: t.headerBorder,
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          {isRecording ? (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#ef4444",
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#e2e8f0" : "#111827",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDuration(recordingDuration)}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Merekam...
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={cancelRecording}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: t.headerBorder,
                  backgroundColor: isDark ? "#1e1e2e" : "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={`Pesan ke ${otherUser.username}...`}
              placeholderTextColor={isDark ? "#555" : "#aaa"}
              multiline
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: t.headerBorder,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                backgroundColor: t.msgAreaBg,
                color: isDark ? "#e2e8f0" : "#111827",
                minHeight: 42,
                maxHeight: 120,
                lineHeight: 21,
              }}
            />
          )}

          {!input.trim() && !isSendingAudio && (
            <TouchableOpacity
              onPress={isRecording ? stopAndSendRecording : startRecording}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: isRecording
                  ? "#ef4444"
                  : isDark
                    ? "#1e1e2e"
                    : "#f3f4f6",
                borderWidth: 1,
                borderColor: isRecording ? "#ef4444" : t.headerBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isRecording ? (
                <StopCircle size={16} color="#fff" />
              ) : (
                <Mic
                  size={16}
                  color={isDark ? "#8b5cf6" : "#7c3aed"}
                />
              )}
            </TouchableOpacity>
          )}

          {(input.trim() || isSendingAudio) && (
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || isSendingAudio}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: input.trim()
                  ? "#7c3aed"
                  : isDark
                    ? "#2d2d3d"
                    : "#e5e7eb",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isSendingAudio ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send
                  size={16}
                  color={
                    input.trim()
                      ? "#fff"
                      : isDark
                        ? "#4b5563"
                        : "#9ca3af"
                  }
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
