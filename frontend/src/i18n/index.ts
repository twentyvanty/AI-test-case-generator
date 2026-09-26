import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import th from "./locales/th";

export const SUPPORTED_LANGUAGES = ["en", "th"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "language";

// Remember the user's language choice between visits.
// Storage can be unavailable (e.g. private mode), so fail quietly.
function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (saved === "en" || saved === "th") {
      return saved;
    }
  } catch {
    // ignore
  }

  return "en";
}

export function changeLanguage(language: Language) {
  i18n.changeLanguage(language);

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // ignore
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      th,
    },

    lng: getSavedLanguage(),
    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

// Keep <html lang> in sync so the browser picks the right Thai/English font rendering
i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
});
document.documentElement.lang = i18n.language;

export default i18n;
