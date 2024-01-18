/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
export default function FooterLayout({ style, links, logo, copyright }) {
  return (
    <footer className="bg-black text-white">
      <div className="flex flex-row px-6 pt-3 gap-8 text-sm font-bold pb-8">
        <div>Copyright © 2023 MLCommons, Inc.</div>
        <div>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <Link to="/termsofuse">Terms of Use</Link>
        </div>
        <div>
          <Link to="/datapolicy">Data Policy</Link>
        </div>
      </div>
    </footer>
  );
}
