# Known Blockers, Issues & Workarounds

## Current Blockers
(None blocking Phase 3.8 or later development)

## Resolved Blockers
(Archived blockers will be listed here for reference)

### 2026-03-17: Phase 3.10 Size & Spacing refinement debt
**Issue:** The initial Size & Spacing redesign shipped with inaccurate docs and incomplete behavior assumptions.

**Resolved in code:**
- Width/height now use four explicit modes: `fixed`, `hug`, `fill`, `relative`
- Size mode semantics round-trip via persisted inline metadata (`--hawk-eye-width-mode`, `--hawk-eye-height-mode`)
- Fixed/Relative numeric values are remembered separately per axis
- Aspect ratio lock is real and derives its locked ratio from the field values at lock time, not from `getBoundingClientRect()`
- Inspector width is fixed to the 320px Figma layout and no longer expands from size-field content
- Single-unit controls now render static `px` labels with no dropdown chevron
- Padding, margin, radius, and stroke-width controls are `px`-only

**Verification:**
- `pnpm type-check`
- `pnpm test`

---

## Recurring Gotchas

### Node Version Compatibility
**Issue:** Older Node versions (<20) may lack ESNext features
**Workaround:** `.nvmrc` enforces Node 20.x, checked on project setup
**Mitigation:** Document Node version requirement in CONTRIBUTING.md

### pnpm Workspace Resolution
**Issue:** Symlinks in monorepo can cause build tool confusion
**Workaround:** Use `pnpm -F @hawk-eye/client build` (filter flag) to target specific workspaces
**Mitigation:** Pre-configure build scripts in root package.json

### Vite Plugin HMR Integration
**Issue:** Plugin file changes may not trigger HMR properly
**Workaround:** Restart dev server if plugin doesn't hot-reload
**Mitigation:** Document restart behavior in CONTRIBUTING.md

---

## Known Limitations (MVP Scope)

### Styling Approaches
- ✅ Tailwind CSS (write support)
- ✅ Inline styles (write support)
- ❌ CSS Modules (inspect-only, no write; deferred to v0.2)
- ❌ styled-components / Emotion (inspect-only, no write; deferred to v0.2)

### Element Types
- ✅ DOM elements (divs, buttons, etc.)
- ❌ Dynamic/conditional rendering (if element is created by condition, data-source may be inaccurate)
- ❌ Shadow DOM elements inside custom web components

### Build Tools
- ✅ Vite (write support)
- ❌ Webpack (deferred to v0.2)
- ❌ Turbopack (deferred)
- ❌ Parcel (deferred)

### Frameworks
- ✅ React (MVP focus)
- ❌ Vue (deferred to v0.8)
- ❌ Svelte (deferred to v0.8)
- ❌ Solid (deferred)

---

## Unresolved Questions
- Project name & npm handle (currently "hawk-eye", "@hawk-eye/")
- Handling clsx/cn conditional classNames (complex parsing)
- Next.js support (many prototypers use it; research needed)

---

## Format for Reporting Issues
When logging a blocker during development:
1. **Issue:** What went wrong?
2. **Reproduction:** How to trigger it?
3. **Expected:** What should happen?
4. **Actual:** What actually happens?
5. **Workaround:** Any temporary fix?
6. **File/Line:** Where did it occur?
7. **Status:** In Progress / Blocked / Resolved

Example:
```
### Issue: Babel transform breaks on arrow function in className
Reproduction: <Component className={() => "p-4"} />
Expected: Transform injects data-source correctly
Actual: Parse error, transform fails silently
Workaround: Use static className string instead
File: packages/vite-plugin/src/source-injector.ts:45
Status: Blocked (needs Babel edge case handling)
```
