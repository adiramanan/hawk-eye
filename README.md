# Hawk-Eye

A visual design tool for refining AI-generated React interfaces.

> Use any AI agent to build. Use this tool to design. Keep your own code.

## What is Hawk-Eye?

Hawk-Eye is an embeddable React component that brings direct manipulation (Figma-style) design editing to AI-generated React apps. Change spacing, colors, typography, borders—see instant feedback—then apply changes as real source code to your repository.

### The Problem

AI coding agents like Claude Code, v0, Bolt, and Lovable can generate working React interfaces fast. But iteration is slow:
- Describe changes in natural language → high latency (10s of seconds)
- Edit code directly → requires coding fluency

### The Solution

Hawk-Eye gives designers direct manipulation of live React apps with changes persisted as committable source code.

## Quick Start

### Installation

```bash
# Install packages
pnpm install

# Start development servers (client, plugin, demo)
pnpm dev

# Build all packages
pnpm build

# Type check
pnpm type-check

# Lint and format
pnpm lint
pnpm format
```

### Using in Your React + Vite App

```bash
npm install @hawk-eye/client @hawk-eye/vite-plugin
```

Add the component to your app:

```tsx
import { DesignTool } from '@hawk-eye/client';

export default function Layout({ children }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && <DesignTool />}
    </>
  );
}
```

Add the Vite plugin to your `vite.config.ts`:

```ts
import hawkeyePlugin from '@hawk-eye/vite-plugin';

export default defineConfig({
  plugins: [react(), hawkeyePlugin()],
});
```

Click the trigger icon (bottom-right) to activate inspector mode, then select any element to edit its design properties.

## Architecture

### Monorepo Structure

```
hawk-eye/
├── packages/
│   ├── client/        # @hawk-eye/client — embeddable React component
│   └── vite-plugin/   # @hawk-eye/vite-plugin — Vite dev server plugin
├── demo/              # Example React + Tailwind app
└── docs/              # Documentation
```

### Tech Stack

- **Language:** TypeScript 5.9.2 (strict mode)
- **Node:** 20.x or higher
- **Package Manager:** pnpm workspaces
- **Client Build:** tsup (ESM + CJS)
- **Plugin Build:** tsup
- **Demo Build:** Vite
- **Linting:** ESLint + Prettier
- **Testing:** vitest

## Development Workflow

### Multi-Agent Handoff

This project is developed across multiple AI agents (Claude Code, Gemini Pro, Codex). See [CONTRIBUTING.md](./CONTRIBUTING.md) for the **Agent Handoff Ritual**.

### Phase Timeline

The MVP is structured as 4 sequential phases:

1. **Phase 0 (Setup):** Repository initialization — **IN PROGRESS** ✓
2. **Phase 1 (Inspector):** Element selection & source mapping — next
3. **Phase 2 (Properties):** Visual property editing with live preview
4. **Phase 3 (Writers):** Code mutation & file persistence
5. **Phase 4 (Polish):** Edge cases, docs, public release

Total estimated time: **5–7 weeks** (full-time)

See [.agents/PHASE_STATUS.md](./.agents/PHASE_STATUS.md) for detailed progress.

## Supported Styling Approaches

### MVP (Phase 0–4)

- ✅ **Tailwind CSS** — Token-aware editing with arbitrary values
- ✅ **Inline styles** — Direct CSS property editing

### Post-MVP Roadmap

- v0.2: CSS Modules
- v0.3: styled-components / Emotion
- v0.5: Framework-agnostic design (Vue, Svelte)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Resources

- [Specification](./spec.md) — Full product & technical spec
- [Architecture](./docs/ARCHITECTURE.md) — Deep dive into how Hawk-Eye works
- [Phase Status](./agents/PHASE_STATUS.md) — Current progress
- [Decisions Log](./agents/DECISIONS.md) — Why we made key architectural choices

---

**Built with ❤️ for AI-powered design.**
