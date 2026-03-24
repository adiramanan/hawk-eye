# Claude Bridge

Follow [AGENTS.md](./AGENTS.md).

This repo uses a file-native memory protocol under [`.memory/`](./.memory/), not a command-required workflow. Create or continue session files in [`.memory/sessions/`](./.memory/sessions/), append receipts to [`.memory/receipts.jsonl`](./.memory/receipts.jsonl), and update [`.memory/CURRENT_CONTEXT.md`](./.memory/CURRENT_CONTEXT.md) when closing a session.

## Design System

This project uses a token-based design system for visual consistency and maintainability.

### Token Architecture

The design system uses a 3-layer token architecture:

1. **Layer 1: Upstream Design System Tokens** (`--ds-*` prefix)
   - Primitive values from the base design system
   - Rarely modified
   - Located in `packages/client/src/tokens.css`

2. **Layer 2: Project Aliases** (semantic tokens, no prefix)
   - **Use these in your code**
   - References Layer 1 tokens with fallbacks
   - Examples: `--color-accent`, `--spacing-md`, `--font-size-base`

3. **Layer 3: Component CSS**
   - Component implementations
   - **Never use raw values here** — always reference Layer 2 tokens

### Before Writing UI Code

1. **Read the relevant design spec** in `specs/`:
   - `specs/foundations/color.md` — Color palette and usage
   - `specs/foundations/spacing.md` — Spacing scale
   - `specs/foundations/typography.md` — Font sizes, weights, line heights
   - `specs/foundations/radius.md` — Border radius scale
   - `specs/foundations/elevation.md` — Shadow system
   - `specs/foundations/motion.md` — Animations and transitions

2. **Check the token reference** at `specs/tokens/token-reference.md`

3. **Use only Layer 2 token aliases** — never hardcode values:
   ```css
   /* ✅ Good */
   .element {
     color: var(--color-text-primary);
     padding: var(--spacing-md);
     border-radius: var(--radius-sm);
   }

   /* ❌ Bad */
   .element {
     color: #f8f8f8;
     padding: 12px;
     border-radius: 4px;
   }
   ```

4. **Run the token audit** before committing:
   ```bash
   npm run token-audit
   ```
   This checks for hardcoded values and suggests the correct tokens.

5. **Zero errors required** — the audit must pass with no violations.

### Key Files

- `packages/client/src/tokens.css` — All token definitions (3 layers)
- `specs/` — Design documentation and guidelines
- `scripts/token-audit.js` — Linting script for CI/CD integration
- `packages/client/src/tokens-mapping.ts` — Legacy variable mappings

### Adding New Tokens

If you need a new token:

1. **Define it in Layer 1** (`tokens.css`) under `--ds-*`
2. **Add a Layer 2 alias** (semantic name)
3. **Document it** in the relevant spec file (`specs/foundations/`)
4. **Update** `specs/tokens/token-reference.md`
5. **Run the audit** to verify usage

### Common Token Usage Patterns

**Colors**: `--color-*` (text, background, borders, interactive states)
- Example: `background: var(--color-bg);`

**Spacing**: `--spacing-*` (4px scale: xs, sm, base, md, lg, xl, 2xl, 3xl)
- Example: `padding: var(--spacing-lg);`

**Typography**: `--font-*` (sizes, weights, families, line heights)
- Example: `font-size: var(--font-size-base);`

**Border Radius**: `--radius-*` (xs, sm, md, lg, full)
- Example: `border-radius: var(--radius-md);`

**Shadows**: `--shadow-*` (sm, md, lg, xl)
- Example: `box-shadow: var(--shadow-md);`

**Motion**: `--duration-*` and `--easing-*`
- Example: `transition: all var(--duration-base) var(--easing-standard);`

### CI/CD Integration

The token audit script returns exit code:
- `0` — No violations (all values use tokens)
- `1` — Violations found (hardcoded values present)
- `2` — Script error

This can be integrated into CI pipelines to enforce compliance.
