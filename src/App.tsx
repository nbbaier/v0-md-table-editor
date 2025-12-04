import { Toaster } from "sonner";
import MarkdownTableEditor from "@/components/markdown-table-editor";

export default function App() {
	return (
		<main className="min-h-screen bg-background">
			<MarkdownTableEditor />
			<Toaster
				toastOptions={{
					style: {
						borderRadius: "0rem",
					},
				}}
				richColors
				position="top-right"
			/>
		</main>
	);
}
