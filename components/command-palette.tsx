"use client";

import { useEffect, useState } from "react";
import { Command, Search, X } from "lucide-react";
import { Button } from "./ui/button";

export interface CommandItem {
	id: string;
	label: string;
	description?: string;
	shortcut?: string;
	category: string;
	action: () => void;
}

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
	commands: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const filteredCommands = commands.filter(
		(cmd) =>
			cmd.label.toLowerCase().includes(search.toLowerCase()) ||
			cmd.description?.toLowerCase().includes(search.toLowerCase()) ||
			cmd.category.toLowerCase().includes(search.toLowerCase())
	);

	// Group by category
	const groupedCommands = filteredCommands.reduce((acc, cmd) => {
		if (!acc[cmd.category]) acc[cmd.category] = [];
		acc[cmd.category].push(cmd);
		return acc;
	}, {} as Record<string, CommandItem[]>);

	useEffect(() => {
		if (isOpen) {
			setSearch("");
			setSelectedIndex(0);
		}
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < filteredCommands.length - 1 ? prev + 1 : prev
				);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (filteredCommands[selectedIndex]) {
					filteredCommands[selectedIndex].action();
					onClose();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, filteredCommands, selectedIndex, onClose]);

	if (!isOpen) return null;

	let currentIndex = 0;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in"
				onClick={onClose}
			/>

			{/* Command Palette */}
			<div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-in slide-in-from-top-4 fade-in">
				<div className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
					{/* Search Input */}
					<div className="flex items-center gap-3 px-4 py-3 border-b border-border">
						<Search className="h-5 w-5 text-muted-foreground" />
						<input
							type="text"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setSelectedIndex(0);
							}}
							placeholder="Type a command or search..."
							className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
							autoFocus
						/>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-6 w-6 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Commands List */}
					<div className="max-h-[400px] overflow-y-auto">
						{filteredCommands.length === 0 ? (
							<div className="px-4 py-8 text-center text-muted-foreground">
								No commands found
							</div>
						) : (
							Object.entries(groupedCommands).map(([category, items]) => (
								<div key={category}>
									<div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50">
										{category}
									</div>
									{items.map((cmd) => {
										const index = currentIndex++;
										const isSelected = index === selectedIndex;
										return (
											<button
												key={cmd.id}
												onClick={() => {
													cmd.action();
													onClose();
												}}
												className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
													isSelected
														? "bg-primary text-primary-foreground"
														: "hover:bg-muted"
												}`}
											>
												<div className="flex-1">
													<div className="font-medium">{cmd.label}</div>
													{cmd.description && (
														<div
															className={`text-sm mt-0.5 ${
																isSelected
																	? "text-primary-foreground/70"
																	: "text-muted-foreground"
															}`}
														>
															{cmd.description}
														</div>
													)}
												</div>
												{cmd.shortcut && (
													<kbd
														className={`ml-4 px-2 py-1 text-xs font-mono rounded border ${
															isSelected
																? "border-primary-foreground/20 bg-primary-foreground/10"
																: "border-border bg-muted"
														}`}
													>
														{cmd.shortcut}
													</kbd>
												)}
											</button>
										);
									})}
								</div>
							))
						)}
					</div>

					{/* Footer */}
					<div className="px-4 py-2 border-t border-border bg-muted/50 flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-4">
							<span className="flex items-center gap-1">
								<kbd className="px-1.5 py-0.5 bg-background border border-border rounded">↑</kbd>
								<kbd className="px-1.5 py-0.5 bg-background border border-border rounded">↓</kbd>
								navigate
							</span>
							<span className="flex items-center gap-1">
								<kbd className="px-1.5 py-0.5 bg-background border border-border rounded">↵</kbd>
								select
							</span>
							<span className="flex items-center gap-1">
								<kbd className="px-1.5 py-0.5 bg-background border border-border rounded">esc</kbd>
								close
							</span>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

interface CommandPaletteButtonProps {
	onClick: () => void;
}

export function CommandPaletteButton({ onClick }: CommandPaletteButtonProps) {
	return (
		<Button
			variant="outline"
			size="sm"
			onClick={onClick}
			className="gap-2 bg-transparent"
		>
			<Command className="h-4 w-4" />
			<span className="hidden sm:inline">Commands</span>
			<kbd className="hidden sm:inline ml-2 px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded">
				⌘K
			</kbd>
		</Button>
	);
}
