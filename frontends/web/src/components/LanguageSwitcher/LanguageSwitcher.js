/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "react-bootstrap";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <Dropdown className="my-auto mr-2">
      <Dropdown.Toggle
        variant="light"
        id="language-dropdown"
        className="d-flex align-items-center border-0"
        style={{
          background: "transparent",
          boxShadow: "none",
          outline: "none",
        }}
      >
        <span className="me-2">{currentLanguage.flag}</span>
        <span className="d-none d-md-inline">{currentLanguage.name}</span>
        &nbsp;
      </Dropdown.Toggle>

      <Dropdown.Menu className="my-2 py-1">
        {languages.map((language) => (
          <Dropdown.Item
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={i18n.language === language.code ? "active" : ""}
          >
            <span className="me-2">{language.flag}</span>
            {language.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
