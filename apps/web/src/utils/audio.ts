type AudioGroup = "effect" | "soundtrack";

interface AudioGroupSettings {
  [key: string]: boolean;
}

const isLocalStorageAvailable = (): boolean => {
  try {
    return typeof localStorage !== "undefined";
  } catch (error) {
    return false;
  }
};

export const getAudioGroupSettings = (): AudioGroupSettings => {
  if (!isLocalStorageAvailable()) {
    return {};
  }
  const settings = JSON.parse(localStorage.getItem("audioGroupSettings") || "{}");
  return settings;
};

export const setAudioGroupState = (group: AudioGroup, state: boolean): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }
  const settings = getAudioGroupSettings();
  settings[group] = state;
  localStorage.setItem("audioGroupSettings", JSON.stringify(settings));
};

export const isAudioGroupAllowed = (group: AudioGroup): boolean => {
  const settings = getAudioGroupSettings();
  return settings[group] ?? true;
};
