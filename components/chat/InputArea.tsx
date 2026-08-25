import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Send, X, Mic, Image as ImageIcon, Paperclip } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import type { ChatTheme } from "../../lib/chatTheme";
import { formatDuration } from "../../lib/chatTheme";
import { formatFileSize } from "./FileAttachment";

export interface SelectedFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface InputAreaProps {
  input: string;
  isRecording: boolean;
  recordingDuration: number;
  isSendingAudio: boolean;
  selectedImage?: SelectedFile | null;
  isUploadingImage?: boolean;
  selectedFile?: SelectedFile | null;
  isUploadingFile?: boolean;
  isDark: boolean;
  t: ChatTheme;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onStopAndSendRecording: () => void;
  onCancelRecording: () => void;
  onSelectImage?: (file: SelectedFile) => void;
  onRemoveImage?: () => void;
  onSelectFile?: (file: SelectedFile) => void;
  onRemoveFile?: () => void;
}

export default function InputArea({
  input,
  isRecording,
  recordingDuration,
  isSendingAudio,
  selectedImage,
  isUploadingImage = false,
  selectedFile,
  isUploadingFile = false,
  isDark,
  t,
  onInputChange,
  onSend,
  onStartRecording,
  onStopAndSendRecording,
  onCancelRecording,
  onSelectImage,
  onRemoveImage,
  onSelectFile,
  onRemoveFile,
}: InputAreaProps) {
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
        if (onSelectImage) {
          onSelectImage({
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            size: asset.fileSize,
            mimeType: asset.mimeType || "image/jpeg",
          });
        }
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
        if (onSelectFile) {
          onSelectFile({
            uri: asset.uri,
            name: asset.name,
            size: asset.size,
            mimeType: asset.mimeType || "application/octet-stream",
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: t.inputAreaBg,
        borderTopWidth: 1,
        borderTopColor: t.inputAreaBorder,
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
            maxWidth: 340,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={{ width: 42, height: 42, borderRadius: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: t.inputColor,
                }}
              >
                {selectedImage.name}
              </Text>
              <Text style={{ fontSize: 10, color: isDark ? "#888899" : "#666677" }}>
                {selectedImage.size ? `${(selectedImage.size / 1024).toFixed(1)} KB` : "Siap dikirim"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRemoveImage}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
            maxWidth: 340,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: isDark ? "rgba(139,92,246,0.2)" : "rgba(124,58,237,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Paperclip size={18} color={isDark ? "#a78bfa" : "#7c3aed"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: t.inputColor,
                }}
              >
                {selectedFile.name}
              </Text>
              <Text style={{ fontSize: 10, color: isDark ? "#888899" : "#666677" }}>
                {formatFileSize(selectedFile.size)} • Siap dikirim
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRemoveFile}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color={isDark ? "#bbb" : "#555"} />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          borderRadius: 16,
          padding: 8,
          paddingLeft: 8,
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
            hasAttachment={!!selectedImage || !!selectedFile}
            isUploading={isUploadingImage || isUploadingFile}
            hasImage={!!selectedImage}
            hasFile={!!selectedFile}
            isDark={isDark}
            t={t}
            onInputChange={onInputChange}
            onSend={onSend}
            onStartRecording={onStartRecording}
            onOpenImagePicker={handlePickImage}
            onOpenFilePicker={handlePickFile}
          />
        )}
      </View>
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
  hasAttachment: boolean;
  isUploading: boolean;
  hasImage: boolean;
  hasFile: boolean;
  isDark: boolean;
  t: ChatTheme;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onOpenImagePicker: () => void;
  onOpenFilePicker: () => void;
}

function NormalMode({
  input,
  isSendingAudio,
  hasAttachment,
  isUploading,
  hasImage,
  hasFile,
  isDark,
  t,
  onInputChange,
  onSend,
  onStartRecording,
  onOpenImagePicker,
  onOpenFilePicker,
}: NormalModeProps) {
  const canSend = (input.trim().length > 0 || hasAttachment) && !isUploading;

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <TouchableOpacity
          onPress={onOpenImagePicker}
          disabled={isUploading || isSendingAudio}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: hasImage
              ? isDark
                ? "rgba(139,92,246,0.25)"
                : "rgba(124,58,237,0.15)"
              : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageIcon
            size={16}
            color={
              hasImage
                ? isDark
                  ? "#a78bfa"
                  : "#7c3aed"
                : isDark
                ? "#8a8a9a"
                : "#6b7280"
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenFilePicker}
          disabled={isUploading || isSendingAudio}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: hasFile
              ? isDark
                ? "rgba(139,92,246,0.25)"
                : "rgba(124,58,237,0.15)"
              : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paperclip
            size={16}
            color={
              hasFile
                ? isDark
                  ? "#a78bfa"
                  : "#7c3aed"
                : isDark
                ? "#8a8a9a"
                : "#6b7280"
            }
          />
        </TouchableOpacity>
      </View>

      <TextInput
        value={input}
        onChangeText={onInputChange}
        placeholder={
          hasImage
            ? "Tambah keterangan gambar..."
            : hasFile
            ? "Tambah keterangan berkas..."
            : "Ketik aja sob..."
        }
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
        disabled={isSendingAudio || hasAttachment}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: t.micBtnBg,
          borderWidth: 1,
          borderColor: t.micBtnBorder,
          alignItems: "center",
          justifyContent: "center",
          opacity: isSendingAudio || hasAttachment ? 0.5 : 1,
        }}
      >
        {isSendingAudio ? (
          <ActivityIndicator size="small" color={t.micBtnColor} />
        ) : (
          <Mic size={15} color={t.micBtnColor} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSend}
        disabled={!canSend}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: canSend
            ? t.sendBtnActiveBg
            : t.sendBtnInactiveBg,
          alignItems: "center",
          justifyContent: "center",
          opacity: canSend ? 1 : 0.4,
        }}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Send
            size={14}
            color={
              canSend ? "#fff" : isDark ? "#4b5563" : "#9ca3af"
            }
          />
        )}
      </TouchableOpacity>
    </>
  );
}
