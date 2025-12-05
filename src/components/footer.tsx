import { Github } from "lucide-react";

export default function Footer() {
	return (
		<footer className="">
			<div className="px-8 py-8 mx-auto max-w-3xl">
				<div className="flex justify-between items-center text-xs text-muted-foreground">
					<p>
						&copy; {new Date().getFullYear()} Nico Baier. All rights reserved.
					</p>
					<a
						href="https://github.com/nbbaier/v0-md-table-editor"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 hover:text-foreground transition-colors"
						title="View on GitHub"
					>
						<Github className="w-4 h-4" />
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}
