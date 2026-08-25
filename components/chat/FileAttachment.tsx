import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  FileText,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  File,
  Download,
  Check,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as FSFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ActivityIndicator, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";

interface FileAttachmentProps {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl: string;
  isMe: boolean;
  isDark: boolean;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function isFileDownloadedLocally(url: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem("klesi_downloaded_files");
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(url);
  } catch {
    return false;
  }
}

async function markFileDownloadedLocally(url: string) {
  try {
    const raw = await AsyncStorage.getItem("klesi_downloaded_files");
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(url)) {
      list.push(url);
      if (list.length > 200) list.shift();
      await AsyncStorage.setItem("klesi_downloaded_files", JSON.stringify(list));
    }
  } catch (err) {
    console.error(err);
  }
}

function getFileMeta(fileName: string = "", fileType: string = "") {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const type = fileType.toLowerCase();

  if (ext === "pdf" || type.includes("pdf")) {
    return {
      icon: <FileText size={20} color="#ef4444" />,
      bg: "rgba(239, 68, 68, 0.12)",
      label: "PDF",
      badgeColor: "#ef4444",
    };
  }
  if (["doc", "docx"].includes(ext) || type.includes("word")) {
    return {
      icon: <FileText size={20} color="#3b82f6" />,
      bg: "rgba(59, 130, 246, 0.12)",
      label: "DOC",
      badgeColor: "#3b82f6",
    };
  }
  if (["xls", "xlsx", "csv"].includes(ext) || type.includes("spreadsheet") || type.includes("csv")) {
    return {
      icon: <FileSpreadsheet size={20} color="#10b981" />,
      bg: "rgba(16, 185, 129, 0.12)",
      label: "XLS",
      badgeColor: "#10b981",
    };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || type.includes("zip") || type.includes("archive")) {
    return {
      icon: <FileArchive size={20} color="#f59e0b" />,
      bg: "rgba(245, 158, 11, 0.12)",
      label: "ZIP",
      badgeColor: "#f59e0b",
    };
  }
  if (["js", "ts", "jsx", "tsx", "html", "css", "py", "json", "sql", "c", "cpp", "java"].includes(ext)) {
    return {
      icon: <FileCode size={20} color="#8b5cf6" />,
      bg: "rgba(139, 92, 246, 0.12)",
      label: ext.toUpperCase(),
      badgeColor: "#8b5cf6",
    };
  }
  if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext) || type.includes("audio")) {
    return {
      icon: <FileAudio size={20} color="#ec4899" />,
      bg: "rgba(236, 72, 153, 0.12)",
      label: "AUDIO",
      badgeColor: "#ec4899",
    };
  }
  if (["mp4", "mkv", "webm", "mov", "avi"].includes(ext) || type.includes("video")) {
    return {
      icon: <FileVideo size={20} color="#06b6d4" />,
      bg: "rgba(6, 182, 212, 0.12)",
      label: "VIDEO",
      badgeColor: "#06b6d4",
    };
  }

  return {
    icon: <File size={20} color="#8a8a9a" />,
    bg: "rgba(138, 138, 154, 0.12)",
    label: (ext || "FILE").toUpperCase().slice(0, 4),
    badgeColor: "#8a8a9a",
  };
}

export default function FileAttachment({
  fileName = "Berkas",
  fileSize,
  fileType,
  fileUrl,
  isMe,
  isDark,
}: FileAttachmentProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const meta = getFileMeta(fileName, fileType);

  useEffect(() => {
    isFileDownloadedLocally(fileUrl).then(setIsDownloaded);
  }, [fileUrl]);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const cleanName = (fileName || "berkas").replace(/[^a-zA-Z0-9._-]/g, "_");
      const targetFile = new FSFile(Paths.cache, `${Date.now()}_${cleanName}`);
      let downloadedUri = targetFile.uri;

      try {
        const res = await FSFile.downloadFileAsync(fileUrl, targetFile);
        downloadedUri = res.uri;
      } catch (errNative) {
        console.warn("FSFile.downloadFileAsync failed, fallback:", errNative);
        const legacyTarget = `${Paths.cache.uri}/${Date.now()}_${cleanName}`;
        const res = await FileSystem.downloadAsync(fileUrl, legacyTarget);
        downloadedUri = res.uri;
      }

      // Open system save/share dialog so user can save to Downloads
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadedUri, {
          dialogTitle: `Simpan "${fileName}"`,
          mimeType: fileType || "application/octet-stream",
        });
      }

      await markFileDownloadedLocally(fileUrl);
      setIsDownloaded(true);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err) {
      console.error("Error downloading file:", err);
      Alert.alert("Gagal Mengunduh", "Terjadi kesalahan saat mengunduh berkas.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: isMe
          ? isDark
            ? "rgba(0, 0, 0, 0.25)"
            : "rgba(255, 255, 255, 0.15)"
          : isDark
          ? "rgba(255, 255, 255, 0.04)"
          : "rgba(0, 0, 0, 0.03)",
        borderWidth: 1,
        borderColor: isMe
          ? "rgba(255, 255, 255, 0.15)"
          : isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.06)",
        maxWidth: 300,
        minWidth: 220,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: meta.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {meta.icon}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isMe ? "#ffffff" : isDark ? "#f0f0f0" : "#1e1e2e",
            marginBottom: 2,
          }}
        >
          {fileName}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              paddingHorizontal: 5,
              paddingVertical: 1,
              borderRadius: 4,
              backgroundColor: meta.bg,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "700", color: meta.badgeColor }}>
              {meta.label}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: isMe ? "rgba(255,255,255,0.7)" : isDark ? "#9ca3af" : "#6b7280",
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatFileSize(fileSize)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleDownload}
        disabled={isDownloading}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: isDownloaded ? 1 : 0,
          borderColor: "rgba(16, 185, 129, 0.4)",
          backgroundColor: isDownloaded
            ? isDark
              ? "rgba(16, 185, 129, 0.18)"
              : "rgba(16, 185, 129, 0.12)"
            : isMe
            ? "rgba(255, 255, 255, 0.2)"
            : isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.06)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={isMe ? "#fff" : "#7c3aed"} />
        ) : isDownloaded ? (
          <Check size={16} color="#10b981" />
        ) : (
          <Download size={16} color={isMe ? "#fff" : isDark ? "#e2e8f0" : "#111827"} />
        )}
      </TouchableOpacity>
    </View>
  );
}
