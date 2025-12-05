import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import simpleHtmlPlugin from "vite-plugin-simple-html";

const metadata = {
	title: "Tabula | Markdown Table Editor",
	description:
		"A visual interface for Markdown tables. Edit rows and columns with keyboard shortcuts, import from CSV, and export clean syntax",
	ogImage: "https://tabula-editor.vercel.app/og-image.png",
	siteUrl: "https://tabula-editor.vercel.app",
};

export default defineConfig({
	plugins: [
		react(),
		simpleHtmlPlugin({
			inject: {
				data: {
					title: metadata.title,
				},
				tags: [
					{
						tag: "meta",
						attrs: {
							name: "description",
							content: metadata.description,
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "og:image",
							content: metadata.ogImage,
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "og:image:width",
							content: "1200",
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "og:image:height",
							content: "630",
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "og:title",
							content: metadata.title,
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "og:description",
							content: metadata.description,
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "og:url",
							content: metadata.siteUrl,
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "og:type",
							content: "website",
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "twitter:card",
							content: "summary",
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "twitter:site",
							content: "@nbbaier",
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "twitter:title",
							content: metadata.title,
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "twitter:image",
							content: metadata.ogImage,
						},
					},
					{
						tag: "meta",
						attrs: {
							name: "twitter:description",
							content: metadata.description,
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
