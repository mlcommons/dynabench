/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{html,js}",
  ],
  theme: {
    container: {
      // you can configure the container to be centered
      center: true,
      screens: {
        xl: "1240px",
      },
    },
    extend: {
      padding: { "fluid-video": "56.25%" },
      colors: {
        "primary-color": "#ccebd4",
        "secondary-color": "#ff6d6a",
        "third-color": "#2088ef",
        "letter-color": "#344854",
      },
    },
    fontFamily: {
      sans: ["nb_international", "Helvetica Neue", "Helvetica"],
      serif: ["Merriweather", "serif"],
    },
  },
  plugins: [
    // ...
    require("@tailwindcss/line-clamp"),
  ],
};
