"use client";

import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Textarea } from "./ui/textarea";

const defaultMarkdown = `| Name | Age | City |
|------|-----|------|
| John | 25 | NYC |
| Jane | 30 | LA |
| Bob | 35 | Chicago |`;

const STORAGE_KEY = "markdown-table-editor-content";

type Alignment = "left" | "center" | "right";

let nextRowId = 0;
let nextColId = 0;

export default function MarkdownTableEditor() {
	const [markdown, setMarkdown] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(STORAGE_KEY);
			return saved || "";
		}
		return "";
	});
	const [tableData, setTableData] = useState<string[][]>([]);
	const [alignments, setAlignments] = useState<Alignment[]>([]);
	const [rowIds, setRowIds] = useState<string[]>([]);
	const [colIds, setColIds] = useState<string[]>([]);
	const [copied, setCopied] = useState(false);
	const [history, setHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(0);
	const [isUndoRedo, setIsUndoRedo] = useState(false);
	const [pendingDeleteRow, setPendingDeleteRow] = useState<number | null>(null);
	const [pendingDeleteCol, setPendingDeleteCol] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	// Keyboard shortcuts for undo/redo and escape to cancel
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setPendingDeleteRow(null);
				setPendingDeleteCol(null);
				return;
			}
			if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
				e.preventDefault();
				undo();
			} else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
				e.preventDefault();
				redo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [historyIndex, history]);

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
		toast.success("Row added");
	};

	const addColumn = () => {
		if (tableData.length === 0) return;
		const newData = tableData.map((row) => [...row, ""]);
		const newAlignments = [...alignments, "left" as Alignment];
		setTableData(newData);
		setAlignments(newAlignments);
		setColIds([...colIds, `col-${nextColId++}`]);
		updateMarkdown(newData, newAlignments);
		toast.success("Column added");
	};

	const confirmDeleteRow = (rowIndex: number) => {
		const newData = tableData.filter((_, index) => index !== rowIndex);
		const newRowIds = rowIds.filter((_, index) => index !== rowIndex);
		setTableData(newData);
		setRowIds(newRowIds);
		updateMarkdown(newData, alignments);
		setPendingDeleteRow(null);
		toast.success("Row deleted");
	};

	const confirmDeleteColumn = (colIndex: number) => {
		const newData = tableData.map((row) =>
			row.filter((_, index) => index !== colIndex),
		);
		const newAlignments = alignments.filter((_, index) => index !== colIndex);
		const newColIds = colIds.filter((_, index) => index !== colIndex);
		setTableData(newData);
		setAlignments(newAlignments);
		setColIds(newColIds);
		updateMarkdown(newData, newAlignments);
		setPendingDeleteCol(null);
		toast.success("Column deleted");
	};

	const undo = () => {
		if (historyIndex > 0) {
			setIsUndoRedo(true);
			setHistoryIndex(historyIndex - 1);
			setMarkdown(history[historyIndex - 1]);
			toast.info("Undone");
		}
	};

	const redo = () => {
		if (historyIndex < history.length - 1) {
			setIsUndoRedo(true);
			setHistoryIndex(historyIndex + 1);
			setMarkdown(history[historyIndex + 1]);
			toast.info("Redone");
		}
	};

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(markdown);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success("Copied to clipboard");
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
			toast.error("Failed to copy");
		}
	};

	const loadExample = () => {
		setMarkdown(defaultMarkdown);
		toast.success("Example loaded");
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
						current += '"';
						i++;
					} else {
						inQuotes = !inQuotes;
					}
				} else if (char === "," && !inQuotes) {
					row.push(current.trim());
					current = "";
				} else {
					current += char;
				}
			}
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
					toast.error("The CSV file appears to be empty.");
					return;
				}

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
				toast.success(`Imported ${parsedData.length} rows`);
			} catch (err) {
				console.error("Error parsing CSV:", err);
				toast.error("Failed to parse CSV file.");
			}
		};

		reader.onerror = () => {
			toast.error("Failed to read the file.");
		};

		reader.readAsText(file);
		e.target.value = "";
	};

	const exportCSV = () => {
		if (tableData.length === 0) {
			toast.error("No table data to export.");
			return;
		}

		try {
			const csvRows = tableData.map((row) => {
				return row
					.map((cell) => {
						if (
							cell.includes(",") ||
							cell.includes('"') ||
							cell.includes("\n")
						) {
							return `"${cell.replace(/"/g, '""')}"`;
						}
						return cell;
					})
					.join(",");
			});

			const csvContent = csvRows.join("\n");
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

			toast.success("CSV downloaded");
		} catch (err) {
			console.error("Error exporting CSV:", err);
			toast.error("Failed to export CSV.");
		}
	};

	return (
		<div className="min-h-screen font-mono text-sm">
			<div className="max-w-3xl mx-auto px-8 py-12">
				{/* Header */}
				<header className="mb-12">
					<div className="border-b border-foreground pb-4">
						<h1 className="text-2xl font-serif tracking-tight">
							Markdown Table Editor
						</h1>
					</div>
					<p className="mt-4 text-muted-foreground leading-relaxed">
						A minimal tool for editing markdown tables. Paste or type markdown
						below, edit visually in the table. Use arrow keys to navigate.
					</p>
				</header>
				{/* Source */}
				<section className="mb-12">
					<div className="flex items-baseline justify-between mb-4">
						<h2 className="font-medium text-muted-foreground">Source</h2>
						<div className="flex gap-4">
							<Button
								onClick={undo}
								variant="ghost"
								size="xs"
								disabled={historyIndex === 0}
								className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rounded-none"
							>
								Undo
							</Button>
							<Button
								onClick={redo}
								variant="ghost"
								size="xs"
								disabled={historyIndex === history.length - 1}
								className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rounded-none"
							>
								Redo
							</Button>
							<Button
								onClick={copyToClipboard}
								variant="ghost"
								size="xs"
								className="text-muted-foreground hover:text-foreground transition-colors rounded-none"
							>
								{copied ? "Copied" : "Copy"}
							</Button>
						</div>
					</div>

					<Textarea
						value={markdown}
						onChange={(e) => setMarkdown(e.target.value)}
						className="w-full min-h-[200px] p-4 font-mono text-sm bg-transparent border border-border focus:border-foreground focus:outline-hidden resize-y rounded-none focus-visible:ring-0 "
						placeholder="Paste your markdown table here..."
					/>
				</section>
				{/* Editor */}
				<section>
					<div className="flex items-baseline justify-between mb-4">
						<h2 className="font-medium text-muted-foreground">Editor</h2>
						<div className="flex gap-4">
							<Button
								onClick={importCSV}
								variant="ghost"
								size="xs"
								className="text-muted-foreground hover:text-foreground transition-colors rounded-none"
							>
								Import
							</Button>
							<Button
								onClick={exportCSV}
								disabled={tableData.length === 0}
								variant="ghost"
								size="xs"
								className="text-muted-foreground hover:text-foreground transition-colors rounded-none"
							>
								Export
							</Button>
							<span className="text-border">·</span>
							<Button
								onClick={addRow}
								disabled={tableData.length === 0}
								variant="ghost"
								size="xs"
								className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rounded-none"
							>
								+ Row
							</Button>
							<Button
								onClick={addColumn}
								variant="ghost"
								size="xs"
								disabled={tableData.length === 0}
								className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rounded-none"
							>
								+ Column
							</Button>
						</div>
					</div>

					<input
						ref={fileInputRef}
						type="file"
						accept=".csv"
						onChange={handleFileImport}
						className="hidden"
					/>

					{tableData.length > 0 ? (
						<div className="border border-border overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b border-border group/header">
										<th className="w-8 p-2 border-r border-border" />
										{tableData[0].map((_, colIndex) => (
											<th
												key={colIds[colIndex]}
												className={`p-2 text-left text-muted-foreground ${
													colIndex < tableData[0].length - 1
														? "border-r border-border"
														: ""
												}`}
											>
												{pendingDeleteCol === colIndex ? (
													<div className="flex items-center gap-2 text-xs">
														<span>Delete?</span>
														<button
															onClick={() => confirmDeleteColumn(colIndex)}
															className="text-destructive hover:underline"
														>
															Yes
														</button>
														<button
															onClick={() => setPendingDeleteCol(null)}
															className="hover:underline"
														>
															No
														</button>
													</div>
												) : (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<button
																className="p-1 hover:text-foreground cursor-pointer"
																title="Column options"
															>
																<MoreHorizontal className="w-3.5 h-3.5" />
															</button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="start">
															<DropdownMenuRadioGroup
																value={alignments[colIndex] || "left"}
																onValueChange={(value) =>
																	handleAlignmentChange(
																		colIndex,
																		value as Alignment,
																	)
																}
															>
																<DropdownMenuRadioItem value="left">
																	<AlignLeft className="w-4 h-4" />
																	Align Left
																</DropdownMenuRadioItem>
																<DropdownMenuRadioItem value="center">
																	<AlignCenter className="w-4 h-4" />
																	Align Center
																</DropdownMenuRadioItem>
																<DropdownMenuRadioItem value="right">
																	<AlignRight className="w-4 h-4" />
																	Align Right
																</DropdownMenuRadioItem>
															</DropdownMenuRadioGroup>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() => setPendingDeleteCol(colIndex)}
																variant="destructive"
															>
																<Trash2 className="w-4 h-4" />
																Delete Column
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{tableData.map((row, rowIndex) => (
										<tr
											key={rowIds[rowIndex]}
											className={`group border-b border-border last:border-b-0 ${
												rowIndex === 0 ? "bg-muted/30" : ""
											}`}
										>
											<td className="p-2 w-8 text-center border-r border-border">
												{rowIndex > 0 &&
													(pendingDeleteRow === rowIndex ? (
														<div className="flex flex-col gap-1 text-xs">
															<button
																onClick={() => confirmDeleteRow(rowIndex)}
																className="text-destructive hover:underline"
															>
																Yes
															</button>
															<button
																onClick={() => setPendingDeleteRow(null)}
																className="text-muted-foreground hover:underline"
															>
																No
															</button>
														</div>
													) : (
														<button
															onClick={() => setPendingDeleteRow(rowIndex)}
															className="text-muted-foreground align-middle hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
															title="Delete row"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</button>
													))}
											</td>
											{row.map((cell, colIndex) => (
												<td
													key={colIds[colIndex]}
													className={`p-0 ${
														colIndex < row.length - 1
															? "border-r border-border"
															: ""
													}`}
												>
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
														style={{
															textAlign: alignments[colIndex] || "left",
														}}
														className={`w-full px-3 py-2 bg-transparent border-0 focus:outline-hidden focus:bg-muted/50 ${
															rowIndex === 0 ? "font-medium" : ""
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
						<div className="border border-dashed border-border p-12 text-center">
							<p className="text-muted-foreground mb-4">
								Paste a markdown table above to begin editing.
							</p>
							<button
								onClick={loadExample}
								className="text-foreground hover:underline"
							>
								Load example
							</button>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
