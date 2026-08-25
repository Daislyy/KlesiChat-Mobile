import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { User, Mail, Shield, Calendar } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { getChatTheme } from "../../lib/chatTheme";
import ProfileForm from "../../components/ProfileForm";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserData {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  role: string;
  created_at: string;
}

function withCacheBuster(url: string) {
  if (!url) return "";
  return `${url}?t=${Date.now()}`;
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState("");
  const [isDark, setIsDark] = useState(false);

  const t = getChatTheme(isDark);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const avatar = profile?.avatar_url || "";
      setAvatarSrc(withCacheBuster(avatar));

      setUserData({
        id: user.id,
        username: profile?.username || "",
        email: user.email || "",
        avatar_url: avatar,
        role: profile?.role || "user",
        created_at: profile?.created_at || user.created_at,
      });
      setLoading(false);
    };
    load();
  }, []);

  const handleUpdated = (updated: Partial<UserData>) => {
    setUserData((prev) => (prev ? { ...prev, ...updated } : prev));
    if (updated.avatar_url) {
      setAvatarSrc(withCacheBuster(updated.avatar_url));
    }
  };

  if (loading) {
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
        <Text style={{ color: t.loaderText, marginTop: 12 }}>Memuat...</Text>
      </View>
    );
  }

  if (!userData) return null;

  const joinDate = new Date(userData.created_at).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.pageBg }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: t.appTitle,
            marginBottom: 4,
          }}
        >
          Profil Saya
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: t.subText,
            marginBottom: 24,
          }}
        >
          Kelola informasi profil kamu
        </Text>

        {/* Profile Card */}
        <View
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "#f9f9f9",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "#e8e8e8",
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {/* Avatar */}
          <View style={{ marginBottom: 16, position: "relative" }}>
            {avatarSrc ? (
              <Image
                source={{ uri: avatarSrc }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  borderWidth: 3,
                  borderColor: isDark ? "#555" : "#e0e0e0",
                }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: isDark ? "#444" : "#e0e0e0",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: isDark ? "#555" : "#ccc",
                }}
              >
                <User size={40} color={isDark ? "#999" : "#888"} />
              </View>
            )}
            <View
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#6fcf97",
                borderWidth: 3,
                borderColor: t.pageBg,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: t.appTitle,
              marginBottom: 4,
            }}
          >
            {userData.username}
          </Text>
          <Text
            style={{ fontSize: 13, color: t.subText, marginBottom: 16 }}
          >
            {userData.email}
          </Text>

          {/* Role badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "#f0f0f0",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.15)"
                : "#e0e0e0",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
              marginBottom: 20,
            }}
          >
            <Shield size={14} color={isDark ? "#ccc" : "#666"} />
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#ccc" : "#666",
                textTransform: "capitalize",
              }}
            >
              {userData.role}
            </Text>
          </View>

          {/* Join date */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "#e8e8e8",
              paddingTop: 16,
              alignItems: "center",
              width: "100%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <Calendar size={14} color={t.subText} />
              <Text style={{ fontSize: 12, color: t.subText }}>
                Bergabung
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: t.appTitle,
              }}
            >
              {joinDate}
            </Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          {[
            {
              icon: <User size={18} color={isDark ? "#ccc" : "#666"} />,
              label: "Username",
              value: userData.username,
            },
            {
              icon: <Mail size={18} color={isDark ? "#ccc" : "#666"} />,
              label: "Email",
              value: userData.email,
            },
          ].map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "#f9f9f9",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "#e8e8e8",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <View
                style={{
                  backgroundColor: isDark ? "#444" : "#e8e8e8",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                {item.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 11, color: t.subText }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: t.appTitle,
                  }}
                  numberOfLines={1}
                >
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Edit form */}
        <View
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "#f9f9f9",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "#e8e8e8",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: t.appTitle,
              marginBottom: 20,
            }}
          >
            Edit Profil
          </Text>
          <ProfileForm
            user={userData}
            onUpdated={handleUpdated}
            isDark={isDark}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}
