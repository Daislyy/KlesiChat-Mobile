import { Audio } from "expo-av";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const notifAsset = require("../assets/notification.mp3");

let soundObject: Audio.Sound | null = null;

export async function playNotificationSound() {
  try {
    // Unload previous sound if still loaded to avoid memory leaks
    if (soundObject) {
      try {
        await soundObject.unloadAsync();
      } catch {}
      soundObject = null;
    }

    // Ensure audio mode allows playback (even in silent mode on iOS)
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(notifAsset, {
      volume: 0.5,
      shouldPlay: true,
    });
    soundObject = sound;

    // Auto-unload when playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (soundObject === sound) soundObject = null;
      }
    });
  } catch (e) {
    console.warn("Audio notification failed:", e);
  }
}
