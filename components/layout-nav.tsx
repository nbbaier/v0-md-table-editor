"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LayoutNav() {
	const pathname = usePathname();

	const layouts = [
		{ href: "/", label: "Side-by-Side" },
		{ href: "/layout-2", label: "Tabbed" },
		{ href: "/layout-3", label: "Vertical" },
		{ href: "/command-palette", label: "Command Palette" },
	];

	return (
		<nav className="flex gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border">
			<span className="text-sm font-medium text-muted-foreground mr-2 flex items-center">
				Layout:
			</span>
			{layouts.map((layout) => {
				const isActive = pathname === layout.href;
				return (
					<Link
						key={layout.href}
						href={layout.href}
						className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
							isActive
								? "bg-primary text-primary-foreground font-medium"
								: "hover:bg-muted text-foreground"
						}`}
					>
						{layout.label}
					</Link>
				);
			})}
		</nav>
	);
}
