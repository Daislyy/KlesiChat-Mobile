// Simplified theme for React Native — returns style-friendly objects

export function getChatTheme(isDark: boolean) {
  return {
    pageBg: isDark ? "#2b2b2b" : "#ffffff",
    headerBg: isDark ? "#262626" : "#ffffff",
    headerBorder: isDark ? "#3a3a3a" : "#e8e8e8",
    sidebarBg: isDark ? "#232323" : "#ffffff",
    sidebarBorder: isDark ? "#3a3a3a" : "#e8e8e8",
    channelActiveBg: isDark ? "#333333" : "#f5f5f5",
    channelActiveBorder: isDark ? "#4a4a4a" : "#e0e0e0",
    channelActiveText: isDark ? "#f0f0f0" : "#1a1a1a",
    channelBadgeBg: isDark ? "#4a4a4a" : "#1a1a1a",
    channelBadgeText: isDark ? "#e0e0e0" : "#ffffff",
    sectionLabel: isDark ? "#555555" : "#bbbbbb",
    onlineDot: "#6fcf97",
    onlineDotBorder: isDark ? "#2b2b2b" : "#ffffff",
    usernameText: isDark ? "#d0d0d0" : "#333333",
    subText: isDark ? "#666666" : "#aaaaaa",
    typingText: isDark ? "#aaaaaa" : "#666666",
    appTitle: isDark ? "#f0f0f0" : "#1a1a1a",
    navBtnColor: isDark ? "#888888" : "#777777",
    channelBarBg: isDark ? "#262626" : "#ffffff",
    channelBarBorder: isDark ? "#3a3a3a" : "#e8e8e8",
    channelNameColor: isDark ? "#777777" : "#888888",
    dividerBg: isDark ? "#3a3a3a" : "#e8e8e8",
    countColor: isDark ? "#555555" : "#bbbbbb",
    msgAreaBg: isDark ? "#2b2b2b" : "#fafafa",
    incomingMsgBg: isDark ? "#333333" : "#ffffff",
    incomingMsgBorder: isDark ? "#3f3f3f" : "#ebebeb",
    incomingMsgColor: isDark ? "#d8d8d8" : "#1a1a1a",
    outgoingMsgBg: isDark ? "#4a4a4a" : "#1a1a1a",
    outgoingMsgColor: isDark ? "#f0f0f0" : "#ffffff",
    senderNameColor: isDark ? "#aaaaaa" : "#555555",
    timestampColor: isDark ? "#555555" : "#bbbbbb",
    inputAreaBg: isDark ? "#262626" : "#ffffff",
    inputAreaBorder: isDark ? "#3a3a3a" : "#e8e8e8",
    inputWrapBg: isDark ? "#333333" : "#f5f5f5",
    inputWrapBorder: isDark ? "#3f3f3f" : "#e5e5e5",
    inputColor: isDark ? "#e0e0e0" : "#1a1a1a",
    inputPlaceholder: isDark ? "#555555" : "#aaaaaa",
    sendBtnActiveBg: isDark ? "#555555" : "#1a1a1a",
    sendBtnInactiveBg: isDark ? "#3a3a3a" : "#e5e5e5",
    editBoxBg: isDark ? "#333333" : "#ffffff",
    editBoxBorder: isDark ? "#555555" : "#cccccc",
    editTextColor: isDark ? "#e0e0e0" : "#1a1a1a",
    cancelBtnColor: isDark ? "#888888" : "#888888",
    cancelBtnBorder: isDark ? "#4a4a4a" : "#e0e0e0",
    saveBtnBg: isDark ? "#555555" : "#1a1a1a",
    typingBubbleBg: isDark ? "#333333" : "#ffffff",
    typingBubbleBorder: isDark ? "#444444" : "#ebebeb",
    logoGradient: isDark ? "#444444" : "#1a1a1a",
    profileLinkColor: isDark ? "#cccccc" : "#333333",
    viewProfileColor: isDark ? "#aaaaaa" : "#555555",
    scrollThumb: isDark ? "#444444" : "#dddddd",
    loaderBorderColor: isDark ? "#3a3a3a" : "#e5e5e5",
    loaderTopColor: isDark ? "#888888" : "#555555",
    loaderText: isDark ? "#666666" : "#aaaaaa",
    toggleBg: isDark ? "#333333" : "#f5f5f5",
    toggleBorder: isDark ? "#4a4a4a" : "#e0e0e0",
    scrollBtnBg: isDark ? "#333333" : "#ffffff",
    scrollBtnBorder: isDark ? "#4a4a4a" : "#e0e0e0",
    scrollBtnColor: isDark ? "#aaaaaa" : "#555555",
    badgeBg: isDark ? "#555555" : "#1a1a1a",
    micBtnBg: isDark ? "#333333" : "#f5f5f5",
    micBtnBorder: isDark ? "#4a4a4a" : "#e0e0e0",
    micBtnColor: isDark ? "#aaaaaa" : "#555555",
    micActiveBg: isDark ? "#7f1d1d" : "#dc2626",
    creditColor: isDark ? "#3a3a3a" : "#eeeeee",
    // Auth theme
    cardBg: isDark ? "#262626" : "#ffffff",
    cardBorder: isDark ? "#3a3a3a" : "#e8e8e8",
    titleColor: isDark ? "#f0f0f0" : "#1a1a1a",
    subtitleColor: isDark ? "#666666" : "#aaaaaa",
    labelColor: isDark ? "#888888" : "#555555",
    inputBg: isDark ? "#333333" : "#f5f5f5",
    inputBorder: isDark ? "#3f3f3f" : "#e5e5e5",
    inputBorderFocus: isDark ? "#888888" : "#888888",
    btnBg: isDark ? "#555555" : "#1a1a1a",
    btnColor: "#ffffff",
    btnLoadingBg: isDark ? "#3a3a3a" : "#e5e5e5",
    linkColor: isDark ? "#bbbbbb" : "#333333",
    errorBg: isDark ? "rgba(239,68,68,0.08)" : "#fff5f5",
    errorBorder: isDark ? "rgba(239,68,68,0.2)" : "#fed7d7",
    errorColor: isDark ? "#f87171" : "#c53030",
    successBg: isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4",
    successBorder: isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0",
    successColor: isDark ? "#4ade80" : "#16a34a",
    toggleIconColor: isDark ? "#fbbf24" : "#555555",
  };
}

