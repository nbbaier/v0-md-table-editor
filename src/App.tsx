import { Toaster } from "sonner";
import Footer from "@/components/footer";
import MarkdownTableEditor from "@/components/markdown-table-editor";

export default function App() {
	return (
		<div className="flex flex-col min-h-screen bg-background">
			<main className="flex-1">
				<MarkdownTableEditor />
			</main>
			<Footer />
			<Toaster
				toastOptions={{
					style: {
						borderRadius: "0rem",
					},
				}}
				richColors
				position="top-right"
			/>
		</div>
	);
}
