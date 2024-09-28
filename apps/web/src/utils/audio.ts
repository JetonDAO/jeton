type AudioGroup = "effect" | "soundtrack";

interface AudioGroupSettings {
  [key: string]: boolean;
}

export const getAudioGroupSettings = (): AudioGroupSettings => {
  const settings = JSON.parse(localStorage?.getItem("audioGroupSettings") || "{}");
  return settings;
};

export const setAudioGroupState = (group: AudioGroup, state: boolean): void => {
  const settings = getAudioGroupSettings();
  settings[group] = state;
  localStorage?.setItem("audioGroupSettings", JSON.stringify(settings));
};

export const isAudioGroupAllowed = (group: AudioGroup): boolean => {
  const settings = getAudioGroupSettings();
  return settings[group] ?? true;
};
