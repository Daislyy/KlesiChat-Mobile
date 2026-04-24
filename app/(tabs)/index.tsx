import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LogOut, MessageCircle, Hash, ArrowDown } from "lucide-react-native";
import { Audio } from "expo-av";
import { supabase } from "../../lib/supabase";
import { getChatTheme } from "../../lib/chatTheme";
import { playNotificationSound } from "../../lib/audioNotification";
import type { Message, TypingUser, OnlineUser, CurrentUser } from "../../types/chat";
import Avatar from "../../components/chat/Avatar";
import MessageItem from "../../components/chat/MessageItem";
import TypingIndicator from "../../components/chat/TypingIndicator";
import InputArea from "../../components/chat/InputArea";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const prevMsgCountRef = useRef(0);

  const t = getChatTheme(isDark);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: msgs } = await supabase
        .from("messages")
        .select(
          "id,content,type,audio_url,audio_duration,user_id,created_at,profiles(username,avatar_url)"
        )
        .order("created_at", { ascending: true });
      if (msgs) {
        setMessages(
          msgs.map((m: any) => ({
            id: m.id,
            content: m.content,
            type: m.type || "text",
            audio_url: m.audio_url || undefined,
            audio_duration: m.audio_duration || undefined,
            user_id: m.user_id,
            created_at: m.created_at,
            username: m.profiles?.username || "unknown",
            avatar_url: m.profiles?.avatar_url || "",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (typingChannelRef.current && currentUser) {
        try {
          await typingChannelRef.current.untrack();
          await supabase.removeChannel(typingChannelRef.current);
        } catch {}
      }
      await supabase.auth.signOut();
      router.replace("/login");
    } catch {
      setIsLoggingOut(false);
    }
  }, [currentUser, isLoggingOut]);

  useEffect(() => {
    let msgChannel: ReturnType<typeof supabase.channel>;
    let typingChannel: ReturnType<typeof supabase.channel>;
    let autoRefreshInterval: ReturnType<typeof setInterval>;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

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

      await fetchMessages();
      setTimeout(scrollToBottom, 200);
      autoRefreshInterval = setInterval(fetchMessages, 2000);

      msgChannel = supabase
        .channel("public:messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          async (payload) => {
            const { data: p } = await supabase
              .from("profiles")
              .select("username,avatar_url")
              .eq("id", payload.new.user_id)
              .single();
            const newMsg: Message = {
              ...(payload.new as any),
              type: payload.new.type || "text",
              username: p?.username || "unknown",
              avatar_url: p?.avatar_url || "",
            };
            if (newMsg.user_id !== me.id) playNotificationSound();
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages" },
          (payload) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id
                  ? { ...m, content: payload.new.content }
                  : m
              )
            );
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "messages" },
          (payload) => {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        )
        .subscribe();

      typingChannel = supabase.channel("typing-room", {
        config: { presence: { key: user.id } },
      });
      typingChannelRef.current = typingChannel;

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
    };

    init();
    return () => {
      if (msgChannel) supabase.removeChannel(msgChannel);
      if (typingChannel) supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    };
  }, [fetchMessages, scrollToBottom]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const newCount = messages.length;
    const oldCount = prevMsgCountRef.current;
    prevMsgCountRef.current = newCount;
    if (newCount > oldCount && isNearBottom) {
      setTimeout(scrollToBottom, 100);
    }
    if (newCount > oldCount && !isNearBottom) {
      setUnreadCount((prev) => prev + (newCount - oldCount));
    }
  }, [messages.length, isNearBottom, scrollToBottom]);

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
    if (!recordingRef.current || !currentUser) return;
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

      await supabase.from("messages").insert({
        content: "🎤 Pesan suara",
        type: "audio",
        audio_url: urlData.publicUrl,
        audio_duration: duration,
        user_id: currentUser.id,
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
    if (!input.trim() || !currentUser) return;
    const content = input.trim();
    setInput("");
    setIsNearBottom(true);
    setUnreadCount(0);
    await supabase
      .from("messages")
      .insert({ content, type: "text", user_id: currentUser.id });
  }

  async function handleDelete(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("messages").delete().eq("id", id);
  }

  async function handleEditSave(id: string) {
    if (!editText.trim()) return;
    const newContent = editText.trim();
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: newContent } : m))
    );
    setEditingId(null);
    setEditText("");
    await supabase.from("messages").update({ content: newContent }).eq("id", id);
  }

  async function handleTyping() {
    if (!currentUser || !typingChannelRef.current) return;
    await typingChannelRef.current.track({
      username: currentUser.username,
      avatar_url: currentUser.avatar_url,
      isTyping: true,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      if (!typingChannelRef.current || !currentUser) return;
      await typingChannelRef.current.track({
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        isTyping: false,
      });
    }, 2000);
  }

  function handleInputChange(text: string) {
    setInput(text);
    if (text.trim()) handleTyping();
  }

  const typingLabel =
    typingUsers.length === 1
      ? `${typingUsers[0].username} sedang mengetik`
      : typingUsers.length > 1
        ? `${typingUsers.map((tv) => tv.username).join(", ")} sedang mengetik`
        : "";

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
        <Text
          style={{
            fontSize: 12,
            color: t.loaderText,
            marginTop: 16,
            letterSpacing: 1,
          }}
        >
          memuat...
        </Text>
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
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: t.headerBg,
            borderBottomWidth: 1,
            borderBottomColor: t.headerBorder,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: t.logoGradient,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle size={16} color="#fff" />
            </View>
            <Text
              style={{
                fontWeight: "700",
                fontSize: 17,
                color: t.appTitle,
                letterSpacing: -0.5,
              }}
            >
              KlesiChat
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              onPress={handleLogout}
              disabled={isLoggingOut}
              style={{
                borderRadius: 10,
                padding: 8,
                opacity: isLoggingOut ? 0.5 : 1,
              }}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={t.navBtnColor} />
              ) : (
                <LogOut size={18} color={t.navBtnColor} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Channel bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: t.channelBarBg,
            borderBottomWidth: 1,
            borderBottomColor: t.channelBarBorder,
          }}
        >
          <Hash size={14} color={isDark ? "#4b5563" : "#9ca3af"} />
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: t.channelNameColor }}
          >
            chat-room
          </Text>
          <View
            style={{ width: 1, height: 14, backgroundColor: t.dividerBg }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: t.onlineDot,
              }}
            />
            <Text style={{ fontSize: 12, color: t.countColor }}>
              {onlineUsers.length} online
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: t.countColor,
              marginLeft: "auto",
            }}
          >
            {messages.length} pesan
          </Text>
        </View>

        {/* Messages */}
        <View style={{ flex: 1, backgroundColor: t.msgAreaBg }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            onScrollEndDrag={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const near =
                contentSize.height - contentOffset.y - layoutMeasurement.height < 120;
              setIsNearBottom(near);
              if (near) setUnreadCount(0);
            }}
            ListFooterComponent={
              <>
                <TypingIndicator
                  typingUsers={typingUsers}
                  typingLabel={typingLabel}
                  isDark={isDark}
                  t={t}
                />
              </>
            }
            renderItem={({ item: msg }) => (
              <MessageItem
                msg={msg}
                isMe={msg.user_id === currentUser.id}
                isEditing={editingId === msg.id}
                editText={editText}
                isDark={isDark}
                t={t}
                onEditStart={(id, content) => {
                  setEditingId(id);
                  setEditText(content);
                }}
                onEditChange={setEditText}
                onEditSave={handleEditSave}
                onEditCancel={() => {
                  setEditingId(null);
                  setEditText("");
                }}
                onDelete={handleDelete}
              />
            )}
          />

          {/* Scroll to bottom FAB */}
          {!isNearBottom && (
            <TouchableOpacity
              onPress={() => {
                setIsNearBottom(true);
                setUnreadCount(0);
                scrollToBottom();
              }}
              style={{
                position: "absolute",
                bottom: 16,
                right: 16,
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: t.scrollBtnBg,
                borderWidth: 1,
                borderColor: t.scrollBtnBorder,
                alignItems: "center",
                justifyContent: "center",
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    borderRadius: 10,
                    backgroundColor: t.badgeBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
              <ArrowDown size={17} color={t.scrollBtnColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Input */}
        <InputArea
          input={input}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          isSendingAudio={isSendingAudio}
          isDark={isDark}
          t={t}
          onInputChange={handleInputChange}
          onSend={handleSend}
          onStartRecording={startRecording}
          onStopAndSendRecording={stopAndSendRecording}
          onCancelRecording={cancelRecording}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
