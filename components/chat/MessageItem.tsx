import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Pencil, Trash2, Check } from "lucide-react-native";
import type { Message } from "../../types/chat";
import type { ChatTheme } from "../../lib/chatTheme";
import { formatTime } from "../../lib/chatTheme";
import Avatar from "./Avatar";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

interface MessageItemProps {
  msg: Message;
  isMe: boolean;
  isEditing: boolean;
  editText: string;
  isDark: boolean;
  t: ChatTheme;
  onEditStart: (id: string, content: string) => void;
  onEditChange: (text: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onDelete: (id: string) => void;
}

export default function MessageItem({
  msg,
  isMe,
  isEditing,
  editText,
  isDark,
  t,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
}: MessageItemProps) {
  const isAudio = msg.type === "audio";

  const handleLongPress = () => {
    if (!isMe) return;
    const options = isAudio
      ? [{ text: "Hapus", onPress: () => onDelete(msg.id), style: "destructive" as const }]
      : [
          { text: "Edit", onPress: () => onEditStart(msg.id, msg.content) },
          { text: "Hapus", onPress: () => onDelete(msg.id), style: "destructive" as const },
        ];
    Alert.alert("Aksi Pesan", undefined, [
      ...options,
      { text: "Batal", style: "cancel" },
    ]);
  };

  return (
    <View
      style={{
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {!isMe && (
        <Avatar
          username={msg.username}
          avatar_url={msg.avatar_url}
          size={28}
          isDark={isDark}
        />
      )}

      <View
        style={{
          maxWidth: "70%",
          alignItems: isMe ? "flex-end" : "flex-start",
        }}
      >
        {!isMe && (
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: t.senderNameColor,
              marginBottom: 4,
              marginLeft: 4,
            }}
          >
            {msg.username}
          </Text>
        )}

        {isEditing ? (
          <View
            style={{
              backgroundColor: t.editBoxBg,
              borderWidth: 1,
              borderColor: t.editBoxBorder,
              borderRadius: 16,
              padding: 12,
              minWidth: 200,
            }}
          >
            <TextInput
              autoFocus
              value={editText}
              onChangeText={onEditChange}
              onSubmitEditing={() => onEditSave(msg.id)}
              style={{
                color: t.editTextColor,
                fontSize: 13,
                minHeight: 60,
                textAlignVertical: "top",
              }}
              multiline
            />
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                onPress={onEditCancel}
                style={{
                  borderWidth: 1,
                  borderColor: t.cancelBtnBorder,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: t.cancelBtnColor }}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onEditSave(msg.id)}
                style={{
                  backgroundColor: t.saveBtnBg,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Check size={11} color="#fff" />
                <Text style={{ fontSize: 12, color: "#fff" }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onLongPress={handleLongPress}
            activeOpacity={0.8}
            style={{
              padding: isAudio ? 10 : 10,
              paddingHorizontal: isAudio ? 12 : 14,
              backgroundColor: isMe ? t.outgoingMsgBg : t.incomingMsgBg,
              borderWidth: isMe ? 0 : 1,
              borderColor: isMe ? "transparent" : t.incomingMsgBorder,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: isMe ? 18 : 4,
              borderBottomRightRadius: isMe ? 4 : 18,
            }}
          >
            {isAudio && msg.audio_url ? (
              <VoiceMessagePlayer
                url={msg.audio_url}
                duration={msg.audio_duration}
                isMe={isMe}
                isDark={isDark}
              />
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 21,
                  color: isMe ? t.outgoingMsgColor : t.incomingMsgColor,
                }}
              >
                {msg.content}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <Text
          style={{
            fontSize: 10,
            color: t.timestampColor,
            marginTop: 4,
            marginHorizontal: 4,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(msg.created_at)}
        </Text>
      </View>
    </View>
  );
}
