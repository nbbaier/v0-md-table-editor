import type { Alignment } from "@/types/table";

export function isBold(text: string): boolean {
	return text.startsWith("**") && text.endsWith("**") && text.length > 4;
}

export function isItalic(text: string): boolean {
	return (
		text.startsWith("*") &&
		text.endsWith("*") &&
		text.length > 2 &&
		!isBold(text)
	);
}

export function toggleBold(text: string): string {
	if (isBold(text)) {
		return text.slice(2, -2);
	}
	return `**${text}**`;
}

export function toggleItalic(text: string): string {
	if (isItalic(text)) {
		return text.slice(1, -1);
	}
	return `*${text}*`;
}

export function parseMarkdownTable(markdown: string): {
	data: string[][];
	alignments: Alignment[];
} | null {
	const lines = markdown
		.trim()
		.split("\n")
		.filter((line) => line.trim());

	if (lines.length < 2) {
		return null;
	}

	const separatorLine = lines[1];
	const separators = separatorLine
		.split("|")
		.slice(1, -1)
		.map((sep) => sep.trim());

	const alignments: Alignment[] = separators.map((sep) => {
		if (sep.startsWith(":") && sep.endsWith(":")) return "center";
		if (sep.endsWith(":")) return "right";
		return "left";
	});

	const data = lines
		.filter((_, index) => index !== 1)
		.map((line) =>
			line
				.split("|")
				.slice(1, -1)
				.map((cell) => cell.trim()),
		);

	return { data, alignments };
}

export function generateMarkdown(
	data: string[][],
	alignments: Alignment[],
): string {
	if (data.length === 0) return "";

	const headers = data[0];
	const rows = data.slice(1);

	const separator = headers
		.map((_, index) => {
			const align = alignments[index] || "left";
			if (align === "center") return ":---:";
			if (align === "right") return "---:";
			return "---";
		})
		.join(" | ");

	const headerLine = headers.join(" | ");
	const rowLines = rows.map((row) => row.join(" | "));

	return rows.length > 0
		? `| ${headerLine} |\n| ${separator} |\n| ${rowLines.join(" |\n| ")} |`
		: `| ${headerLine} |\n| ${separator} |`;
}

export function parseCSV(csvText: string): string[][] {
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
}

export function generateCSV(data: string[][]): string {
	const csvRows = data.map((row) => {
		return row
			.map((cell) => {
				if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
					return `"${cell.replace(/"/g, '""')}"`;
				}
				return cell;
			})
			.join(",");
	});

	return csvRows.join("\n");
}

export function csvToMarkdown(csvText: string): string {
	const parsedData = parseCSV(csvText);
	if (parsedData.length === 0) {
		throw new Error("CSV file is empty");
	}

	const headers = parsedData[0];
	const rows = parsedData.slice(1);
	const separator = headers.map(() => "---").join(" | ");
	const headerLine = headers.join(" | ");
	const rowLines = rows.map((row) => row.join(" | "));

	return rows.length > 0
		? `| ${headerLine} |\n| ${separator} |\n| ${rowLines.join(" |\n| ")} |`
		: `| ${headerLine} |\n| ${separator} |`;
}
