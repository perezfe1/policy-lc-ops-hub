import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        yale: {
          blue: "#00356b",
          darkblue: "#002147",
          accent: "#286dc0",
          light: "#63aaff",
          gray: "#4a4a4a",
          bg: "#f9fafb",
          card: "#ffffff",
          border: "#e5e7eb",
          muted: "#6b7280",
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
        display: ['"Libre Franklin"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
