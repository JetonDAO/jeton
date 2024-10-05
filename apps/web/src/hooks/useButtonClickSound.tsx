import soundEffect from "@src/assets/audio/effects/button-clicked-effect.mp3";
import { useEffect } from "react";
import { useAudio } from "./useAudio";

export function useButtonClickSound() {
  const { play } = useAudio(soundEffect, "effect");

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        (event.target as HTMLElement).tagName === "A" ||
        (event.target as HTMLElement).tagName === "BUTTON"
      ) {
        play();
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [play]);
}
