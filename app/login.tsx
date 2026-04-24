import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { MessageCircle, Eye, EyeOff, Sun, Moon } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { getChatTheme } from "../lib/chatTheme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = getChatTheme(isDark);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError("Email dan password harus diisi");
      return;
    }

    setIsLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Email atau password salah");
    } else {
      router.replace("/(tabs)");
    }

    setIsLoading(false);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.pageBg }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Theme toggle */}
          <TouchableOpacity
            onPress={() => setIsDark(!isDark)}
            style={{
              position: "absolute",
              top: 20,
              right: 24,
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: t.toggleBg,
              borderWidth: 1,
              borderColor: t.toggleBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDark ? (
              <Sun size={16} color={t.toggleIconColor} />
            ) : (
              <Moon size={16} color={t.toggleIconColor} />
            )}
          </TouchableOpacity>

          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: t.logoGradient,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <MessageCircle size={28} color="#fff" />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: t.titleColor,
                letterSpacing: -1,
              }}
            >
              KlesiChat
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: t.subtitleColor,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Just My Personal Chat App
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: t.cardBg,
              borderWidth: 1,
              borderColor: t.cardBorder,
              borderRadius: 24,
              padding: 28,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: t.titleColor,
                marginBottom: 4,
              }}
            >
              Login
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: t.subtitleColor,
                marginBottom: 24,
              }}
            >
              Login to continue
            </Text>

            {/* Error */}
            {error ? (
              <View
                style={{
                  backgroundColor: t.errorBg,
                  borderWidth: 1,
                  borderColor: t.errorBorder,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 14 }}>⚠️</Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: t.errorColor,
                    fontWeight: "500",
                    flex: 1,
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: t.labelColor,
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="youremail@gmail.com"
                  placeholderTextColor={t.inputPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  style={{
                    backgroundColor: t.inputBg,
                    borderWidth: 1.5,
                    borderColor: t.inputBorder,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    fontSize: 14,
                    color: t.inputColor,
                    paddingRight: 44,
                  }}
                />
                <Text
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: [{ translateY: -8 }],
                    fontSize: 16,
                    opacity: 0.4,
                  }}
                >
                  ✉️
                </Text>
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: t.labelColor,
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={t.inputPlaceholder}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  style={{
                    backgroundColor: t.inputBg,
                    borderWidth: 1.5,
                    borderColor: t.inputBorder,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    fontSize: 14,
                    color: t.inputColor,
                    paddingRight: 44,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: [{ translateY: -12 }],
                    padding: 4,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} color={t.subtitleColor} />
                  ) : (
                    <Eye size={16} color={t.subtitleColor} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? t.btnLoadingBg : t.btnBg,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color={t.subtitleColor} />
                  <Text
                    style={{
                      color: t.subtitleColor,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Memproses...
                  </Text>
                </>
              ) : (
                <Text
                  style={{
                    color: t.btnColor,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  Login
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: t.dividerBg,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: t.subtitleColor,
                  marginHorizontal: 12,
                }}
              >
                atau
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: t.dividerBg,
                }}
              />
            </View>

            {/* Register link */}
            <TouchableOpacity
              onPress={() => router.push("/register")}
              style={{ alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, color: t.linkColor }}>
                Belum punya akun?{" "}
                <Text style={{ fontWeight: "700" }}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
