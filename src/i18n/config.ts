import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../locales/en/common.json";
import esCommon from "../locales/es/common.json";

const resources = {
  en: {
    common: enCommon,
  },
  es: {
    common: esCommon,
  },
};

i18n.use(initReactI18next).init({
  resources,
  defaultNS: "common",
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
