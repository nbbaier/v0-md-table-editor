"use client";

import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Check,
	Copy,
	Monitor,
	Moon,
	Plus,
	Sun,
	Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect, useState } from "react";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const defaultMarkdown = `| Name | Age | City |
|------|-----|------|
| John | 25 | NYC |
| Jane | 30 | LA |
| Bob | 35 | Chicago |`;

type Alignment = "left" | "center" | "right";
type MarkdownTab = "edit" | "preview";

let nextRowId = 0;
let nextColId = 0;

export default function MarkdownTableEditor() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [markdown, setMarkdown] = useState(defaultMarkdown);
	const [tableData, setTableData] = useState<string[][]>([]);
	const [alignments, setAlignments] = useState<Alignment[]>([]);
	const [rowIds, setRowIds] = useState<string[]>([]);
	const [colIds, setColIds] = useState<string[]>([]);
	const [copied, setCopied] = useState(false);
	const [markdownTab, setMarkdownTab] = useState<MarkdownTab>("edit");
	const [renderedHtml, setRenderedHtml] = useState("");

	useEffect(() => {
		setMounted(true);
	}, []);

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
			} catch (error) {
				console.error("Error rendering markdown:", error);
				setRenderedHtml("<p>Error rendering markdown</p>");
			}
		};

		renderMarkdown();
	}, [markdown]);

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
	};

	const addColumn = () => {
		if (tableData.length === 0) return;
		const newData = tableData.map((row) => [...row, ""]);
		const newAlignments = [...alignments, "left" as Alignment];
		setTableData(newData);
		setAlignments(newAlignments);
		setColIds([...colIds, `col-${nextColId++}`]);
		updateMarkdown(newData, newAlignments);
	};

	const deleteRow = (rowIndex: number) => {
		if (rowIndex === 0) return;
		const newData = tableData.filter((_, index) => index !== rowIndex);
		const newRowIds = rowIds.filter((_, index) => index !== rowIndex);
		setTableData(newData);
		setRowIds(newRowIds);
		updateMarkdown(newData, alignments);
	};

	const deleteColumn = (colIndex: number) => {
		const newData = tableData.map((row) =>
			row.filter((_, index) => index !== colIndex),
		);
		const newAlignments = alignments.filter((_, index) => index !== colIndex);
		const newColIds = colIds.filter((_, index) => index !== colIndex);
		setTableData(newData);
		setAlignments(newAlignments);
		setColIds(newColIds);
		updateMarkdown(newData, newAlignments);
	};

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(markdown);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="container mx-auto p-6 max-w-7xl overflow-hidden">
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-4xl font-bold mb-2 text-balance">
							Markdown Table Editor
						</h1>
						<p className="text-muted-foreground text-lg">
							{
								"Paste your markdown table, edit it visually, and see changes in real-time"
							}
						</p>
					</div>
					{mounted && (
						<div className="flex gap-1 border border-border rounded-md p-1">
							<Button
								variant={theme === "light" ? "default" : "ghost"}
								size="sm"
								onClick={() => setTheme("light")}
								className="gap-2"
								title="Light mode"
							>
								<Sun className="h-4 w-4" />
							</Button>
							<Button
								variant={theme === "system" ? "default" : "ghost"}
								size="sm"
								onClick={() => setTheme("system")}
								className="gap-2"
								title="System theme"
							>
								<Monitor className="h-4 w-4" />
							</Button>
							<Button
								variant={theme === "dark" ? "default" : "ghost"}
								size="sm"
								onClick={() => setTheme("dark")}
								className="gap-2"
								title="Dark mode"
							>
								<Moon className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</div>

			<div className="grid lg:grid-cols-2 gap-6 min-w-0">
				{/* Markdown Input */}
				<Card className="p-6 min-w-0">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold">Markdown Source</h2>
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
					<Tabs
						value={markdownTab}
						onValueChange={(value: MarkdownTab) =>
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
								// biome-ignore lint/security/noDangerouslySetInnerHtml: idc
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
		</div>
	);
}
