# Known Blockers, Issues & Workarounds

## Current Blockers
(None yet — updated as development progresses)

## Resolved Blockers
(Archived blockers will be listed here for reference)

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
