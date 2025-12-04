import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
	title: "Markdown Table Editor",
	description:
		"A visual editor for markdown tables with real-time preview and formatting support",
	generator: "v0.app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="font-sans antialiased">
				{children}
				<Toaster />
				<Analytics />
			</body>
		</html>
	);
}
