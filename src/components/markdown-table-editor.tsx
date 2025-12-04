"use client";

import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	MoreVertical,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

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
	const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null);
	const [deleteColIndex, setDeleteColIndex] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, markdown);
		}
	}, [markdown]);

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
	}, [markdown, historyIndex, history, isUndoRedo]);

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

	const undo = useCallback(() => {
		if (historyIndex > 0) {
			setIsUndoRedo(true);
			setHistoryIndex(historyIndex - 1);
			setMarkdown(history[historyIndex - 1]);
			toast.info("Undone");
		}
	}, [historyIndex, history]);

	const redo = useCallback(() => {
		if (historyIndex < history.length - 1) {
			setIsUndoRedo(true);
			setHistoryIndex(historyIndex + 1);
			setMarkdown(history[historyIndex + 1]);
			toast.info("Redone");
		}
	}, [historyIndex, history]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setDeleteRowIndex(null);
				setDeleteColIndex(null);
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
	}, [undo, redo]);

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
		setDeleteRowIndex(null);
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
		setDeleteColIndex(null);
		toast.success("Column deleted");
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
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-serif tracking-tight">
							Markdown Table Editor
						</CardTitle>
						<CardDescription>
							A minimal tool for editing markdown tables. Paste or type markdown
							below, edit visually in the table. Use ⌘Z to undo, ⌘⇧Z to redo,
							arrow keys to navigate.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="visual" className="w-full">
							<TabsList className="mb-4">
								<TabsTrigger value="visual">Visual Editor</TabsTrigger>
								<TabsTrigger value="source">Markdown Source</TabsTrigger>
							</TabsList>

							<TabsContent value="source" className="space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="font-medium text-muted-foreground">Source</h2>
									<div className="flex gap-2">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														onClick={undo}
														disabled={historyIndex === 0}
													>
														Undo
													</Button>
												</TooltipTrigger>
												<TooltipContent>⌘Z</TooltipContent>
											</Tooltip>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														onClick={redo}
														disabled={historyIndex === history.length - 1}
													>
														Redo
													</Button>
												</TooltipTrigger>
												<TooltipContent>⌘⇧Z</TooltipContent>
											</Tooltip>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														onClick={copyToClipboard}
													>
														{copied ? "Copied" : "Copy"}
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Copy markdown to clipboard
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								</div>

								<Textarea
									value={markdown}
									onChange={(e) => setMarkdown(e.target.value)}
									className="min-h-[200px] font-mono resize-y"
									placeholder="Paste your markdown table here..."
								/>
							</TabsContent>

							<TabsContent value="visual" className="space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="font-medium text-muted-foreground">Editor</h2>
									<div className="flex gap-2">
										<Button variant="ghost" size="sm" onClick={importCSV}>
											Import
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={exportCSV}
											disabled={tableData.length === 0}
										>
											Export
										</Button>
										<span className="text-border self-center">·</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={addRow}
											disabled={tableData.length === 0}
										>
											+ Row
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={addColumn}
											disabled={tableData.length === 0}
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
									<div className="border border-border overflow-x-auto rounded-md">
										<Table>
											<TableHeader>
												<TableRow className="group/header">
													<TableHead className="w-8" />
													{tableData[0].map((_, colIndex) => (
														<TableHead key={colIds[colIndex]}>
															<div className="flex items-center justify-between">
																<span className="text-muted-foreground">
																	{tableData[0][colIndex]}
																</span>
																<TooltipProvider>
																	<DropdownMenu>
																		<Tooltip>
																			<TooltipTrigger asChild>
																				<DropdownMenuTrigger asChild>
																					<Button
																						variant="ghost"
																						size="icon-sm"
																						className="opacity-0 group-hover/header:opacity-100 transition-opacity h-6 w-6"
																					>
																						<MoreVertical className="h-3.5 w-3.5" />
																					</Button>
																				</DropdownMenuTrigger>
																			</TooltipTrigger>
																			<TooltipContent>
																				Column options
																			</TooltipContent>
																		</Tooltip>
																		<DropdownMenuContent align="end">
																			<DropdownMenuItem
																				onClick={() =>
																					handleAlignmentChange(
																						colIndex,
																						"left",
																					)
																				}
																			>
																				<AlignLeft className="mr-2 h-4 w-4" />
																				Align Left
																				{alignments[colIndex] === "left"
																					? " ✓"
																					: ""}
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onClick={() =>
																					handleAlignmentChange(
																						colIndex,
																						"center",
																					)
																				}
																			>
																				<AlignCenter className="mr-2 h-4 w-4" />
																				Align Center
																				{alignments[colIndex] === "center"
																					? " ✓"
																					: ""}
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onClick={() =>
																					handleAlignmentChange(
																						colIndex,
																						"right",
																					)
																				}
																			>
																				<AlignRight className="mr-2 h-4 w-4" />
																				Align Right
																				{alignments[colIndex] === "right"
																					? " ✓"
																					: ""}
																			</DropdownMenuItem>
																			<DropdownMenuSeparator />
																			<DropdownMenuItem
																				variant="destructive"
																				onClick={() =>
																					setDeleteColIndex(colIndex)
																				}
																			>
																				<Trash2 className="mr-2 h-4 w-4" />
																				Delete Column
																			</DropdownMenuItem>
																		</DropdownMenuContent>
																	</DropdownMenu>
																</TooltipProvider>
															</div>
														</TableHead>
													))}
												</TableRow>
											</TableHeader>
											<TableBody>
												{tableData.map((row, rowIndex) => (
													<TableRow
														key={rowIds[rowIndex]}
														className={`group ${rowIndex === 0 ? "bg-muted/30" : ""}`}
													>
														<TableCell className="w-8 text-center">
															{rowIndex > 0 && (
																<TooltipProvider>
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<Button
																				variant="ghost"
																				size="icon-sm"
																				onClick={() =>
																					setDeleteRowIndex(rowIndex)
																				}
																				className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
																			>
																				<Trash2 className="h-3.5 w-3.5" />
																			</Button>
																		</TooltipTrigger>
																		<TooltipContent>Delete row</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
															)}
														</TableCell>
														{row.map((cell, colIndex) => (
															<TableCell key={colIds[colIndex]} className="p-0">
																<Input
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
																	className={`w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-muted/50 ${
																		rowIndex === 0 ? "font-medium" : ""
																	}`}
																/>
															</TableCell>
														))}
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								) : (
									<div className="border border-dashed border-border p-12 text-center rounded-md">
										<p className="text-muted-foreground mb-4">
											Paste a markdown table above to begin editing.
										</p>
										<Button variant="ghost" onClick={loadExample}>
											Load example
										</Button>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				<AlertDialog
					open={deleteRowIndex !== null}
					onOpenChange={(open) => !open && setDeleteRowIndex(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Row?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								row and all its data.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() =>
									deleteRowIndex !== null && confirmDeleteRow(deleteRowIndex)
								}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<AlertDialog
					open={deleteColIndex !== null}
					onOpenChange={(open) => !open && setDeleteColIndex(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Column?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								column and all its data.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() =>
									deleteColIndex !== null && confirmDeleteColumn(deleteColIndex)
								}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
