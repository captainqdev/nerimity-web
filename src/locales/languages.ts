import { StorageKeys, getStorageString, setStorageString } from "@/common/localStorage"

export interface Language {
  name: string,
  emoji: string,
  contributors: string[],
}

// name: Display name
// emoji: Some unicode flag emoji, idk
// contributors: array of names

export const languages = {
  "en-gb": {
    name: "British English",
    emoji: "🇬🇧",
    contributors: ["https://github.com/SupertigerDev"],
  },
  "hu-hu": {
    name: "Hungarian",
    emoji: "🇭🇺",
    contributors: ["https://github.com/andrasdaradici"],
  },
  "tr-tr": {
    name: "Turkish",
    emoji: "🇹🇷",
    contributors: ["https://github.com/sutnax"],
  },
  "nl-nl": {
    name: "Dutch",
    emoji: "🇳🇱",
    contributors: ["https://github.com/captainqdev"],
  }
}

export function getCurrentLanguage() {
  return getStorageString(StorageKeys.APP_LANGUAGE, null)?.replace("-", "_");
}
export function setCurrentLanguage(key: string) {
  return setStorageString(StorageKeys.APP_LANGUAGE, key);
}

export function getLanguage(key: string) {
  if (!(languages as any)[key.replace("_", "-")]) return undefined;
  return import(`./list/${key.replace("_", "-")}.json`);
}
