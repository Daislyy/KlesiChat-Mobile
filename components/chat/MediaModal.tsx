import React, { useState } from "react";
import { Modal, View, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { X, Download, Check } from "lucide-react-native";
import { File as FSFile, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";

interface MediaModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function MediaModal({
  isOpen,
  imageUrl,
  onClose,
}: MediaModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const filename = `klesichat_${Date.now()}.jpg`;
      const targetFile = new FSFile(Paths.document, filename);
      let localUri = targetFile.uri;

      try {
        const res = await FSFile.downloadFileAsync(imageUrl, targetFile);
        localUri = res.uri;
      } catch (errNative) {
        console.warn("FSFile.downloadFileAsync failed, fallback to FileSystem.downloadAsync:", errNative);
        const legacyTarget = `${Paths.document.uri}/${filename}`;
        const res = await FileSystem.downloadAsync(imageUrl, legacyTarget);
        localUri = res.uri;
      }

      // Save directly to Phone Gallery / Photos album
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          await MediaLibrary.saveToLibraryAsync(localUri);
        }
      } catch (libErr) {
        console.warn("MediaLibrary save error:", libErr);
      }

      setDownloaded(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert("Unduhan Selesai", "Gambar berhasil diunduh dan disimpan ke Galeri HP.");
    } catch (err) {
      console.error("Failed to download image:", err);
      Alert.alert("Gagal Mengunduh", "Terjadi kesalahan saat mengunduh gambar.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleDownload}
            disabled={downloading}
            style={[
              styles.btn,
              downloaded && { backgroundColor: "rgba(16, 185, 129, 0.25)" },
            ]}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : downloaded ? (
              <Check size={18} color="#10b981" />
            ) : (
              <Download size={18} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.btn}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    gap: 12,
    zIndex: 10,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "80%",
  },
});
