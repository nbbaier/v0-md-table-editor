# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application that provides a visual markdown table editor with real-time preview. It allows users to paste markdown tables, edit them visually in a spreadsheet-like interface, and see changes reflected in real-time in both the markdown source and HTML preview.

## Common Commands

```bash
# Development
npm run dev              # Start development server (default: http://localhost:3000)

# Building
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
```

## Architecture

### Single-Page Application Structure

This is a minimal Next.js app with all core functionality contained in a single main component:

- **`app/page.tsx`**: Entry point that renders the main `MarkdownTableEditor` component
- **`components/markdown-table-editor.tsx`**: The heart of the application (~550 lines)
  - Handles markdown parsing and table state management
  - Provides visual table editing with row/column manipulation
  - Implements real-time bidirectional sync between markdown and visual editor
  - Includes theme switching UI
  - Uses `unified`, `remark-gfm`, and `rehype-stringify` for markdown processing

### State Management

The main component uses React state extensively with no external state management library:

- `markdown`: Raw markdown string source
- `tableData`: 2D array of cell values parsed from markdown
- `alignments`: Column alignment settings (left/center/right)
- `rowIds` & `colIds`: Stable identifiers for React keys during row/column operations
- `renderedHtml`: Processed HTML for preview tab

Critical implementation detail: The app maintains two-way synchronization between markdown text and visual table representation through the `updateMarkdown()` function (line 120).

### Markdown Processing Pipeline

1. User pastes markdown → `markdown` state updates
2. `useEffect` (line 56) parses markdown into `tableData` and `alignments`
3. User edits visual table → `handleCellChange()` updates `tableData`
4. `updateMarkdown()` regenerates markdown from `tableData` and `alignments`
5. Separate `useEffect` (line 100) processes markdown through unified/remark/rehype for HTML preview

### UI Component Structure

Built on shadcn/ui components (Radix UI + Tailwind CSS):
- **Theme System**: Uses `next-themes` for light/dark/system theme switching with `ThemeProvider` wrapper
- **Styling**: Tailwind CSS 4.x with custom configuration
- **UI Components**: Located in `components/ui/` - button, card, tabs, textarea (shadcn/ui patterns)
- **Utility**: `lib/utils.ts` contains the standard `cn()` helper for merging Tailwind classes

### Key Features Implementation

**Keyboard Navigation** (lines 199-246):
- Arrow keys navigate between cells
- Enter/Down moves to next row
- Cmd/Ctrl+B toggles bold
- Cmd/Ctrl+I toggles italic

**Column Alignment** (lines 192-197):
- Modifies separator line syntax (`:---:`, `---:`, `---`)
- Alignment controls appear in table header

**Row/Column Operations**:
- `addRow()` / `addColumn()`: Append new rows/columns
- `deleteRow()` / `deleteColumn()`: Remove rows/columns (header row cannot be deleted)
- Uses stable IDs (`row-${nextRowId++}`) to prevent React key issues during mutations

## Build Configuration

The `next.config.mjs` file contains important production build settings:
- ESLint and TypeScript errors are ignored during builds
- Images are unoptimized (for v0.app compatibility)

This configuration suggests the project prioritizes deployment speed over strict type checking in CI/CD.

## Path Aliases

TypeScript is configured with `@/*` path alias pointing to the root directory.

Example: `@/components/ui/button` resolves to `./components/ui/button`
