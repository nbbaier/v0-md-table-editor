# Tabula (markdown table editor)

Client-only Vite + React 19 single-page app, styled with Tailwind 4 and shadcn/ui.
The user pastes a markdown table, edits it as a grid, and copies the result.
`index.html` loads `src/main.tsx`, which renders `src/App.tsx`. Nearly all
logic lives in `src/components/markdown-table-editor.tsx`. Table parsing and
serialisation are hand-written in `src/lib/markdown-utils.ts`; there is no
markdown library and no HTML preview.

## Commands
- pnpm (`pnpm-lock.yaml`). `pnpm dev`, `pnpm build` (runs `tsc` then
  `vite build`), `pnpm lint` (Biome check). No test framework.
- `pnpm generate:og` regenerates `public/og-image.png`.
- `astro.config.mjs` and the Next.js entries in `.gitignore` are leftovers;
  Astro and Next are not dependencies.

## Editor invariants
- The `markdown` string is the source of truth. The grid state is re-derived
  from it by `parseMarkdownTable` in an effect. Every grid edit writes back
  through `updateMarkdown` (which calls `generateMarkdown`), so the textarea,
  localStorage autosave and undo history all see it.
- Undo/redo is a history of markdown snapshots. A change that bypasses
  `setMarkdown` is invisible to undo and autosave.
- Rows and columns are keyed by `rowIds`/`colIds`, never by index. Any
  operation that adds or removes a row or column updates the matching ID
  array in the same step.
- Row 0 is the header. It has no delete control, and it is rendered and
  serialised as the header line.
- Alignment lives in `alignments`, one per column, and is written to the
  separator line as `---`, `:---:` or `---:`.
- Keyboard: arrows move between cells, Enter moves down, Cmd/Ctrl+B and
  Cmd/Ctrl+I toggle bold and italic on the whole cell. Globally, Cmd/Ctrl+Z
  undoes, Cmd/Ctrl+Shift+Z redoes, Cmd/Ctrl+C copies the markdown when focus
  is outside an input, and Escape cancels a pending delete. Keep the button
  `title` hints in sync with these.

## Code style
- Biome formats: tabs, double quotes. Files `kebab-case`, components
  `PascalCase`.
- `@/` maps to `src/`. Merge Tailwind classes with `cn()` from `@/lib/utils`.
- Local `useState` over global state. Icons from `lucide-react`. User-facing
  success and failure go through `sonner` toasts.

## Done means
`pnpm lint` and `pnpm build` pass.
