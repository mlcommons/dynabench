/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Development utility to extract translation keys from YAML configurations
 * Run this script to generate translation JSON files from existing YAML configs
 */

import { extractTranslationKeys } from "./yamlTranslation";

const yaml = require("js-yaml");

// Example YAML configurations (these would come from your database in practice)
const sampleConfigs = [
  // Sentiment Analysis
  `
aggregation_metric:
  type: dynascore
goal:
  type: multioptions
  options:
    - negative
    - positive
    - neutral
  field_name_for_the_model: label
context:
  type: plain-text
  field_names_for_the_model:
    context: context
user_input:
  - type: text
    placeholder: Enter an statement
    field_name_for_the_model: statement
model_input:
  statement: statement
response_fields:
  input_by_user: statement
metadata:
  create:
    - display_name: example explanation
      name: example_explanation
      placeholder: Explain why your example is correct...
      type: string
    - display_name: model explanation
      model_wrong_condition: false
      name: model_explanation_right
      placeholder: Explain why you thought the model would make a mistake...
      type: string
    - display_name: model explanation
      model_wrong_condition: true
      name: model_explanation_wrong
      placeholder: Explain why you think the model made a mistake...
      type: string
`,

  // Hate Speech
  `
aggregation_metric:
  type: dynascore
content_warning: This is sensitive content! If you do not want to see any hateful examples, please switch to another task.
goal:
  type: multioptions
  options:
    - hateful
    - non-hateful
  field_name_for_the_model: label
context:
  type: plain-text
  field_names_for_the_model:
    context: context
user_input:
  - type: text
    placeholder: Enter statement
    field_name_for_the_model: statement
metadata:
  validate:
    - labels:
        - not-hateful
        - hateful
      name: corrected_label
      placeholder: Enter corrected label
      type: multiclass
      validated_label_condition: incorrect
`,

  // Language Identification (from your screenshot)
  `
goal_message: Label the text with the languages you think it is written in
user_input:
  - type: multiclass
    placeholder: Select a language
    options:
      - English
      - Spanish
      - French
      - German
      - Other
general_instructions: Please select a language you are proficient in
`,
];

/**
 * Extract and merge all translation keys from sample configurations
 */
function extractAllTranslations() {
  const allTranslations = {};

  sampleConfigs.forEach((configYaml, index) => {
    try {
      const config = yaml.load(configYaml);
      const translations = extractTranslationKeys(config);

      console.log(`\n=== Configuration ${index + 1} ===`);
      console.log("Extracted translations:");
      console.log(JSON.stringify(translations, null, 2));

      // Merge into all translations
      Object.assign(allTranslations, translations);
    } catch (error) {
      console.error(`Error processing config ${index + 1}:`, error);
    }
  });

  return allTranslations;
}

/**
 * Generate structured translation JSON suitable for i18n files
 */
function generateTranslationStructure(translations) {
  const structure = {
    placeholder: {},
    display_name: {},
    content_warning: {},
    label: {},
    goal_message: {},
    general: {},
  };

  Object.entries(translations).forEach(([key, value]) => {
    const parts = key.split(".");
    if (parts.length >= 2) {
      const category = parts[1];
      const keyName = parts.slice(2).join("_");

      if (structure[category]) {
        structure[category][keyName] = value;
      }
    }
  });

  return structure;
}

/**
 * Main function to run the extraction
 */
export function runExtractionTool() {
  console.log("🔍 Extracting YAML translations...\n");

  const allTranslations = extractAllTranslations();

  console.log("\n=== ALL EXTRACTED TRANSLATIONS ===");
  console.log(JSON.stringify(allTranslations, null, 2));

  const structuredTranslations = generateTranslationStructure(allTranslations);

  console.log("\n=== STRUCTURED FOR i18n ===");
  console.log("Copy this to your locales/en/yamlContent.json:");
  console.log(JSON.stringify(structuredTranslations, null, 2));

  return {
    raw: allTranslations,
    structured: structuredTranslations,
  };
}

// For browser console usage
if (typeof window !== "undefined") {
  window.extractYamlTranslations = runExtractionTool;
}

export default runExtractionTool;
