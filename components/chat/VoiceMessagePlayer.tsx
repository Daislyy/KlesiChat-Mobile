import React, { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Play, Pause } from "lucide-react-native";
import { Audio } from "expo-av";
import { formatDuration } from "../../lib/chatTheme";

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  isMe: boolean;
  isDark: boolean;
}

export default function VoiceMessagePlayer({
  url,
  duration,
  isMe,
  isDark,
}: VoiceMessagePlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [realDuration, setRealDuration] = useState(duration || 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  async function togglePlay() {
    if (error) return;

    try {
      if (playing) {
        await soundRef.current?.pauseAsync();
        setPlaying(false);
      } else {
        if (!soundRef.current) {
          const { sound, status } = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          soundRef.current = sound;
          if (status.isLoaded && status.durationMillis) {
            setRealDuration(Math.round(status.durationMillis / 1000));
          }
        } else {
          await soundRef.current.playAsync();
        }
        setPlaying(true);
      }
    } catch {
      setError(true);
    }
  }

  function onPlaybackStatusUpdate(status: any) {
    if (status.isLoaded) {
      if (status.durationMillis) {
        setProgress(status.positionMillis / status.durationMillis);
        setCurrentTime(Math.floor(status.positionMillis / 1000));
      }
      if (status.didJustFinish) {
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        soundRef.current?.setPositionAsync(0);
      }
    }
    if (status.error) {
      setError(true);
    }
  }

  if (error) {
    return (
      <Text
        style={{
          fontSize: 12,
          color: isMe
            ? "rgba(255,255,255,0.6)"
            : isDark
              ? "#9ca3af"
              : "#6b7280",
        }}
      >
        ❌ Gagal memuat audio
      </Text>
    );
  }

  const accent = isMe
    ? "rgba(255,255,255,0.9)"
    : isDark
      ? "#8b5cf6"
      : "#7c3aed";
  const trackBg = isMe
    ? "rgba(255,255,255,0.25)"
    : isDark
      ? "#1f1f35"
      : "#e5e7eb";
  const fillColor = isMe
    ? "rgba(255,255,255,0.85)"
    : isDark
      ? "#8b5cf6"
      : "#7c3aed";
  const textColor = isMe
    ? "rgba(255,255,255,0.7)"
    : isDark
      ? "#9ca3af"
      : "#6b7280";

  const getBarHeight = (i: number) => {
    if (!url) return 0.3;
    const seed = (url.charCodeAt(i % url.length) || 65) + i * 7;
    return 0.25 + ((seed * 13) % 100) / 130;
  };

  const bars = Array.from({ length: 20 }, (_, i) => getBarHeight(i));
  const displayDuration = playing ? currentTime : realDuration;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, minWidth: 180 }}>
      <TouchableOpacity
        onPress={togglePlay}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isMe
            ? "rgba(255,255,255,0.15)"
            : isDark
              ? "#1f1f35"
              : "#f3f0ff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {playing ? (
          <Pause size={12} color={accent} fill={accent} />
        ) : (
          <Play size={12} color={accent} fill={accent} />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 4 }}>
        {/* Waveform bars */}
        <View style={{ height: 24, flexDirection: "row", alignItems: "center", gap: 1.5 }}>
          {bars.map((h, i) => {
            const isFilled = i / bars.length <= progress;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 1.5,
                  height: `${Math.min(100, Math.max(15, h * 80))}%`,
                  backgroundColor: isFilled ? fillColor : trackBg,
                }}
              />
            );
          })}
        </View>
        <Text
          style={{
            fontSize: 9,
            color: textColor,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatDuration(displayDuration)}
        </Text>
      </View>
    </View>
  );
}
