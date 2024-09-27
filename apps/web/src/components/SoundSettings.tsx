import jazzLoungeSoundtrack from "@src/assets/audio/soundtracks/jazz-lounge.mp3";
import { useAudio } from "@src/hooks/useAudio";
import { useButtonClickSound } from "@src/hooks/useButtonClickSound";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAudioGroupAllowed, setAudioGroupState } from "../utils/audio";

const AudioSettings = () => {
  const pathname = usePathname();
  const soundtrack = useAudio(jazzLoungeSoundtrack, "soundtrack");
  const [effectEnabled, setEffectEnabled] = useState(isAudioGroupAllowed("effect"));
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(isAudioGroupAllowed("soundtrack"));

  const handleToggle = (group: "effect" | "soundtrack", isEnabled: boolean) => {
    setAudioGroupState(group, isEnabled);
    if (group === "effect") setEffectEnabled(isEnabled);
    if (group === "soundtrack") setSoundtrackEnabled(isEnabled);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (soundtrackEnabled) {
      if (!soundtrack.isPlaying) {
        soundtrack.play();
      }
    } else {
      if (soundtrack.isPlaying) {
        soundtrack.pause();
      }
    }
  }, [soundtrackEnabled]);

  // Handle pathname-specific sound playing
  useEffect(() => {
    if (pathname && soundtrackEnabled && !soundtrack.isPlaying) {
      soundtrack.play();
    }
  }, [pathname, soundtrackEnabled, soundtrack]);

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="absolute top-5 right-5 text-white flex gap-5">
      <label className="flex items-center gap-1">
        Effect Sound
        <input
          type="checkbox"
          checked={effectEnabled}
          onChange={(e) => handleToggle("effect", e.target.checked)}
        />
      </label>

      <label className="flex items-center gap-1">
        Soundtrack
        <input
          type="checkbox"
          checked={soundtrackEnabled}
          onChange={(e) => handleToggle("soundtrack", e.target.checked)}
        />
      </label>
    </div>
  );
};

export default AudioSettings;
