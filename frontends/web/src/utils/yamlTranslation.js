/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import i18n from "../i18n";

/**
 * Fields in YAML config that contain user-facing text and should be translated
 */
const TRANSLATABLE_FIELDS = [
  "placeholder",
  "display_name",
  "content_warning",
  "goal_message",
  "creation_samples_title",
  "preselection",
  "tag_name",
  "instruction",
];

/**
 * Creates a translation key from a text value
 * @param {string} text - The original text
 * @param {string} context - Context for the translation (e.g., 'placeholder', 'label')
 * @returns {string} Translation key
 */
const createTranslationKey = (text, context = "general") => {
  // Convert text to a safe key format
  const key = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, 50); // Limit length

  return `yamlContent:${context}.${key}`;
};

/**
 * Translates a single text value using i18n
 * @param {string} text - The text to translate
 * @param {string} context - The context/field type
 * @returns {string} Translated text or original if no translation exists
 */
const translateText = (text, context) => {
  if (!text || typeof text !== "string") return text;

  const translationKey = createTranslationKey(text, context);
  console.log(
    `Attempting to translate: "${text}" with key: "${translationKey}" for language: "${i18n.language}"`,
  );

  const translated = i18n.t(translationKey, { defaultValue: text });
  console.log(`Translation result: "${translated}"`);

  return translated;
};

/**
 * Recursively processes an object to translate text fields
 * @param {any} obj - The object to process
 * @param {string} parentKey - The parent key for context
 * @returns {any} Object with translated text
 */
const translateObjectRecursively = (obj, parentKey = "") => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      translateObjectRecursively(item, `${parentKey}[${index}]`),
    );
  }

  const translated = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (TRANSLATABLE_FIELDS.includes(key) && typeof value === "string") {
      // Translate the text field
      translated[key] = translateText(value, key);
    } else if (key === "creation_samples_title" && typeof value === "string") {
      // Map creation_samples_title to goal_message and translate it
      translated["goal_message"] = translateText(
        value,
        "creation_samples_title",
      );
      // Also keep the original key translated
      translated[key] = translateText(value, key);
    } else if (key === "labels" && Array.isArray(value)) {
      // Special handling for labels array
      translated[key] = value.map((label) =>
        typeof label === "string" ? translateText(label, "label") : label,
      );
    } else if (key === "instruction" && typeof value === "object") {
      // Special handling for instruction object
      translated[key] = {};
      for (const [instrKey, instrValue] of Object.entries(value)) {
        if (
          TRANSLATABLE_FIELDS.includes(instrKey) &&
          typeof instrValue === "string"
        ) {
          translated[key][instrKey] = translateText(instrValue, instrKey);
        } else if (typeof instrValue === "object") {
          translated[key][instrKey] = translateObjectRecursively(
            instrValue,
            `${fullKey}.${instrKey}`,
          );
        } else {
          translated[key][instrKey] = instrValue;
        }
      }
    } else if (typeof value === "object") {
      // Recursively process nested objects
      translated[key] = translateObjectRecursively(value, fullKey);
    } else {
      // Keep the value as-is
      translated[key] = value;
    }
  }

  return translated;
};

/**
 * Main function to translate YAML configuration
 * @param {object} yamlConfig - Parsed YAML configuration object
 * @returns {object} YAML configuration with translated text
 */
export const translateYamlConfig = (yamlConfig) => {
  if (!yamlConfig || typeof yamlConfig !== "object") {
    return yamlConfig;
  }

  const result = translateObjectRecursively(yamlConfig);

  return result;
};

/**
 * Generates translation keys for a YAML config (for development/extraction)
 * @param {object} yamlConfig - Parsed YAML configuration object
 * @returns {object} Object with translation keys and original text
 */
export const extractTranslationKeys = (yamlConfig) => {
  const translations = {};

  const extractFromObject = (obj, parentKey = "") => {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) =>
        extractFromObject(item, `${parentKey}[${index}]`),
      );
    } else {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        if (TRANSLATABLE_FIELDS.includes(key) && typeof value === "string") {
          const translationKey = createTranslationKey(value, key);
          translations[translationKey] = value;
        } else if (key === "labels" && Array.isArray(value)) {
          value.forEach((label) => {
            if (typeof label === "string") {
              const translationKey = createTranslationKey(label, "label");
              translations[translationKey] = label;
            }
          });
        } else if (typeof value === "object") {
          extractFromObject(value, fullKey);
        }
      }
    }
  };

  extractFromObject(yamlConfig);
  return translations;
};

/**
 * Hook to get translated YAML config
 * @param {object} yamlConfig - Original YAML config
 * @returns {object} Translated YAML config
 */
export const useTranslatedYamlConfig = (yamlConfig) => {
  const [translatedConfig, setTranslatedConfig] = React.useState(null);

  React.useEffect(() => {
    if (yamlConfig) {
      const translated = translateYamlConfig(yamlConfig);
      setTranslatedConfig(translated);
    }
  }, [yamlConfig]);

  // Also listen for language changes
  React.useEffect(() => {
    const handleLanguageChange = (lng) => {
      if (yamlConfig) {
        const translated = translateYamlConfig(yamlConfig);
        setTranslatedConfig(translated);
      }
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [yamlConfig]);

  return translatedConfig || yamlConfig;
};

export default {
  translateYamlConfig,
  extractTranslationKeys,
  useTranslatedYamlConfig,
};
