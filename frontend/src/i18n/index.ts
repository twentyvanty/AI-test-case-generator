import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import th from "./locales/th";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      th,
    },

    lng: "en",
    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;