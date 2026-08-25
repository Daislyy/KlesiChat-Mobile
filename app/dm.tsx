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
  Image,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Mic, X, StopCircle, Image as ImageIcon, Paperclip } from "lucide-react-native";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../lib/supabase";
import { getChatTheme, formatDuration } from "../lib/chatTheme";
import { playNotificationSound } from "../lib/audioNotification";
import type { CurrentUser, DirectMessage } from "../types/chat";
import Avatar from "../components/chat/Avatar";
import VoiceMessagePlayer from "../components/chat/VoiceMessagePlayer";
import FileAttachment from "../components/chat/FileAttachment";
import MediaModal from "../components/chat/MediaModal";
import type { SelectedFile } from "../components/chat/InputArea";
import * as Haptics from "expo-haptics";
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

  const [selectedImage, setSelectedImage] = useState<SelectedFile | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedMediaModal, setSelectedMediaModal] = useState<string | null>(null);

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
    if ((!input.trim() && !selectedImage && !selectedFile) || !currentUser || !otherUser) return;
    const content = input.trim();
    setInput("");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (selectedFile) {
      setIsUploadingFile(true);
      try {
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${currentUser.id}/${Date.now()}_${cleanName}`;
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("shared-files")
          .upload(filePath, arrayBuffer, {
            contentType: selectedFile.mimeType || "application/octet-stream",
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("shared-files")
          .getPublicUrl(filePath);

        await supabase.from("direct_messages").insert({
          content: content || selectedFile.name,
          type: "file",
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.mimeType || "application/octet-stream",
          file_url: urlData.publicUrl,
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
        });

        setSelectedFile(null);
      } catch (err) {
        console.error(err);
        alert("Gagal mengunggah berkas.");
      } finally {
        setIsUploadingFile(false);
      }
    } else if (selectedImage) {
      setIsUploadingImage(true);
      try {
        const cleanName = selectedImage.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${currentUser.id}/${Date.now()}_${cleanName}`;
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("chat-media")
          .upload(filePath, arrayBuffer, {
            contentType: selectedImage.mimeType || "image/jpeg",
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("chat-media")
          .getPublicUrl(filePath);

        await supabase.from("direct_messages").insert({
          content: content || "📷 Gambar",
          type: "image",
          media_url: urlData.publicUrl,
          media_type: "image",
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
        });

        setSelectedImage(null);
      } catch (err) {
        console.error(err);
        alert("Gagal mengunggah gambar.");
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      await supabase.from("direct_messages").insert({
        content,
        type: "text",
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
      });
    }
  }

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Izin galeri diperlukan untuk memilih gambar.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 50 * 1024 * 1024) {
          alert("Ukuran berkas maksimal 50 MB.");
          return;
        }
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType || "application/octet-stream",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    <>
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.pageBg }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
          keyboardShouldPersistTaps="handled"
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
          renderItem={({ item: msg }) => (
            <AnimatedDMItem
              msg={msg}
              isMe={msg.sender_id === currentUser.id}
              currentUser={currentUser}
              isDark={isDark}
              onOpenMedia={(url) => setSelectedMediaModal(url)}
            />
          )}
        />

        {/* Input */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 8,
            paddingBottom: 10,
            backgroundColor: t.headerBg,
            borderTopWidth: 1,
            borderTopColor: t.headerBorder,
          }}
        >
          {/* Image Preview Banner */}
          {selectedImage && (
            <View
              style={{
                marginBottom: 8,
                padding: 8,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: isDark ? "rgba(40,40,48,0.9)" : "rgba(240,240,246,0.9)",
                borderWidth: 1,
                borderColor: isDark ? "#3f3f4e" : "#e2e2ec",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <Image source={{ uri: selectedImage.uri }} style={{ width: 42, height: 42, borderRadius: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: t.inputColor }}>
                    {selectedImage.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedImage(null)} style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color={isDark ? "#bbb" : "#555"} />
              </TouchableOpacity>
            </View>
          )}

          {/* File Preview Banner */}
          {selectedFile && (
            <View
              style={{
                marginBottom: 8,
                padding: 8,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: isDark ? "rgba(40,40,48,0.9)" : "rgba(240,240,246,0.9)",
                borderWidth: 1,
                borderColor: isDark ? "#3f3f4e" : "#e2e2ec",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: isDark ? "rgba(139,92,246,0.2)" : "rgba(124,58,237,0.1)", alignItems: "center", justifyContent: "center" }}>
                  <Paperclip size={18} color={isDark ? "#a78bfa" : "#7c3aed"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: t.inputColor }}>
                    {selectedFile.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)} style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color={isDark ? "#bbb" : "#555"} />
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
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
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                <Text style={{ fontSize: 13, color: isDark ? "#e2e8f0" : "#111827", fontVariant: ["tabular-nums"] }}>
                  {formatDuration(recordingDuration)}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#6b7280" }}>
                  Merekam...
                </Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={cancelRecording}
                  style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: t.headerBorder, backgroundColor: isDark ? "#1e1e2e" : "#f3f4f6", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={isUploadingImage || isSendingAudio}
                    style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: selectedImage ? (isDark ? "rgba(139,92,246,0.25)" : "rgba(124,58,237,0.15)") : "transparent", alignItems: "center", justifyContent: "center" }}
                  >
                    <ImageIcon size={16} color={selectedImage ? (isDark ? "#a78bfa" : "#7c3aed") : (isDark ? "#8a8a9a" : "#6b7280")} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePickFile}
                    disabled={isUploadingFile || isSendingAudio}
                    style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: selectedFile ? (isDark ? "rgba(139,92,246,0.25)" : "rgba(124,58,237,0.15)") : "transparent", alignItems: "center", justifyContent: "center" }}
                  >
                    <Paperclip size={16} color={selectedFile ? (isDark ? "#a78bfa" : "#7c3aed") : (isDark ? "#8a8a9a" : "#6b7280")} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  value={input}
                  onChangeText={(text) => setInput(text)}
                  placeholder={`Pesan ke ${otherUser.username}...`}
                  placeholderTextColor={isDark ? "#555" : "#aaa"}
                  multiline
                  style={{ flex: 1, borderWidth: 1, borderColor: t.headerBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: t.msgAreaBg, color: isDark ? "#e2e8f0" : "#111827", minHeight: 42, maxHeight: 120, lineHeight: 21 }}
                />

                <TouchableOpacity
                  onPress={startRecording}
                  disabled={isSendingAudio || Boolean(selectedImage || selectedFile)}
                  style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? "#1e1e2e" : "#f3f4f6", borderWidth: 1, borderColor: t.headerBorder, alignItems: "center", justifyContent: "center", opacity: (isSendingAudio || Boolean(selectedImage || selectedFile)) ? 0.5 : 1 }}
                >
                  {isSendingAudio ? (
                    <ActivityIndicator size="small" color={isDark ? "#8b5cf6" : "#7c3aed"} />
                  ) : (
                    <Mic size={16} color={isDark ? "#8b5cf6" : "#7c3aed"} />
                  )}
                </TouchableOpacity>
              </>
            )}

            {Boolean(input.trim() || isRecording || isSendingAudio || selectedImage || selectedFile) && !isRecording && (
              <TouchableOpacity
                onPress={handleSend}
                disabled={(!input.trim() && !selectedImage && !selectedFile) || isSendingAudio}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: Boolean(input.trim() || selectedImage || selectedFile) ? "#7c3aed" : isDark ? "#2d2d3d" : "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isUploadingImage || isUploadingFile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={16} color={Boolean(input.trim() || selectedImage || selectedFile) ? "#fff" : isDark ? "#4b5563" : "#9ca3af"} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>

    <MediaModal
      isOpen={!!selectedMediaModal}
      imageUrl={selectedMediaModal}
      onClose={() => setSelectedMediaModal(null)}
    />
    </>
  );
}