export type ChatTheme = ReturnType<typeof getChatTheme>;

// Avatar color palettes
const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#f0f0f0", text: "#333333" },
  B: { bg: "#e8e8e8", text: "#2a2a2a" },
  C: { bg: "#f5f5f5", text: "#3a3a3a" },
  D: { bg: "#ebebeb", text: "#2e2e2e" },
  E: { bg: "#f2f2f2", text: "#303030" },
  F: { bg: "#e5e5e5", text: "#282828" },
  G: { bg: "#f0f0f0", text: "#353535" },
  H: { bg: "#eeeeee", text: "#2c2c2c" },
  I: { bg: "#f5f5f5", text: "#3a3a3a" },
  J: { bg: "#e8e8e8", text: "#2a2a2a" },
  K: { bg: "#f2f2f2", text: "#303030" },
  L: { bg: "#ebebeb", text: "#2e2e2e" },
  M: { bg: "#f0f0f0", text: "#333333" },
  N: { bg: "#e5e5e5", text: "#282828" },
  O: { bg: "#f5f5f5", text: "#3a3a3a" },
  P: { bg: "#eeeeee", text: "#2c2c2c" },
  Q: { bg: "#f2f2f2", text: "#303030" },
  R: { bg: "#f0f0f0", text: "#353535" },
  S: { bg: "#e8e8e8", text: "#2a2a2a" },
  T: { bg: "#ebebeb", text: "#2e2e2e" },
  U: { bg: "#f5f5f5", text: "#3a3a3a" },
  V: { bg: "#e5e5e5", text: "#282828" },
  W: { bg: "#f0f0f0", text: "#333333" },
  X: { bg: "#eeeeee", text: "#2c2c2c" },
  Y: { bg: "#f2f2f2", text: "#303030" },
  Z: { bg: "#e8e8e8", text: "#2a2a2a" },
};

const AVATAR_COLORS_DARK: Record<string, { bg: string; text: string }> = {
  A: { bg: "#3a3a3a", text: "#d0d0d0" },
  B: { bg: "#424242", text: "#e0e0e0" },
  C: { bg: "#383838", text: "#cccccc" },
  D: { bg: "#404040", text: "#d8d8d8" },
  E: { bg: "#3c3c3c", text: "#d4d4d4" },
  F: { bg: "#444444", text: "#e2e2e2" },
  G: { bg: "#3a3a3a", text: "#d0d0d0" },
  H: { bg: "#424242", text: "#e0e0e0" },
  I: { bg: "#383838", text: "#cccccc" },
  J: { bg: "#404040", text: "#d8d8d8" },
  K: { bg: "#3c3c3c", text: "#d4d4d4" },
  L: { bg: "#444444", text: "#e2e2e2" },
  M: { bg: "#3a3a3a", text: "#d0d0d0" },
  N: { bg: "#424242", text: "#e0e0e0" },
  O: { bg: "#383838", text: "#cccccc" },
  P: { bg: "#404040", text: "#d8d8d8" },
  Q: { bg: "#3c3c3c", text: "#d4d4d4" },
  R: { bg: "#444444", text: "#e2e2e2" },
  S: { bg: "#3a3a3a", text: "#d0d0d0" },
  T: { bg: "#424242", text: "#e0e0e0" },
  U: { bg: "#383838", text: "#cccccc" },
  V: { bg: "#404040", text: "#d8d8d8" },
  W: { bg: "#3c3c3c", text: "#d4d4d4" },
  X: { bg: "#444444", text: "#e2e2e2" },
  Y: { bg: "#3a3a3a", text: "#d0d0d0" },
  Z: { bg: "#424242", text: "#e0e0e0" },
};

export function getAvatarColor(username: string, isDark: boolean) {
  const key = username[0]?.toUpperCase() || "A";
  const colors = isDark ? AVATAR_COLORS_DARK : AVATAR_COLORS;
  return (
    colors[key] ||
    (isDark
      ? { bg: "#3a3a3a", text: "#d0d0d0" }
      : { bg: "#f0f0f0", text: "#333333" })
  );
}

export function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
