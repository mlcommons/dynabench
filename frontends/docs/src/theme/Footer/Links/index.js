/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { isMultiColumnFooterLinks } from "@docusaurus/theme-common";
import FooterLinksMultiColumn from "@theme/Footer/Links/MultiColumn";
import FooterLinksSimple from "@theme/Footer/Links/Simple";
export default function FooterLinks({ links }) {
  return isMultiColumnFooterLinks(links) ? (
    <FooterLinksMultiColumn columns={links} />
  ) : (
    <FooterLinksSimple links={links} />
  );
}
