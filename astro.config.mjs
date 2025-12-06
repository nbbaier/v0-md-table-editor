import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
<<<<<<< Updated upstream
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
	},
||||||| Stash base
	integrations: [
		react(),
		tailwind({
			applyBaseStyles: false,
		}),
	],
=======
	integrations: [react()],
>>>>>>> Stashed changes

	output: "server",
	adapter: vercel(),
});
