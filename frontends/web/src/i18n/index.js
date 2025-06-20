/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

i18n
  // load translation using http -> see /public/locales
  .use(HttpApi)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    lng: "en", // default language
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    // Available namespaces
    ns: [
      "common",
      "auth",
      "tasks",
      "models",
      "validation",
      "errors",
      "yamlContent",
      "interface",
    ],
    defaultNS: "common",
  });

export default i18n;
