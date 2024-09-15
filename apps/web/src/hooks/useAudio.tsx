import { useEffect, useRef } from "react";

interface UseAudioReturn {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export function useAudio(soundFile: string): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(soundFile);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [soundFile]);

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const play = () => {
    if (audioRef.current) {
      if (!audioRef.current.paused) {
        reset();
      }
      audioRef.current.play();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return {
    play,
    pause,
    reset,
  };
}
