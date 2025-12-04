import { ImageResponse } from "@vercel/og";
import { writeFile } from "fs/promises";
import { join } from "path";

async function generateOGImage() {
	console.log("⏳ Fetching fonts...");

	try {
		// Using specific versioned URLs from @fontsource via JSDelivr to guarantee raw file access
		const [serifData, monoData] = await Promise.all([
			// Libre Baskerville (Bold) - .woff format is supported by Satori
			fetch(
				"https://cdn.jsdelivr.net/npm/@fontsource/libre-baskerville@5.0.8/files/libre-baskerville-latin-700-normal.woff",
			).then((res) => {
				if (!res.ok) throw new Error("Failed to fetch Serif font");
				return res.arrayBuffer();
			}),

			// Roboto Mono (Regular)
			fetch(
				"https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@5.0.8/files/roboto-mono-latin-400-normal.woff",
			).then((res) => {
				if (!res.ok) throw new Error("Failed to fetch Mono font");
				return res.arrayBuffer();
			}),
		]);

		console.log("🎨 Rendering image...");

		const response = new ImageResponse(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#F9F9F7",
					fontFamily: '"Libre Baskerville"',
				}}
			>
				{/* Background Grid */}
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundImage:
							"linear-gradient(#E5E5E5 1px, transparent 1px), linear-gradient(90deg, #E5E5E5 1px, transparent 1px)",
						backgroundSize: "40px 40px",
						opacity: 0.4,
					}}
				/>

				{/* Card */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						padding: "60px 80px",
						border: "2px solid #1a1a1a",
						borderRadius: "12px",
						backgroundColor: "#FFFFFF",
						boxShadow: "12px 12px 0px rgba(26,26,26,1)",
					}}
				>
					{/* Icon Box */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "80px",
							height: "80px",
							backgroundColor: "#1a1a1a",
							borderRadius: "20px",
							marginBottom: "24px",
							border: "4px solid #fff",
							boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
						}}
					>
						<div
							style={{
								color: "white",
								fontSize: "50px",
								fontWeight: "bold",
								marginTop: "0px",
							}}
						>
							T
						</div>
					</div>

					{/* Title */}
					<div
						style={{
							fontSize: "84px",
							fontWeight: "bold",
							letterSpacing: "-0.04em",
							color: "#1a1a1a",
							lineHeight: 1,
							marginBottom: "16px",
						}}
					>
						Tabula
					</div>

					{/* Accent Pill */}
					<div
						style={{
							width: "60px",
							height: "6px",
							backgroundColor: "#1a1a1a",
							borderRadius: "4px",
							marginBottom: "24px",
						}}
					/>

					{/* Subtitle */}
					<div
						style={{
							fontFamily: '"Roboto Mono"',
							fontSize: "20px",
							letterSpacing: "0.15em",
							textTransform: "uppercase",
							color: "#666",
						}}
					>
						Markdown Table Editor
					</div>
				</div>
			</div>,
			{
				width: 1200,
				height: 630,
				fonts: [
					{
						name: "Libre Baskerville",
						data: serifData,
						style: "normal",
						weight: 700,
					},
					{
						name: "Roboto Mono",
						data: monoData,
						style: "normal",
						weight: 400,
					},
				],
			},
		);

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const outputPath = join(process.cwd(), "public", "og-image.png");
		await writeFile(outputPath, buffer);

		console.log(`✅ OG image generated successfully at ${outputPath}`);
	} catch (error) {
		console.error("❌ Error generating OG image:", error);
		process.exit(1);
	}
}

generateOGImage();
