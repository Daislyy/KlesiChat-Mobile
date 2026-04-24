import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  User,
  Mail,
  Image as ImageIcon,
  CheckCircle,
  Camera,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

interface UserData {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
}

interface Props {
  user: UserData;
  onUpdated?: (updated: Partial<UserData>) => void;
  isDark?: boolean;
}

export default function ProfileForm({ user, onUpdated, isDark = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(user.avatar_url || "");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  const t = {
    inputBg: isDark ? "rgba(255,255,255,0.06)" : "#f5f5f5",
    inputBorder: isDark ? "rgba(255,255,255,0.12)" : "#e5e5e5",
    textColor: isDark ? "#ffffff" : "#1a1a1a",
    labelColor: isDark ? "#ffffff" : "#333333",
    iconColor: isDark ? "#9ca3af" : "#6b7280",
    subColor: isDark ? "#6b7280" : "#9ca3af",
    btnBg: isDark ? "rgba(255,255,255,0.15)" : "#1a1a1a",
    btnBorder: isDark ? "rgba(255,255,255,0.2)" : "#333333",
    cancelBg: isDark ? "rgba(255,255,255,0.04)" : "#f5f5f5",
    cancelBorder: isDark ? "rgba(255,255,255,0.1)" : "#e5e5e5",
    dividerColor: isDark ? "rgba(255,255,255,0.08)" : "#e8e8e8",
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setPreview(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      let avatar_url = user.avatar_url || "";

      if (imageUri) {
        const ext = imageUri.split(".").pop() || "jpg";
        const filePath = `${user.id}/avatar.${ext}`;

        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, arrayBuffer, {
            upsert: true,
            contentType: `image/${ext}`,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        avatar_url = urlData.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username, avatar_url })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email,
        });
        if (emailError) throw emailError;
      }

      setSuccess(true);
      onUpdated?.({ username, avatar_url, email });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Gagal update profil: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 20 }}>
      {/* Success alert */}
      {success && (
        <View
          style={{
            backgroundColor: isDark
              ? "rgba(34,197,94,0.1)"
              : "#f0fdf4",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(34,197,94,0.3)"
              : "#bbf7d0",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle size={18} color={isDark ? "#4ade80" : "#16a34a"} />
          <Text
            style={{
              color: isDark ? "#4ade80" : "#16a34a",
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            Profil berhasil diperbarui!
          </Text>
        </View>
      )}

      {/* Error alert */}
      {error ? (
        <View
          style={{
            backgroundColor: isDark
              ? "rgba(239,68,68,0.1)"
              : "#fff5f5",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(239,68,68,0.3)"
              : "#fed7d7",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              color: isDark ? "#f87171" : "#c53030",
              fontSize: 13,
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      {/* Avatar */}
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <ImageIcon size={16} color={t.iconColor} />
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: t.labelColor }}
          >
            Foto Profil
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity onPress={handleImagePick}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: isDark
                  ? "rgba(255,255,255,0.2)"
                  : "#e0e0e0",
              }}
            >
              {preview ? (
                <Image
                  source={{ uri: preview }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "#f5f5f5",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={28} color={t.iconColor} />
                </View>
              )}
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: isDark ? "#555" : "#333",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <View>
            <TouchableOpacity
              onPress={handleImagePick}
              style={{
                backgroundColor: t.inputBg,
                borderWidth: 1,
                borderColor: t.inputBorder,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
              }}
            >
              <Text
                style={{ fontSize: 13, color: t.textColor, fontWeight: "500" }}
              >
                Pilih Foto
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: t.subColor, marginTop: 6 }}>
              JPG, PNG, atau GIF · Maks. 2MB
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: t.dividerColor }} />

      {/* Username */}
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <User size={16} color={t.iconColor} />
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: t.labelColor }}
          >
            Username
          </Text>
        </View>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Masukkan username"
          placeholderTextColor={t.subColor}
          style={{
            backgroundColor: t.inputBg,
            borderWidth: 1,
            borderColor: t.inputBorder,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: t.textColor,
            fontSize: 14,
          }}
        />
      </View>

      {/* Email */}
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Mail size={16} color={t.iconColor} />
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: t.labelColor }}
          >
            Email
          </Text>
        </View>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Masukkan email"
          placeholderTextColor={t.subColor}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: t.inputBg,
            borderWidth: 1,
            borderColor: t.inputBorder,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: t.textColor,
            fontSize: 14,
          }}
        />
      </View>

      {/* Submit */}
      <View style={{ flexDirection: "row", gap: 12, paddingTop: 4 }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: loading
              ? isDark
                ? "rgba(255,255,255,0.1)"
                : "#e5e5e5"
              : t.btnBg,
            borderWidth: 1,
            borderColor: t.btnBorder,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color={t.textColor} />
              <Text
                style={{ color: t.textColor, fontSize: 14, fontWeight: "600" }}
              >
                Menyimpan...
              </Text>
            </>
          ) : (
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              Simpan Perubahan
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
