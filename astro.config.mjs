// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import alpinejs from "@astrojs/alpinejs";

import cloudflare from "@astrojs/cloudflare";
import remarkImagePathFix from "./remark-image-path-fix.js";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://maisonvictoire.mimecom.net",
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkImagePathFix],
  },
  integrations: [alpinejs({ entrypoint: "/src/alpine-entry.ts" }), icon(
    {
      include: {
        'material-symbols-light': ['arrow-back-ios-rounded','arrow-forward-ios-rounded','close-rounded','menu'],
      }
    }
  )],
  adapter: cloudflare(),
});
