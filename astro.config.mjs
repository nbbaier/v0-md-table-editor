import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  integrations: [
      react(),
      tailwind({
          applyBaseStyles: false,
      }),
	],

  output: "server",
  adapter: vercel(),
});