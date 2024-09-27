import { isAudioGroupAllowed } from "@src/utils/audio";
import { useEffect, useRef, useState } from "react";

interface UseAudioReturn {
  play: () => void;
  pause: () => void;
  reset: () => void;
  isPlaying: boolean;
}

type AudioGroup = "effect" | "soundtrack";

export function useAudio(soundFile: string, group: AudioGroup): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(soundFile);

    // Event listeners to update isPlaying state
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.addEventListener("play", onPlay);
      audioRef.current.addEventListener("pause", onPause);
      audioRef.current.addEventListener("ended", onEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("play", onPlay);
        audioRef.current.removeEventListener("pause", onPause);
        audioRef.current.removeEventListener("ended", onEnded);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [soundFile]);

  const play = async () => {
    // Check if the group is allowed to play audio
    if (!isAudioGroupAllowed(group)) {
      console.log(`Audio group "${group}" is disabled, skipping play.`);
      return; // Do not play if the group is disabled
    }

    if (audioRef.current) {
      // Ensure no pause happens while play is being requested
      try {
        if (audioRef.current.paused) {
          reset();
          await audioRef.current.play();
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error during play()", err);
        }
      }
    }
  };

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const pause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  };

  return {
    play,
    pause,
    reset,
    isPlaying, // Return isPlaying state
  };
}