interface AnimatedDMItemProps {
  msg: DirectMessage;
  isMe: boolean;
  currentUser: CurrentUser;
  isDark: boolean;
  onOpenMedia: (url: string) => void;
}

function AnimatedDMItem({
  msg,
  isMe,
  currentUser,
  isDark,
  onOpenMedia,
}: AnimatedDMItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isMe ? 18 : -18)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 90,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 90,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        opacity: fadeAnim,
        transform: [
          { translateX: slideAnim },
          { scale: scaleAnim },
        ],
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
          maxWidth: "75%",
          padding: (msg.type === "audio" || msg.type === "image" || msg.type === "file") ? 6 : 10,
          paddingHorizontal: (msg.type === "audio" || msg.type === "image" || msg.type === "file") ? 6 : 14,
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
        ) : msg.type === "image" && msg.media_url ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onOpenMedia(msg.media_url || "")}
          >
            <Image
              source={{ uri: msg.media_url }}
              style={{ width: 220, height: 165, borderRadius: 12 }}
              resizeMode="cover"
            />
            {Boolean(msg.content) && msg.content.trim() !== "📷 Gambar" && (
              <Text
                style={{
                  paddingHorizontal: 6,
                  paddingBottom: 4,
                  paddingTop: 6,
                  fontSize: 13,
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
          </TouchableOpacity>
        ) : msg.type === "file" && msg.file_url ? (
          <FileAttachment
            fileName={msg.file_name || "Berkas"}
            fileSize={msg.file_size}
            fileType={msg.file_type}
            fileUrl={msg.file_url}
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
            paddingHorizontal: 8,
            paddingBottom: 2,
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
    </Animated.View>
  );
}
