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
import {
  MessageCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  User,
  Mail,
  Lock,
  CheckCircle2,
} from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { getChatTheme } from "../lib/chatTheme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const t = getChatTheme(isDark);

  const pwChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const pwStrength = Object.values(pwChecks).filter(Boolean).length;
  const pwBarColors = ["#ef4444", "#f97316", "#888888", "#6fcf97"];
  const pwBarColor =
    pwStrength === 0 ? (isDark ? "#3a3a3a" : "#e5e5e5") : pwBarColors[pwStrength - 1];

  async function handleSubmit() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Semua field harus diisi");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.replace("/login");
      }, 2200);
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
              zIndex: 10,
            }}
          >
            {isDark ? (
              <Sun size={16} color={t.toggleIconColor} />
            ) : (
              <Moon size={16} color={t.toggleIconColor} />
            )}
          </TouchableOpacity>

          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: t.logoGradient,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <MessageCircle size={24} color="#fff" />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: t.titleColor,
                letterSpacing: -0.5,
              }}
            >
              KlesiChat
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
                fontSize: 22,
                fontWeight: "800",
                color: t.titleColor,
                marginBottom: 4,
              }}
            >
              Register
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: t.subtitleColor,
                marginBottom: 20,
              }}
            >
              Register to continue
            </Text>

            {/* Success */}
            {success && (
              <View
                style={{
                  backgroundColor: t.successBg,
                  borderWidth: 1,
                  borderColor: t.successBorder,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle2 size={18} color={t.successColor} />
                <View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: t.successColor,
                    }}
                  >
                    Akun berhasil dibuat!
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: t.subtitleColor,
                      marginTop: 2,
                    }}
                  >
                    Mengalihkan ke halaman login...
                  </Text>
                </View>
              </View>
            )}

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

            {/* Username */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: t.labelColor,
                  marginBottom: 7,
                }}
              >
                Username
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: t.inputBg,
                  borderWidth: 1.5,
                  borderColor: t.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                }}
              >
                <User size={15} color={t.subtitleColor} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor={t.inputPlaceholder}
                  editable={!isLoading && !success}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingLeft: 10,
                    fontSize: 14,
                    color: t.inputColor,
                  }}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: t.labelColor,
                  marginBottom: 7,
                }}
              >
                Email
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: t.inputBg,
                  borderWidth: 1.5,
                  borderColor: t.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                }}
              >
                <Mail size={15} color={t.subtitleColor} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="youremail@gmail.com"
                  placeholderTextColor={t.inputPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading && !success}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingLeft: 10,
                    fontSize: 14,
                    color: t.inputColor,
                  }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: t.labelColor,
                  marginBottom: 7,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: t.inputBg,
                  borderWidth: 1.5,
                  borderColor: t.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                }}
              >
                <Lock size={15} color={t.subtitleColor} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={t.inputPlaceholder}
                  secureTextEntry={!showPassword}
                  editable={!isLoading && !success}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingLeft: 10,
                    fontSize: 14,
                    color: t.inputColor,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  {showPassword ? (
                    <EyeOff size={16} color={t.subtitleColor} />
                  ) : (
                    <Eye size={16} color={t.subtitleColor} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password strength */}
            {password.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: isDark ? "#3a3a3a" : "#e5e5e5",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: `${(pwStrength / 4) * 100}%`,
                      height: "100%",
                      borderRadius: 2,
                      backgroundColor: pwBarColor,
                    }}
                  />
                </View>
                <View style={{ gap: 4 }}>
                  {[
                    { key: "length", label: "Min. 8 karakter" },
                    { key: "upper", label: "Huruf besar (A-Z)" },
                    { key: "lower", label: "Huruf kecil (a-z)" },
                    { key: "number", label: "Angka (0-9)" },
                  ].map((item) => (
                    <View
                      key={item.key}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: pwChecks[item.key as keyof typeof pwChecks]
                            ? isDark
                              ? "#6fcf97"
                              : "#3b6d11"
                            : t.subtitleColor,
                        }}
                      >
                        {pwChecks[item.key as keyof typeof pwChecks]
                          ? "✓"
                          : "○"}{" "}
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || success}
              style={{
                backgroundColor:
                  isLoading || success ? t.btnLoadingBg : t.btnBg,
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
              ) : success ? (
                <Text
                  style={{
                    color: t.subtitleColor,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  Berhasil ✓
                </Text>
              ) : (
                <Text
                  style={{
                    color: t.btnColor,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  Register
                </Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: t.dividerBg }}
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
                style={{ flex: 1, height: 1, backgroundColor: t.dividerBg }}
              />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={{ alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, color: t.linkColor }}>
                Sudah punya akun?{" "}
                <Text style={{ fontWeight: "700" }}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
