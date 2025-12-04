import MarkdownTableEditor from "@/components/markdown-table-editor";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
	return (
		<main className="min-h-screen bg-background">
			<MarkdownTableEditor />
			<Toaster />
		</main>
	);
}
