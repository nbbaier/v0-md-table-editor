# Agent Guidelines

## Commands
- **Build**: `npm run build` (Next.js build)
- **Dev**: `npm run dev`
- **Lint**: `npm run lint` (ESLint)
- **Test**: No test framework configured currently.

## Code Style & Conventions
- **Stack**: Next.js 15 (App Router), React 19, Tailwind CSS 4.x, shadcn/ui.
- **Formatting**: Use 2 spaces indentation. Follow ESLint rules.
- **Naming**: `kebab-case` for files (e.g., `markdown-table-editor.tsx`), `PascalCase` for components.
- **Imports**: Use `@/` alias for project root. prefer named imports.
- **Styling**: Use utility classes via `className`. Merge classes with `cn()` helper.
- **State**: Prefer local React state (`useState`) over global state.
- **Components**: Functional components with strict TypeScript typing for props.
- **Icons**: Use `lucide-react` icons.
- **Error Handling**: Use `try/catch` blocks for async operations; handle UI errors gracefully.
- **Markdown**: Use `unified` ecosystem (remark/rehype) for processing.
