import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Send, X, Mic, StopCircle } from "lucide-react-native";
import type { ChatTheme } from "../../lib/chatTheme";
import { formatDuration } from "../../lib/chatTheme";

interface InputAreaProps {
  input: string;
  isRecording: boolean;
  recordingDuration: number;
  isSendingAudio: boolean;
  isDark: boolean;
  t: ChatTheme;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onStopAndSendRecording: () => void;
  onCancelRecording: () => void;
}

export default function InputArea({
  input,
  isRecording,
  recordingDuration,
  isSendingAudio,
  isDark,
  t,
  onInputChange,
  onSend,
  onStartRecording,
  onStopAndSendRecording,
  onCancelRecording,
}: InputAreaProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: t.inputAreaBg,
        borderTopWidth: 1,
        borderTopColor: t.inputAreaBorder,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          borderRadius: 16,
          padding: 8,
          paddingLeft: 12,
          backgroundColor: t.inputWrapBg,
          borderWidth: 1,
          borderColor: isRecording ? "#ef4444" : t.inputWrapBorder,
        }}
      >
        {isRecording ? (
          <RecordingMode
            recordingDuration={recordingDuration}
            isDark={isDark}
            t={t}
            onCancel={onCancelRecording}
            onSend={onStopAndSendRecording}
          />
        ) : (
          <NormalMode
            input={input}
            isSendingAudio={isSendingAudio}
            isDark={isDark}
            t={t}
            onInputChange={onInputChange}
            onSend={onSend}
            onStartRecording={onStartRecording}
          />
        )}
      </View>

      <Text
        style={{
          fontSize: 10,
          color: t.creditColor,
          marginTop: 6,
          paddingLeft: 4,
        }}
      >
        Deslyy : Mff kalo masih banyak Bug :))))
      </Text>
    </View>
  );
}

// Recording mode
interface RecordingModeProps {
  recordingDuration: number;
  isDark: boolean;
  t: ChatTheme;
  onCancel: () => void;
  onSend: () => void;
}

function RecordingMode({
  recordingDuration,
  isDark,
  t,
  onCancel,
  onSend,
}: RecordingModeProps) {
  return (
    <>
      <TouchableOpacity
        onPress={onCancel}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={15} color={isDark ? "#6b7280" : "#9ca3af"} />
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 6,
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
            color: isDark ? "#4b5563" : "#9ca3af",
          }}
        >
          Merekam...
        </Text>
      </View>

      <TouchableOpacity
        onPress={onSend}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: t.micActiveBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Send size={14} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

// Normal mode
interface NormalModeProps {
  input: string;
  isSendingAudio: boolean;
  isDark: boolean;
  t: ChatTheme;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
}

function NormalMode({
  input,
  isSendingAudio,
  isDark,
  t,
  onInputChange,
  onSend,
  onStartRecording,
}: NormalModeProps) {
  return (
    <>
      <TextInput
        value={input}
        onChangeText={onInputChange}
        placeholder="Ketik aja sob..."
        placeholderTextColor={t.inputPlaceholder}
        multiline
        style={{
          flex: 1,
          color: t.inputColor,
          fontSize: 13,
          paddingVertical: 6,
          maxHeight: 120,
          lineHeight: 21,
        }}
      />

      <TouchableOpacity
        onPress={onStartRecording}
        disabled={isSendingAudio}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: t.micBtnBg,
          borderWidth: 1,
          borderColor: t.micBtnBorder,
          alignItems: "center",
          justifyContent: "center",
          opacity: isSendingAudio ? 0.5 : 1,
        }}
      >
        <Mic size={15} color={t.micBtnColor} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSend}
        disabled={!input.trim()}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: input.trim()
            ? t.sendBtnActiveBg
            : t.sendBtnInactiveBg,
          alignItems: "center",
          justifyContent: "center",
          opacity: input.trim() ? 1 : 0.4,
        }}
      >
        <Send
          size={14}
          color={
            input.trim() ? "#fff" : isDark ? "#4b5563" : "#9ca3af"
          }
        />
      </TouchableOpacity>
    </>
  );
}
