import jazzLoungeSoundtrack from "@src/assets/audio/soundtracks/jazz-lounge.mp3";
import MusicIcon from "@src/assets/icons/music-note.svg";
import SoundIcon from "@src/assets/icons/sound.svg";
import { useAudio } from "@src/hooks/useAudio";
import { useButtonClickSound } from "@src/hooks/useButtonClickSound";
import Image from "next/image";
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
    <div className="absolute top-5 right-5 text-white flex gap-5 animate-grow-in delay-1000">
      <div
        className={`cursor-pointer transition-transform duration-300 ${
          effectEnabled ? "opacity-100 scale-100" : "opacity-50 scale-75"
        }`}
        onClick={() => handleToggle("effect", !effectEnabled)}
      >
        <Image
          src={SoundIcon}
          alt="Effect Sound Toggle"
          width={60}
          height={60}
          className={`transition-all duration-300 ${effectEnabled ? "" : "grayscale"}`}
        />
      </div>

      <div
        className={`cursor-pointer transition-transform duration-300 ${
          soundtrackEnabled ? "opacity-100 scale-100" : "opacity-50 scale-75"
        }`}
        onClick={() => handleToggle("soundtrack", !soundtrackEnabled)}
      >
        <Image
          src={MusicIcon}
          alt="Soundtrack Toggle"
          width={60}
          height={60}
          className={`transition-all duration-300 ${soundtrackEnabled ? "" : "grayscale"}`}
        />
      </div>
    </div>
  );
};

export default AudioSettings;
