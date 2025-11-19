"use client";

import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Check,
	Copy,
	Download,
	Monitor,
	Moon,
	Plus,
	Redo2,
	Sun,
	Trash2,
	Undo2,
	Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { LayoutNav } from "@/components/layout-nav";
import { CommandPalette, CommandPaletteButton, type CommandItem } from "@/components/command-palette";

const defaultMarkdown = `| Name | Age | City |
|------|-----|------|
| John | 25 | NYC |
| Jane | 30 | LA |
| Bob | 35 | Chicago |`;

const STORAGE_KEY = "markdown-table-editor-content";

type Alignment = "left" | "center" | "right";
type MarkdownTab = "edit" | "preview";

let nextRowId = 0;
let nextColId = 0;

export default function MarkdownTableEditorCmd() {
	const { theme, setTheme } = useTheme();
	const { toasts, closeToast, success, error, info } = useToast();
	const [mounted, setMounted] = useState(false);
	const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
	const [markdown, setMarkdown] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(STORAGE_KEY);
			return saved || defaultMarkdown;
		}
		return defaultMarkdown;
	});
	const [tableData, setTableData] = useState<string[][]>([]);
	const [alignments, setAlignments] = useState<Alignment[]>([]);
	const [rowIds, setRowIds] = useState<string[]>([]);
	const [colIds, setColIds] = useState<string[]>([]);
	const [copied, setCopied] = useState(false);
	const [markdownTab, setMarkdownTab] = useState<MarkdownTab>("edit");
	const [renderedHtml, setRenderedHtml] = useState("");
	const [history, setHistory] = useState<string[]>([markdown]);
	const [historyIndex, setHistoryIndex] = useState(0);
	const [isUndoRedo, setIsUndoRedo] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Auto-save to localStorage
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, markdown);
		}
	}, [markdown]);

	// Track history for undo/redo
	useEffect(() => {
		if (isUndoRedo) {
			setIsUndoRedo(false);
			return;
		}

		// Only add to history if markdown actually changed
		if (history[historyIndex] !== markdown) {
			const newHistory = history.slice(0, historyIndex + 1);
			newHistory.push(markdown);
			setHistory(newHistory);
			setHistoryIndex(newHistory.length - 1);
		}
	}, [markdown]);

	useEffect(() => {
		const lines = markdown
			.trim()
			.split("\n")
			.filter((line) => line.trim());
		if (lines.length < 2) {
			setTableData([]);
			setAlignments([]);
			setRowIds([]);
			setColIds([]);
			return;
		}

		const separatorLine = lines[1];
		const separators = separatorLine
			.split("|")
			.slice(1, -1)
			.map((sep) => sep.trim());

		const parsedAlignments: Alignment[] = separators.map((sep) => {
			if (sep.startsWith(":") && sep.endsWith(":")) return "center";
			if (sep.endsWith(":")) return "right";
			return "left";
		});
		setAlignments(parsedAlignments);

		const parsedData = lines
			.filter((_, index) => index !== 1)
			.map((line) =>
				line
					.split("|")
					.slice(1, -1)
					.map((cell) => cell.trim()),
			);

		setTableData(parsedData);

		const newRowIds = parsedData.map(() => `row-${nextRowId++}`);
		setRowIds(newRowIds);

		const newColIds = separators.map(() => `col-${nextColId++}`);
		setColIds(newColIds);
	}, [markdown]);

	useEffect(() => {
		const renderMarkdown = async () => {
			try {
				const file = await unified()
					.use(remarkParse)
					.use(remarkGfm)
					.use(remarkRehype)
					.use(rehypeStringify)
					.process(markdown);

				setRenderedHtml(String(file));
			} catch (err) {
				console.error("Error rendering markdown:", err);
				setRenderedHtml("<p>Error rendering markdown</p>");
				error("Failed to render markdown preview");
			}
		};

		renderMarkdown();
	}, [markdown, error]);

	// Keyboard shortcuts for undo/redo and command palette
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Command palette (Cmd+K)
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsCommandPaletteOpen(true);
				return;
			}

			// Don't handle other shortcuts if command palette is open
			if (isCommandPaletteOpen) return;

			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
				e.preventDefault();
				undo();
			} else if (
				(e.metaKey || e.ctrlKey) &&
				e.shiftKey &&
				e.key === "z"
			) {
				e.preventDefault();
				redo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [historyIndex, history, isCommandPaletteOpen]);

	const updateMarkdown = (data: string[][], aligns: Alignment[]) => {
		if (data.length === 0) return;

		const headers = data[0];
		const rows = data.slice(1);

		const separator = headers
			.map((_, index) => {
				const align = aligns[index] || "left";
				if (align === "center") return ":---:";
				if (align === "right") return "---:";
				return "---";
			})
			.join(" | ");

		const headerLine = headers.join(" | ");
		const rowLines = rows.map((row) => row.join(" | "));

		const newMarkdown =
			rows.length > 0
				? `| ${headerLine} |\n| ${separator} |\n| ${rowLines.join(" |\n| ")} |`
				: `| ${headerLine} |\n| ${separator} |`;
		setMarkdown(newMarkdown);
	};

	const isBold = (text: string) =>
		text.startsWith("**") && text.endsWith("**") && text.length > 4;
	const isItalic = (text: string) =>
		text.startsWith("*") &&
		text.endsWith("*") &&
		text.length > 2 &&
		!isBold(text);

	const toggleBold = (text: string) => {
		if (isBold(text)) {
			return text.slice(2, -2);
		}
		return `**${text}**`;
	};

	const toggleItalic = (text: string) => {
		if (isItalic(text)) {
			return text.slice(1, -1);
		}
		return `*${text}*`;
	};

	const handleCellChange = (
		rowIndex: number,
		colIndex: number,
		value: string,
	) => {
		const newData = [...tableData];
		newData[rowIndex][colIndex] = value;
		setTableData(newData);
		updateMarkdown(newData, alignments);
	};

	const handleToggleBold = (rowIndex: number, colIndex: number) => {
		const newData = [...tableData];
		newData[rowIndex][colIndex] = toggleBold(newData[rowIndex][colIndex]);
		setTableData(newData);
		updateMarkdown(newData, alignments);
	};

	const handleToggleItalic = (rowIndex: number, colIndex: number) => {
		const newData = [...tableData];
		newData[rowIndex][colIndex] = toggleItalic(newData[rowIndex][colIndex]);
		setTableData(newData);
		updateMarkdown(newData, alignments);
	};

	const handleAlignmentChange = (colIndex: number, alignment: Alignment) => {
		const newAlignments = [...alignments];
		newAlignments[colIndex] = alignment;
		setAlignments(newAlignments);
		updateMarkdown(tableData, newAlignments);
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		rowIndex: number,
		colIndex: number,
	) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "b") {
			e.preventDefault();
			handleToggleBold(rowIndex, colIndex);
			return;
		}

		if ((e.metaKey || e.ctrlKey) && e.key === "i") {
			e.preventDefault();
			handleToggleItalic(rowIndex, colIndex);
			return;
		}

		let targetRow = rowIndex;
		let targetCol = colIndex;

		if (e.key === "Enter" || e.key === "ArrowDown") {
			e.preventDefault();
			targetRow = rowIndex + 1;
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			targetRow = rowIndex - 1;
		} else if (e.key === "ArrowLeft") {
			e.preventDefault();
			targetCol = colIndex - 1;
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			targetCol = colIndex + 1;
		} else {
			return;
		}

		if (
			targetRow >= 0 &&
			targetRow < tableData.length &&
			targetCol >= 0 &&
			targetCol < tableData[0].length
		) {
			const nextInput = document.querySelector(
				`input[data-row="${targetRow}"][data-col="${targetCol}"]`,
			) as HTMLInputElement;
			nextInput?.focus();
		}
	};

	const addRow = () => {
		if (tableData.length === 0) return;
		const newRow = new Array(tableData[0].length).fill("");
		const newData = [...tableData, newRow];
		setTableData(newData);
		setRowIds([...rowIds, `row-${nextRowId++}`]);
		updateMarkdown(newData, alignments);
		success("Row added successfully");
	};

	const addColumn = () => {
		if (tableData.length === 0) return;
		const newData = tableData.map((row) => [...row, ""]);
		const newAlignments = [...alignments, "left" as Alignment];
		setTableData(newData);
		setAlignments(newAlignments);
		setColIds([...colIds, `col-${nextColId++}`]);
		updateMarkdown(newData, newAlignments);
		success("Column added successfully");
	};

	const deleteRow = (rowIndex: number) => {
		if (rowIndex === 0) return;

		const confirmed = window.confirm(
			"Are you sure you want to delete this row?"
		);
		if (!confirmed) return;

		const newData = tableData.filter((_, index) => index !== rowIndex);
		const newRowIds = rowIds.filter((_, index) => index !== rowIndex);
		setTableData(newData);
		setRowIds(newRowIds);
		updateMarkdown(newData, alignments);
		success("Row deleted successfully");
	};

	const deleteColumn = (colIndex: number) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this column?"
		);
		if (!confirmed) return;

		const newData = tableData.map((row) =>
			row.filter((_, index) => index !== colIndex),
		);
		const newAlignments = alignments.filter((_, index) => index !== colIndex);
		const newColIds = colIds.filter((_, index) => index !== colIndex);
		setTableData(newData);
		setAlignments(newAlignments);
		setColIds(newColIds);
		updateMarkdown(newData, newAlignments);
		success("Column deleted successfully");
	};

	const undo = () => {
		if (historyIndex > 0) {
			setIsUndoRedo(true);
			setHistoryIndex(historyIndex - 1);
			setMarkdown(history[historyIndex - 1]);
			info("Undone");
		}
	};

	const redo = () => {
		if (historyIndex < history.length - 1) {
			setIsUndoRedo(true);
			setHistoryIndex(historyIndex + 1);
			setMarkdown(history[historyIndex + 1]);
			info("Redone");
		}
	};

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(markdown);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			success("Markdown copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
			error("Failed to copy to clipboard. Please try again.");
		}
	};

	const parseCSV = (csvText: string): string[][] => {
		const lines = csvText.trim().split("\n");
		const result: string[][] = [];

		for (const line of lines) {
			const row: string[] = [];
			let current = "";
			let inQuotes = false;

			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				const nextChar = line[i + 1];

				if (char === '"') {
					if (inQuotes && nextChar === '"') {
						// Escaped quote
						current += '"';
						i++; // Skip next quote
					} else {
						// Toggle quote state
						inQuotes = !inQuotes;
					}
				} else if (char === "," && !inQuotes) {
					// End of field
					row.push(current.trim());
					current = "";
				} else {
					current += char;
				}
			}
			// Add last field
			row.push(current.trim());
			result.push(row);
		}

		return result;
	};

	const importCSV = () => {
		fileInputRef.current?.click();
	};

	const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const csvText = event.target?.result as string;
			try {
				const parsedData = parseCSV(csvText);
				if (parsedData.length === 0) {
					error("The CSV file appears to be empty.");
					return;
				}

				// Create markdown from CSV data
				const headers = parsedData[0];
				const rows = parsedData.slice(1);
				const separator = headers.map(() => "---").join(" | ");
				const headerLine = headers.join(" | ");
				const rowLines = rows.map((row) => row.join(" | "));

				const newMarkdown =
					rows.length > 0
						? `| ${headerLine} |\n| ${separator} |\n| ${rowLines.join(" |\n| ")} |`
						: `| ${headerLine} |\n| ${separator} |`;

				setMarkdown(newMarkdown);
				success(`Imported CSV with ${parsedData.length} rows and ${headers.length} columns`);
			} catch (err) {
				console.error("Error parsing CSV:", err);
				error("Failed to parse CSV file. Please check the file format.");
			}
		};

		reader.onerror = () => {
			error("Failed to read the file. Please try again.");
		};

		reader.readAsText(file);
		// Reset input so same file can be imported again
		e.target.value = "";
	};

	const exportCSV = () => {
		if (tableData.length === 0) {
			error("No table data to export.");
			return;
		}

		try {
			// Convert table data to CSV
			const csvRows = tableData.map((row) => {
				return row
					.map((cell) => {
						// Escape quotes and wrap in quotes if contains comma or quote
						if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
							return `"${cell.replace(/"/g, '""')}"`;
						}
						return cell;
					})
					.join(",");
			});

			const csvContent = csvRows.join("\n");

			// Create download link
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);

			link.setAttribute("href", url);
			link.setAttribute("download", "table.csv");
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			success("CSV file downloaded successfully!");
		} catch (err) {
			console.error("Error exporting CSV:", err);
			error("Failed to export CSV. Please try again.");
		}
	};

	const resetTable = () => {
		const confirmed = window.confirm(
			"Are you sure you want to reset the table to default? This will clear all your data and cannot be undone."
		);
		if (!confirmed) return;

		localStorage.removeItem(STORAGE_KEY);
		setMarkdown(defaultMarkdown);
		success("Table reset to default");
	};

	// Command palette commands
	const commands: CommandItem[] = [
		// Edit commands
		{
			id: "undo",
			label: "Undo",
			description: "Undo last change",
			shortcut: "⌘Z",
			category: "Edit",
			action: undo,
		},
		{
			id: "redo",
			label: "Redo",
			description: "Redo last undone change",
			shortcut: "⌘⇧Z",
			category: "Edit",
			action: redo,
		},
		{
			id: "copy",
			label: "Copy Markdown",
			description: "Copy markdown to clipboard",
			category: "Edit",
			action: copyToClipboard,
		},
		// Table commands
		{
			id: "add-row",
			label: "Add Row",
			description: "Add a new row at the end of the table",
			category: "Table",
			action: addRow,
		},
		{
			id: "add-column",
			label: "Add Column",
			description: "Add a new column at the end of the table",
			category: "Table",
			action: addColumn,
		},
		{
			id: "reset-table",
			label: "Reset Table",
			description: "Clear all data and reset to default table",
			category: "Table",
			action: resetTable,
		},
		// Import/Export
		{
			id: "import-csv",
			label: "Import CSV",
			description: "Import table from CSV file",
			category: "Import/Export",
			action: importCSV,
		},
		{
			id: "export-csv",
			label: "Export CSV",
			description: "Export table to CSV file",
			category: "Import/Export",
			action: exportCSV,
		},
		// Theme
		{
			id: "theme-light",
			label: "Light Theme",
			description: "Switch to light theme",
			category: "Appearance",
			action: () => setTheme("light"),
		},
		{
			id: "theme-dark",
			label: "Dark Theme",
			description: "Switch to dark theme",
			category: "Appearance",
			action: () => setTheme("dark"),
		},
		{
			id: "theme-system",
			label: "System Theme",
			description: "Use system theme preference",
			category: "Appearance",
			action: () => setTheme("system"),
		},
	];

	return (
		<div className="container mx-auto p-6 max-w-7xl overflow-hidden">
			<div className="mb-8">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-4xl font-bold mb-2 text-balance">
							Markdown Table Editor
						</h1>
						<p className="text-muted-foreground text-lg">
							Command Palette Mode - Press <kbd className="px-2 py-1 text-sm bg-muted border border-border rounded">⌘K</kbd> for all actions
						</p>
					</div>
					{mounted && (
						<CommandPaletteButton onClick={() => setIsCommandPaletteOpen(true)} />
					)}
				</div>
				<LayoutNav />
			</div>

			<div className="grid lg:grid-cols-2 gap-6 min-w-0">
				{/* Markdown Input */}
				<Card className="p-6 min-w-0">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold">Markdown Source</h2>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={undo}
								disabled={historyIndex === 0}
								className="gap-2 bg-transparent"
								title="Undo (Cmd/Ctrl+Z)"
							>
								<Undo2 className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={redo}
								disabled={historyIndex === history.length - 1}
								className="gap-2 bg-transparent"
								title="Redo (Cmd/Ctrl+Shift+Z)"
							>
								<Redo2 className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={copyToClipboard}
								className="gap-2 bg-transparent"
							>
								{copied ? (
									<>
										<Check className="h-4 w-4" />
										{"Copied"}
									</>
								) : (
									<>
										<Copy className="h-4 w-4" />
										{"Copy"}
									</>
								)}
							</Button>
						</div>
					</div>
					<Tabs
						value={markdownTab}
						onValueChange={(value: string) =>
							setMarkdownTab(value as MarkdownTab)
						}
					>
						<TabsList>
							<TabsTrigger value="edit">Edit</TabsTrigger>
							<TabsTrigger value="preview">Preview</TabsTrigger>
						</TabsList>
						<TabsContent value="edit">
							<Textarea
								value={markdown}
								onChange={(e) => setMarkdown(e.target.value)}
								className="font-mono text-sm min-h-[200px] resize-y"
								placeholder="Paste your markdown table here..."
							/>
						</TabsContent>
						<TabsContent value="preview">
							<div
								className="markdown-body min-h-[200px] overflow-x-auto p-4 rounded-md"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized by remark/rehype processors
								dangerouslySetInnerHTML={{ __html: renderedHtml }}
							/>
						</TabsContent>
					</Tabs>
				</Card>

				{/* Visual Table Editor */}
				<Card className="p-6 min-w-0">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold">Visual Editor</h2>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={importCSV}
								className="gap-2 bg-transparent"
								title="Import CSV file"
							>
								<Upload className="h-4 w-4" />
								{"Import CSV"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={exportCSV}
								disabled={tableData.length === 0}
								className="gap-2 bg-transparent"
								title="Export to CSV file"
							>
								<Download className="h-4 w-4" />
								{"Export CSV"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={addRow}
								disabled={tableData.length === 0}
								className="gap-2 bg-transparent"
							>
								<Plus className="h-4 w-4" />
								{"Row"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={addColumn}
								disabled={tableData.length === 0}
								className="gap-2 bg-transparent"
							>
								<Plus className="h-4 w-4" />
								{"Column"}
							</Button>
						</div>
					</div>
					<input
						ref={fileInputRef}
						type="file"
						accept=".csv"
						onChange={handleFileImport}
						style={{ display: "none" }}
					/>

					{tableData.length > 0 ? (
						<div className="overflow-x-auto overflow-y-auto max-h-[500px]">
							<table className="border-collapse w-full">
								<thead>
									<tr>
										<th className="w-8"></th>
										{tableData[0].map((_, colIndex) => (
											<th key={colIds[colIndex]} className="p-0">
												<div className="flex gap-1 items-center justify-center py-1">
													<div className="flex gap-0.5">
														<Button
															variant={
																alignments[colIndex] === "left"
																	? "default"
																	: "ghost"
															}
															size="sm"
															onClick={() =>
																handleAlignmentChange(colIndex, "left")
															}
															className="h-6 w-6 p-0"
															title="Align left"
														>
															<AlignLeft className="h-3 w-3" />
														</Button>
														<Button
															variant={
																alignments[colIndex] === "center"
																	? "default"
																	: "ghost"
															}
															size="sm"
															onClick={() =>
																handleAlignmentChange(colIndex, "center")
															}
															className="h-6 w-6 p-0"
															title="Align center"
														>
															<AlignCenter className="h-3 w-3" />
														</Button>
														<Button
															variant={
																alignments[colIndex] === "right"
																	? "default"
																	: "ghost"
															}
															size="sm"
															onClick={() =>
																handleAlignmentChange(colIndex, "right")
															}
															className="h-6 w-6 p-0"
															title="Align right"
														>
															<AlignRight className="h-3 w-3" />
														</Button>
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => deleteColumn(colIndex)}
														className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
														title="Delete column"
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{tableData.map((row, rowIndex) => (
										<tr key={rowIds[rowIndex]}>
											<td className="p-0">
												{rowIndex > 0 && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => deleteRow(rowIndex)}
														className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												)}
											</td>
											{row.map((cell, colIndex) => (
												<td key={colIds[colIndex]} className="p-1">
													<input
														type="text"
														value={cell}
														onChange={(e) =>
															handleCellChange(
																rowIndex,
																colIndex,
																e.target.value,
															)
														}
														onKeyDown={(e) =>
															handleKeyDown(e, rowIndex, colIndex)
														}
														data-row={rowIndex}
														data-col={colIndex}
														className={`w-full min-w-[100px] max-w-[300px] px-3 py-2 border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
															rowIndex === 0 ? "font-semibold bg-muted" : ""
														}`}
													/>
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="flex items-center justify-center h-[500px] text-muted-foreground">
							{"Paste a markdown table to get started"}
						</div>
					)}
				</Card>
			</div>
			<ToastContainer toasts={toasts} onClose={closeToast} />
			<CommandPalette
				isOpen={isCommandPaletteOpen}
				onClose={() => setIsCommandPaletteOpen(false)}
				commands={commands}
			/>
		</div>
	);
}
