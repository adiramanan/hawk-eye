export const hawkEyeStyles = `
  :host {
    all: initial;
    --he-bg:              rgba(0, 0, 0, 0.85);
    --he-panel-border:    #595959;
    --he-divider:         #595959;
    --he-input:           #3b3b3b;
    --he-input-hover:     #484848;
    --he-fg:              #fcfcfc;
    --he-label:           #bcbcbc;
    --he-muted:           #666;
    --he-section-title:   #bcbcbc;
    --he-accent:          #0d87f7;
    --he-dirty:           #f59e0b;
    --he-dirty-bg:        rgba(245, 158, 11, 0.12);
    --he-dirty-border:    rgba(245, 158, 11, 0.4);
    --he-destructive:     #ef4444;
    --he-destructive-border: rgba(239, 68, 68, 0.5);
    --he-trigger-bg:      #3d3d3d;
    --he-trigger-hover:   #4a4a4a;
    --he-ring:            #0d87f7;
    --he-font-ui:         -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif;
    --he-font-mono:       ui-monospace, "SFMono-Regular", "Menlo", monospace;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  [data-hawk-eye-ui="root"] {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    pointer-events: none;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
  }

  [data-hawk-eye-ui="surface"] {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* ── Element outline & measure ──────────────────────────────── */

  [data-hawk-eye-ui="outline"] {
    position: fixed;
    border: 2px solid var(--he-accent);
    border-radius: 3px;
    background: rgba(0, 102, 255, 0.05);
    pointer-events: none;
  }

  [data-hawk-eye-ui="measure"] {
    position: fixed;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 7px;
    border-radius: 4px;
    background: #1e1e1e;
    color: #ffffff;
    font-family: var(--he-font-mono);
    font-size: 11px;
    white-space: nowrap;
  }

  /* ── Panel ───────────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel"] {
    position: fixed;
    display: flex;
    flex-direction: column;
    width: min(320px, calc(100vw - 32px));
    height: calc(100vh - 64px);
    min-width: min(320px, calc(100vw - 32px));
    max-width: min(320px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    overflow: hidden;
    border-radius: 20px;
    background: var(--he-bg);
    border: 1px solid var(--he-panel-border);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.6),
      0 8px 32px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
  }

  [data-hawk-eye-ui="panel"]::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    backdrop-filter: blur(5px);
    pointer-events: none;
    z-index: -1;
  }

  [data-hawk-eye-ui="panel-body"] {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ── Panel drag header ───────────────────────────────────────── */

  [data-hawk-eye-ui="panel-drag-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 14px;
    cursor: grab;
    flex-shrink: 0;
    user-select: none;
  }

  [data-hawk-eye-ui="panel-drag-header"]:active {
    cursor: grabbing;
  }

  [data-hawk-eye-ui="panel-leading-spacer"] {
    display: inline-flex;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="panel-title"] {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.02em;
    text-align: center;
  }

  [data-hawk-eye-ui="panel-brand"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  [data-hawk-eye-ui="panel-brand-mark"] {
    display: inline-flex;
    align-items: center;
    color: var(--he-fg);
    opacity: 0.88;
  }

  [data-hawk-eye-ui="panel-brand-copy"] {
    display: inline-flex;
    align-items: center;
  }

  [data-hawk-eye-ui="panel-close-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--he-label);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="panel-close-btn"]:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="panel-close-btn"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="panel-back-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid #595959;
    border-radius: 4px;
    background: #373737;
    color: var(--he-fg);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="panel-back-btn"]:hover {
    background: #444444;
  }

  /* ── Panel footer ────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-footer"] {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-top: 1px solid var(--he-panel-border);
    background: var(--he-bg);
    flex-shrink: 0;
    border-radius: 0 0 20px 20px;
  }

  [data-hawk-eye-ui="footer-changes-btn"] {
    flex: 1;
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: #f5f5f5;
    color: #111111;
    font-family: var(--he-font-ui);
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    text-align: left;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="footer-changes-btn"]:hover {
    background: #ffffff;
  }

  [data-hawk-eye-ui="footer-actions"] {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="footer-apply-btn"] {
    flex: 1 1 0;
    min-height: 43px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: #e1f1ff;
    color: #007ef4;
    font-family: var(--he-font-ui);
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="footer-apply-btn"]:hover {
    background: #cce8ff;
  }

  [data-hawk-eye-ui="footer-apply-btn"]:disabled {
    cursor: progress;
    opacity: 0.5;
  }

  [data-hawk-eye-ui="panel-footer"] [data-hawk-eye-ui="footer-apply-btn"]:only-child {
    flex: 1;
  }

  [data-hawk-eye-ui="footer-revert-btn"] {
    flex: 1 1 0;
    min-height: 43px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: #f5f5f5;
    color: #111111;
    font-family: var(--he-font-ui);
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="footer-revert-btn"]:hover {
    background: #e8e8e8;
  }

  [data-hawk-eye-ui="footer-reset-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--he-label);
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="footer-reset-btn"]:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="footer-icon-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    min-width: 44px;
    height: 43px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: #3b3b3b;
    color: var(--he-fg);
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="footer-icon-btn"]:hover {
    background: #484848;
  }

  [data-hawk-eye-ui="footer-status"] {
    width: 100%;
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    line-height: 1.4;
  }

  [data-hawk-eye-ui="footer-status"][data-state="success"] { color: #16a34a; }
  [data-hawk-eye-ui="footer-status"][data-state="error"]   { color: #dc2626; }
  [data-hawk-eye-ui="footer-status"][data-state="pending"] { color: #d97706; }

  [data-hawk-eye-ui="panel-footer-status"] {
    padding: 0 16px 12px;
  }

  [data-hawk-eye-ui="close-guard-backdrop"] {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 16px;
    background: rgba(8, 8, 8, 0.68);
    backdrop-filter: blur(6px);
    z-index: 30;
  }

  [data-hawk-eye-ui="close-guard-dialog"] {
    width: 100%;
    display: grid;
    gap: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    background: rgba(35, 35, 35, 0.98);
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  [data-hawk-eye-ui="close-guard-title"] {
    margin: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
  }

  [data-hawk-eye-ui="close-guard-body"] {
    margin: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    line-height: 1.45;
  }

  [data-hawk-eye-ui="close-guard-actions"] {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
    gap: 8px;
    align-items: stretch;
  }

  /* ── Changes view ────────────────────────────────────────────── */

  [data-hawk-eye-ui="changes-view"] {
    display: grid;
    gap: 16px;
    padding: 16px;
    background: none;
  }

  /* ── Panel header ────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-header"] {
    display: grid;
    gap: 0;
    padding: 12px 12px 0;
    border-bottom: 1px solid var(--he-divider);
    margin-bottom: 0;
  }

  [data-hawk-eye-ui="eyebrow"] {
    margin: 0 0 4px;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
  }

  [data-hawk-eye-ui="title-row"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  [data-hawk-eye-ui="title"] {
    margin: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
  }

  [data-hawk-eye-ui="panel-meta"] {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 0 16px 12px;
  }

  [data-hawk-eye-ui="panel-meta-btn"] {
    padding: 6px 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: #3b3b3b;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 11px;
    cursor: pointer;
  }

  [data-hawk-eye-ui="panel-meta-btn"]:hover {
    background: #484848;
  }

  [data-hawk-eye-ui="detail-list"] {
    display: grid;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    border: none;
    background: none;
  }

  [data-hawk-eye-ui="inspector-actions"] {
    display: grid;
    gap: 6px;
    padding-bottom: 10px;
  }

  [data-hawk-eye-ui="status-note"] {
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    line-height: 1.5;
  }

  [data-hawk-eye-ui="status-note"][data-state="success"] {
    color: #16a34a;
  }

  [data-hawk-eye-ui="status-note"][data-state="error"] {
    color: #dc2626;
  }

  [data-hawk-eye-ui="status-note"][data-state="pending"] {
    color: #d97706;
  }

  /* ── Toolbar / search ────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-toolbar"] {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--he-divider);
    background: var(--he-bg);
  }

  [data-hawk-eye-ui="search-shell"] {
    display: grid;
    gap: 6px;
  }

  [data-hawk-eye-ui="search-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="search-row"] {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    gap: 6px;
    align-items: center;
  }

  [data-hawk-eye-ui="search-icon"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    border-radius: 4px;
    background: var(--he-input);
    color: var(--he-label);
    font-family: var(--he-font-mono);
    font-size: 11px;
  }

  [data-hawk-eye-ui="search-meta"] {
    margin: 0;
    color: var(--he-muted);
    font-family: var(--he-font-mono);
    font-size: 10px;
  }

  /* ── Property stack ──────────────────────────────────────────── */

  [data-hawk-eye-ui="property-stack"] {
    display: grid;
    gap: 0;
  }

  [data-hawk-eye-ui="property-group"],
  [data-hawk-eye-ui="search-empty"] {
    display: grid;
    gap: 0;
    padding: 0;
    background: none;
    border: none;
  }

  [data-hawk-eye-ui="changes-section"] {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--he-divider);
    background: none;
    border-bottom: none;
    border-left: none;
    border-right: none;
  }

  [data-hawk-eye-ui="group-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 12px;
  }

  [data-hawk-eye-ui="group-title"] {
    margin: 0;
    color: var(--he-section-title);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: -0.25px;
    text-transform: none;
  }

  [data-hawk-eye-ui="control-grid"] {
    display: grid;
    gap: 4px 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 6px 12px 10px;
  }

  [data-hawk-eye-ui="section-count"] {
    display: none;
  }

  /* ── Individual property control (no card borders) ────────────── */

  [data-hawk-eye-ui="opacity-control"] {
    display: grid;
    gap: 4px;
  }

  [data-hawk-eye-ui="control"] {
    display: grid;
    gap: 3px;
    padding: 0;
    border-radius: 0;
    background: transparent;
    border: none;
  }

  [data-hawk-eye-ui="control"][data-dirty="true"] {
    border: none;
    box-shadow: none;
  }

  [data-hawk-eye-ui="control"][data-dirty="true"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="control"][data-dirty="true"] [data-hawk-eye-ui="select-input"] {
    background: var(--he-dirty-bg);
    border: 1px solid var(--he-dirty-border);
  }

  [data-hawk-eye-ui="control"][data-invalid="true"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="control"][data-invalid="true"] [data-hawk-eye-ui="select-input"] {
    border: 1px solid var(--he-destructive-border);
  }

  [data-hawk-eye-ui="control"][data-compact="true"] {
    padding: 0;
  }

  [data-hawk-eye-ui="control-head"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }

  [data-hawk-eye-ui="control-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-hawk-eye-ui="control-meta"] {
    display: none;
  }

  /* ── Inputs ──────────────────────────────────────────────────── */

  [data-hawk-eye-ui="text-input"] {
    width: 100%;
    min-height: 32px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--he-input);
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    letter-spacing: -0.25px;
    transition: border-color 100ms ease, background 100ms ease;
  }

  [data-hawk-eye-ui="text-input"]:hover {
    background: var(--he-input-hover);
  }

  [data-hawk-eye-ui="text-input"]:focus-visible {
    outline: none;
    border-color: var(--he-ring);
    background: var(--he-bg);
    box-shadow: 0 0 0 2px rgba(13, 135, 247, 0.2);
  }

  [data-hawk-eye-ui="text-input"]:disabled {
    cursor: not-allowed;
    color: var(--he-muted);
    background: var(--he-input);
    opacity: 0.6;
  }

  [data-hawk-eye-ui="range-input"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="opacity-row"] {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, 1fr) 72px;
    align-items: center;
  }

  [data-hawk-eye-ui="range-input"] {
    width: 100%;
    accent-color: var(--he-accent);
  }

  [data-hawk-eye-ui="section-stack"] {
    display: grid;
    gap: 12px;
    padding: 0;
    min-width: 0;
  }

  [data-hawk-eye-ui="section-grid"] {
    display: grid;
    gap: 4px 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 6px 12px 10px;
  }

  [data-hawk-eye-ui="section-grid"] > [data-hawk-eye-ui="control"][data-span="full"] {
    grid-column: 1 / -1;
  }

  /* ── Shadow editor ───────────────────────────────────────────── */

  [data-hawk-eye-ui="shadow-editor"] {
    display: grid;
    gap: 6px;
  }

  [data-hawk-eye-ui="shadow-grid"] {
    display: grid;
    gap: 4px 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  [data-hawk-eye-ui="shadow-field"] {
    display: grid;
    gap: 3px;
  }

  [data-hawk-eye-ui="shadow-color-row"] {
    display: grid;
    gap: 6px;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    align-items: center;
  }

  /* ── Number input row ────────────────────────────────────────── */

  [data-hawk-eye-ui="number-input-row"] {
    display: grid;
    gap: 4px;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  [data-hawk-eye-ui="number-input-row"] [data-hawk-eye-ui="select-input"] {
    min-width: 0;
    width: auto;
    padding-right: 18px;
  }

  /* Hide the unit dropdown for properties that have a fixed unit */
  [data-hawk-eye-control="opacity-unit"] {
    display: none;
  }

  /* ── Buttons ─────────────────────────────────────────────────── */

  [data-hawk-eye-ui="control-reset"],
  [data-hawk-eye-ui="primary-button"],
  [data-hawk-eye-ui="secondary-button"],
  [data-hawk-eye-ui="pill-button"] {
    border: 0;
    border-radius: 6px;
    cursor: pointer;
    font-family: var(--he-font-ui);
    font-size: 11px;
  }

  [data-hawk-eye-ui="control-reset"],
  [data-hawk-eye-ui="pill-button"] {
    padding: 3px 7px;
    background: var(--he-input);
    color: var(--he-label);
  }

  [data-hawk-eye-ui="control-reset"]:hover,
  [data-hawk-eye-ui="pill-button"]:hover {
    background: var(--he-input-hover);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="primary-button"],
  [data-hawk-eye-ui="secondary-button"] {
    min-height: 30px;
    padding: 0 12px;
    font-weight: 500;
    font-size: 12px;
  }

  [data-hawk-eye-ui="primary-button"] {
    background: #eeeeee;
    color: #111111;
  }

  [data-hawk-eye-ui="primary-button"]:hover {
    background: #d4d4d4;
  }

  [data-hawk-eye-ui="secondary-button"] {
    background: var(--he-input);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="secondary-button"]:hover {
    background: var(--he-input-hover);
  }

  [data-hawk-eye-ui="primary-button"]:disabled,
  [data-hawk-eye-ui="secondary-button"]:disabled {
    cursor: progress;
    opacity: 0.5;
  }

  /* ── Pending changes ─────────────────────────────────────────── */

  [data-hawk-eye-ui="changes-list"] {
    display: grid;
    gap: 6px;
  }

  [data-hawk-eye-ui="changes-card"] {
    display: grid;
    gap: 8px;
    padding: 10px;
    border-radius: 8px;
    background: var(--he-input);
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
  }

  [data-hawk-eye-ui="changes-card-header"] {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  [data-hawk-eye-ui="changes-card-copy"] {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  [data-hawk-eye-ui="changes-card-source"] {
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    line-height: 1.2;
  }

  [data-hawk-eye-ui="changes-card-tag"] {
    color: #dddddd;
    font-family: var(--he-font-ui);
    font-size: 11px;
  }

  [data-hawk-eye-ui="changes-card-actions"] {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  [data-hawk-eye-ui="changes-count"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 4px;
    background: #ffffff;
    color: #3b3b3b;
    font-family: var(--he-font-ui);
    font-size: 11px;
  }

  [data-hawk-eye-ui="changes-reset-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--he-label);
    cursor: pointer;
    border-radius: 6px;
  }

  [data-hawk-eye-ui="changes-reset-btn"]:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="changes-card-body"] {
    display: grid;
    gap: 6px;
  }

  [data-hawk-eye-ui="changes-card-row"] {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }

  [data-hawk-eye-ui="changes-card-label"] {
    color: #dddddd;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
  }

  [data-hawk-eye-ui="changes-card-value"] {
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    word-break: break-word;
  }

  [data-hawk-eye-ui="changes-card-overlay"] {
    position: absolute;
    inset: auto 0 0 0;
    min-height: 78px;
    background:
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.06), transparent 30%),
      rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
  }

  [data-hawk-eye-ui="changes-overlay-actions"] {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  [data-hawk-eye-ui="overlay-reset-btn"],
  [data-hawk-eye-ui="overlay-keep-btn"] {
    min-width: 54px;
    min-height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: 6px;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    cursor: pointer;
  }

  [data-hawk-eye-ui="overlay-reset-btn"] {
    background: #3b3b3b;
    color: #ffffff;
  }

  [data-hawk-eye-ui="overlay-keep-btn"] {
    background: #e1f1ff;
    color: #007ef4;
  }

  /* ── Inspector detail list ───────────────────────────────────── */

  [data-hawk-eye-ui="detail"] {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 4px;
    align-items: baseline;
  }

  [data-hawk-eye-ui="label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="value"] {
    color: var(--he-fg);
    font-family: var(--he-font-mono);
    font-size: 11px;
    line-height: 1.4;
    word-break: break-word;
  }

  [data-hawk-eye-ui="hint"] {
    margin: 12px;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 12px;
    line-height: 1.5;
  }

  [data-hawk-eye-ui="empty-state"] {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 100%;
    padding: 24px 20px;
    text-align: center;
  }

  [data-hawk-eye-ui="empty-state-icon"] {
    color: var(--he-muted);
    opacity: 0.5;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="empty-state-title"] {
    margin: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: 600;
  }

  [data-hawk-eye-ui="empty-state-body"] {
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 12px;
    line-height: 1.6;
  }

  /* ── Trigger button ──────────────────────────────────────────── */

  [data-hawk-eye-ui="trigger"] {
    position: fixed;
    right: 24px;
    bottom: 24px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 999px;
    background: var(--he-trigger-bg);
    color: #ffffff;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.24);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: 500;
    transition: background 120ms ease, transform 120ms ease;
  }

  [data-hawk-eye-ui="trigger"]:hover {
    background: var(--he-trigger-hover);
    transform: translateY(-1px);
  }

  [data-hawk-eye-ui="trigger"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 3px;
  }

  [data-hawk-eye-ui="trigger-dot"] {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #ffffff;
    opacity: 0.7;
  }

  /* ── Select input ────────────────────────────────────────────── */

  [data-hawk-eye-ui="select-input"] {
    width: 100%;
    min-height: 32px;
    padding: 8px 26px 8px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--he-input);
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    letter-spacing: -0.25px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%238c8c8c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    transition: border-color 100ms ease, background 100ms ease;
  }

  [data-hawk-eye-ui="select-input"]:hover {
    background-color: var(--he-input-hover);
  }

  [data-hawk-eye-ui="select-input"]:focus-visible {
    outline: none;
    border-color: var(--he-ring);
    background-color: var(--he-bg);
    box-shadow: 0 0 0 2px rgba(13, 135, 247, 0.2);
  }

  /* ── Segmented control ───────────────────────────────────────── */

  [data-hawk-eye-ui="segmented-row"] {
    display: flex;
    gap: 0;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid transparent;
    background: var(--he-input);
  }

  [data-hawk-eye-ui="segmented-button"] {
    flex: 1;
    min-height: 28px;
    padding: 0 4px;
    border: 0;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
    background: transparent;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="segmented-button"]:last-child {
    border-right: 0;
  }

  [data-hawk-eye-ui="segmented-button"][data-active="true"] {
    background: #505050;
    color: var(--he-fg);
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  [data-hawk-eye-ui="segmented-button"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: -2px;
  }

  /* ── Toggle control ──────────────────────────────────────────── */

  [data-hawk-eye-ui="toggle-row"] {
    display: flex;
    gap: 0;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid transparent;
    background: var(--he-input);
  }

  [data-hawk-eye-ui="toggle-button"] {
    flex: 1;
    min-height: 28px;
    padding: 0 8px;
    border: 0;
    background: transparent;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="toggle-button"][data-active="true"] {
    background: #505050;
    color: var(--he-fg);
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  [data-hawk-eye-ui="toggle-button"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: -2px;
  }

  /* ── Color input ─────────────────────────────────────────────── */

  [data-hawk-eye-ui="color-row"] {
    display: flex;
    gap: 4px;
    align-items: center;
    background: var(--he-input);
    border-radius: 8px;
    padding: 8px;
    min-height: 32px;
    border: 1px solid transparent;
    transition: border-color 100ms ease, background 100ms ease;
  }

  [data-hawk-eye-ui="color-swatch"] {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
  }

  [data-hawk-eye-ui="color-row"] [data-hawk-eye-ui="text-input"] {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    min-height: 0;
    box-shadow: none;
  }

  /* ── Collapsible section ─────────────────────────────────────── */

  /* ── Labelled two-column layout ─────────────────────────────────── */

  [data-hawk-eye-ui="labelled-row"] {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-items: end;
  }

  [data-hawk-eye-ui="labelled-col"] {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  [data-hawk-eye-ui="labelled-single"] {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  [data-hawk-eye-ui="input-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.25px;
  }

  [data-hawk-eye-ui="grid-track-editor"] {
    display: grid;
    gap: 8px;
  }

  [data-hawk-eye-ui="grid-track-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  [data-hawk-eye-ui="grid-track-title"] {
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.25px;
  }

  [data-hawk-eye-ui="grid-track-list"] {
    display: grid;
    gap: 8px;
  }

  [data-hawk-eye-ui="grid-track-row"] {
    display: grid;
    grid-template-columns: 18px 90px minmax(0, 1fr) 28px;
    gap: 8px;
    align-items: center;
  }

  [data-hawk-eye-ui="grid-track-index"] {
    color: var(--he-muted);
    font-family: var(--he-font-ui);
    font-size: 12px;
    line-height: 1;
    text-align: center;
  }

  [data-hawk-eye-ui="grid-track-editor"] [data-hawk-eye-ui="select-input"] {
    min-height: 32px;
  }

  [data-hawk-eye-ui="grid-track-value-shell"] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
    align-items: center;
    min-height: 32px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--he-input);
    transition: border-color 100ms ease, background 100ms ease, box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="grid-track-value-shell"]:hover {
    background: var(--he-input-hover);
  }

  [data-hawk-eye-ui="grid-track-value-shell"]:focus-within {
    border-color: var(--he-ring);
    background: var(--he-bg);
    box-shadow: 0 0 0 2px rgba(13, 135, 247, 0.2);
  }

  [data-hawk-eye-ui="grid-track-value-input"] {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.25px;
  }

  [data-hawk-eye-ui="grid-track-value-input"]:focus-visible {
    outline: none;
  }

  [data-hawk-eye-ui="grid-track-unit"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 13px;
    letter-spacing: -0.2px;
  }

  [data-hawk-eye-ui="grid-track-icon-button"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: var(--he-input);
    color: var(--he-fg);
    cursor: pointer;
    font-family: var(--he-font-ui);
    font-size: 20px;
    line-height: 1;
    transition: background 100ms ease, color 100ms ease, opacity 100ms ease;
  }

  [data-hawk-eye-ui="grid-track-icon-button"]:hover {
    background: var(--he-input-hover);
  }

  [data-hawk-eye-ui="grid-track-icon-button"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(13, 135, 247, 0.25);
  }

  [data-hawk-eye-ui="grid-track-icon-button"]:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  [data-hawk-eye-ui="grid-track-editor"][data-dirty="true"] [data-hawk-eye-ui="select-input"],
  [data-hawk-eye-ui="grid-track-editor"][data-dirty="true"] [data-hawk-eye-ui="grid-track-value-shell"] {
    background: var(--he-dirty-bg);
    border-color: var(--he-dirty-border);
  }

  [data-hawk-eye-ui="grid-track-editor"][data-invalid="true"] [data-hawk-eye-ui="select-input"],
  [data-hawk-eye-ui="grid-track-editor"][data-invalid="true"] [data-hawk-eye-ui="grid-track-value-shell"] {
    border-color: var(--he-destructive-border);
  }

  [data-hawk-eye-ui="grid-track-helper"] {
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    letter-spacing: -0.2px;
    line-height: 1.4;
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="number-input-row"] {
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--he-input);
    transition: background 100ms ease, border-color 100ms ease, box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="number-input-row"]:hover {
    background: var(--he-input-hover);
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="number-input-row"]:focus-within {
    border-color: var(--he-ring);
    box-shadow: 0 0 0 2px rgba(13, 135, 247, 0.2);
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="text-input"] {
    min-height: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    font-size: 13.5px;
    line-height: normal;
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="text-input"]:hover,
  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="text-input"]:focus-visible {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="input-unit-label"] {
    color: var(--he-label);
    font-size: 13.5px;
    line-height: normal;
  }

  [data-hawk-eye-ui="compact-card"][data-property-id="opacity"][data-dirty="true"] [data-hawk-eye-ui="number-input-row"] {
    background: var(--he-dirty-bg);
    border-color: var(--he-dirty-border);
  }

  [data-hawk-eye-ui="compact-card"][data-property-id="opacity"][data-invalid="true"] [data-hawk-eye-ui="number-input-row"] {
    border-color: var(--he-destructive-border);
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="mixBlendMode"] [data-hawk-eye-ui="select-input"] {
    min-height: 32px;
    padding: 8px 26px 8px 10px;
    font-size: 13.5px;
    line-height: normal;
  }

  /* ── Static (non-collapsible) section ───────────────────────────── */

  [data-hawk-eye-ui="static-section"] {
    border-bottom: 1px solid var(--he-divider);
  }

  [data-hawk-eye-ui="static-section"]:last-child {
    border-bottom: none;
  }

  [data-hawk-eye-ui="static-section-header"] {
    display: flex;
    align-items: center;
    padding: 16px 16px 12px;
  }

  [data-hawk-eye-ui="static-section-body"] {
    padding: 0 16px 16px;
  }

  /* ── (Legacy) collapsible section ───────────────────────────────── */

  [data-hawk-eye-ui="collapsible-section"] {
    border-radius: 0;
    background: transparent;
    border: none;
    border-top: 1px solid var(--he-divider);
    overflow: visible;
  }

  [data-hawk-eye-ui="collapsible-section"]:first-child {
    border-top: none;
  }

  [data-hawk-eye-ui="collapsible-header"] {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px 8px;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  [data-hawk-eye-ui="collapsible-header"]:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  [data-hawk-eye-ui="collapsible-header"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: -2px;
  }

  [data-hawk-eye-ui="collapsible-chevron"] {
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 4px solid var(--he-label);
    border-top: 3px solid transparent;
    border-bottom: 3px solid transparent;
    transition: transform 100ms ease;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="collapsible-section"][data-expanded="true"]
    [data-hawk-eye-ui="collapsible-chevron"] {
    transform: rotate(90deg);
  }

  [data-hawk-eye-ui="collapsible-header"] [data-hawk-eye-ui="group-title"] {
    flex: 1;
  }

  [data-hawk-eye-ui="section-heading"] {
    display: grid;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }

  [data-hawk-eye-ui="section-subtitle"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    line-height: 1.3;
    font-weight: 400;
  }

  [data-hawk-eye-ui="collapsible-action"] {
    margin-left: auto;
  }

  [data-hawk-eye-ui="collapsible-body"] {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 180ms ease;
    overflow: hidden;
  }

  [data-hawk-eye-ui="collapsible-body"][data-expanded="true"] {
    grid-template-rows: 1fr;
  }

  [data-hawk-eye-ui="collapsible-body-inner"] {
    min-height: 0;
  }

  /* ── Per-side control ────────────────────────────────────────── */

  /* ── Per-side control (Stroke Weight) ────────────────────────── */

  [data-hawk-eye-ui="per-side-control"] {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  [data-hawk-eye-ui="per-side-row"] {
    display: flex;
    align-items: stretch;
    gap: 6px;
  }

  /* Mode dropdown: "All" / "Each" — narrow version of select-input */
  [data-hawk-eye-ui="per-side-row"] [data-hawk-eye-ui="select-input"] {
    width: auto;
    min-width: 0;
    max-width: 72px;
    flex-shrink: 0;
    padding-right: 22px;
  }

  /* "All" mode: single value + unit label */
  [data-hawk-eye-ui="per-side-all-input"] {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--he-input);
    border-radius: 8px;
    padding: 8px 10px;
    min-height: 32px;
    min-width: 0;
  }

  [data-hawk-eye-ui="per-side-all-input"] [data-hawk-eye-ui="text-input"] {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    min-height: 0;
    box-shadow: none;
  }

  /* "Each" mode: 4 separate rounded pill inputs */
  [data-hawk-eye-ui="per-side-each-pills"] {
    flex: 1;
    display: flex;
    gap: 4px;
    min-width: 0;
  }

  [data-hawk-eye-ui="per-side-pill"] {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--he-input);
    border-radius: 8px;
    padding: 8px 6px;
    min-width: 0;
    min-height: 32px;
  }

  [data-hawk-eye-ui="per-side-pill"] [data-hawk-eye-ui="text-input"] {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    min-height: 0;
    box-shadow: none;
    font-size: 12px;
  }

  /* Link / Broken-link toggle button for per-side controls */
  [data-hawk-eye-ui="link-toggle-btn"] {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 6px;
    border: none;
    border-radius: 8px;
    background: #3b3b3b;
    color: #bcbcbc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  [data-hawk-eye-ui="link-toggle-btn"][data-linked="true"] {
    background: #e1f1ff;
    color: #0d87f7;
  }

  [data-hawk-eye-ui="link-toggle-btn"]:hover {
    background: #4a4a4a;
  }

  [data-hawk-eye-ui="link-toggle-btn"][data-linked="true"]:hover {
    background: #c4e4ff;
  }

  [data-hawk-eye-ui="link-toggle-btn"] svg {
    width: 20px;
    height: 20px;
  }

  /* Unit label: muted "px" / "em" etc */
  [data-hawk-eye-ui="input-unit-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 13px;
    letter-spacing: -0.25px;
    white-space: nowrap;
    flex-shrink: 0;
    pointer-events: none;
  }

  /* ── Scrub label ─────────────────────────────────────────────── */

  [data-hawk-eye-ui="scrub-label"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    min-height: 20px;
    padding: 0 3px;
    border-radius: 3px;
    cursor: ew-resize;
    user-select: none;
    color: var(--he-label);
    font-family: var(--he-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    flex-shrink: 0;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="scrub-label"]:hover {
    background: var(--he-input);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="number-input-with-scrub"] {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 2px;
    align-items: center;
  }

  [data-hawk-eye-ui="number-input-with-scrub"][data-scrubbing="true"] [data-hawk-eye-ui="scrub-label"] {
    background: var(--he-accent);
    color: #ffffff;
  }

  [data-hawk-eye-ui="number-input-with-scrub"] [data-hawk-eye-ui="select-input"] {
    min-height: 32px;
    font-size: 12px;
    padding: 0 20px 0 6px;
  }

  /* ── Compact row (2-col paired inputs) ────────────────────────── */

  [data-hawk-eye-ui="compact-row"] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  [data-hawk-eye-ui="compact-row-full"] {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
  }

  [data-hawk-eye-ui="size-input-row"] {
    display: flex;
    flex-direction: column;
  }

  [data-hawk-eye-ui="size-row-with-lock"] {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    width: 100%;
    min-width: 0;
  }

  [data-hawk-eye-ui="size-input-flex"] {
    flex: 1;
    min-width: 0;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"] {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 6px;
    border: none;
    border-radius: 8px;
    background: #3b3b3b;
    color: #bcbcbc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"][data-locked="true"] {
    background: #e1f1ff;
    color: #0d87f7;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"]:hover {
    background: #4a4a4a;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"][data-locked="true"]:hover {
    background: #c4e4ff;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"] svg {
    width: 100%;
    height: 100%;
  }


  [data-hawk-eye-ui="size-input-wrapper"] {
    display: flex;
    min-width: 0;
    position: relative;
    width: 100%;
  }

  [data-hawk-eye-ui="size-input-pill"] {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: #3b3b3b;
    overflow: hidden;
    transition: background 100ms ease, box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="size-input-label"] {
    flex-shrink: 0;
    color: #bcbcbc;
    font-size: 13.5px;
    font-family: var(--he-font-ui);
    letter-spacing: -0.25px;
    width: 12px;
    text-align: center;
  }

  [data-hawk-eye-ui="size-input-token"] {
    flex: 1;
    min-width: 0;
    color: white;
    font-size: 13.5px;
    font-family: var(--he-font-ui);
    letter-spacing: -0.25px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-hawk-eye-ui="size-input-token-trigger"] {
    align-items: center;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    flex: 1;
    gap: 4px;
    min-width: 0;
    padding: 0;
  }

  [data-hawk-eye-ui="size-input-token-chevron"] {
    color: #bcbcbc;
    display: flex;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="size-input-token-trigger"]:hover,
  [data-hawk-eye-ui="size-input-menu-button"]:hover {
    opacity: 0.85;
  }

  [data-hawk-eye-ui="size-input-menu-button"] {
    align-items: center;
    background: transparent;
    border: none;
    color: #bcbcbc;
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    padding: 0;
    width: 12px;
    height: 12px;
  }

  [data-hawk-eye-ui="size-input-value-input"] {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: white;
    font-size: 13.5px;
    font-family: var(--he-font-ui);
    min-width: 28px;
  }

  [data-hawk-eye-ui="size-input-value-input"]::placeholder {
    color: #bcbcbc;
  }

  [data-hawk-eye-ui="size-input-unit-text"] {
    flex-shrink: 0;
    color: #bcbcbc;
    font-size: 13.5px;
    font-family: var(--he-font-ui);
    white-space: nowrap;
  }

  [data-hawk-eye-ui="size-input-pill"]:focus-within {
    background: #434343;
    box-shadow: 0 0 0 2px rgba(13, 135, 247, 0.24);
  }

  [data-hawk-eye-ui="size-input-value-input"]:focus-visible,
  [data-hawk-eye-ui="size-input-token-trigger"]:focus-visible,
  [data-hawk-eye-ui="size-input-menu-button"]:focus-visible {
    outline: none;
  }

  [data-hawk-eye-ui="size-input-menu"] {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    z-index: 12;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 120px;
    padding: 8px 10px;
    border: 1px solid #595959;
    border-radius: 8px;
    background: #3b3b3b;
    box-shadow:
      0 3px 6px rgba(0, 0, 0, 0.01),
      0 11px 11px rgba(0, 0, 0, 0.01),
      0 24px 14px rgba(0, 0, 0, 0.01);
  }

  [data-hawk-eye-ui="size-input-menu-option"] {
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: white;
    cursor: pointer;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.25px;
    text-align: left;
  }

  [data-hawk-eye-ui="size-input-menu-option"][data-selected="true"] {
    color: #ffffff;
  }

  [data-hawk-eye-ui="size-input-menu-option"]:hover {
    color: #ffffff;
    opacity: 0.85;
  }

  [data-hawk-eye-ui="size-input-menu-option"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* ── Typography sub-labels ──────────────────────────────────────── */

  [data-hawk-eye-ui="typo-label-row"] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
    margin-bottom: -2px;
  }

  [data-hawk-eye-ui="typo-label-row"] span {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.01em;
    padding-left: 8px;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="typo-align-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: -2px;
  }

  [data-hawk-eye-ui="typo-section-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.01em;
    padding-left: 8px;
    text-transform: uppercase;
  }

  /* ── Icon segmented control (text-align, etc.) ──────────────────── */

  [data-hawk-eye-ui="icon-segmented"] {
    display: flex;
    gap: 0;
    background: var(--he-input);
    border-radius: 8px;
    overflow: hidden;
    padding: 0;
  }

  [data-hawk-eye-ui="icon-seg-btn"] {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 6px 4px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--he-label);
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="icon-seg-btn"]:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="icon-seg-btn"][data-active="true"] {
    background: #ffffff;
    color: #111111;
    border: none;
    border-radius: 8px;
  }

  /* ── Compact card (individual property in new panel) ──────────── */

  [data-hawk-eye-ui="compact-card"] {
    display: grid;
    gap: 2px;
    position: relative;
  }

  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="select-input"] {
    background: var(--he-dirty-bg);
    border: 1px solid var(--he-dirty-border);
  }

  [data-hawk-eye-ui="compact-card"][data-invalid="true"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="compact-card"][data-invalid="true"] [data-hawk-eye-ui="select-input"] {
    border: 1px solid var(--he-destructive-border);
  }

  /* Color row dirty/invalid — border on the container, not the inner input */
  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="color-row"] {
    background: var(--he-dirty-bg);
    border-color: var(--he-dirty-border);
  }

  [data-hawk-eye-ui="compact-card"][data-invalid="true"] [data-hawk-eye-ui="color-row"] {
    border-color: var(--he-destructive-border);
  }

  /* Transparent overrides — inner text-input must not re-apply its own dirty bg */
  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="color-row"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="compact-card"][data-invalid="true"] [data-hawk-eye-ui="color-row"] [data-hawk-eye-ui="text-input"] {
    background: transparent;
    border: none;
  }

  [data-hawk-eye-ui="control-reset-mini"] {
    position: absolute;
    top: 0;
    right: 0;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: var(--he-dirty);
    color: #ffffff;
    cursor: pointer;
    font-size: 10px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 100ms ease;
    z-index: 1;
  }

  [data-hawk-eye-ui="control-reset-mini"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="compact-card"]:focus-within [data-hawk-eye-ui="control-reset-mini"],
  [data-hawk-eye-ui="compact-card"]:hover [data-hawk-eye-ui="control-reset-mini"] {
    opacity: 1;
  }

  [data-hawk-eye-ui="per-side-wrap"] {
    display: grid;
    gap: 2px;
  }

  /* ── Color swatch button ──────────────────────────────────────── */

  [data-hawk-eye-ui="color-swatch-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    border-radius: 4px;
  }

  [data-hawk-eye-ui="color-swatch-btn"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 1px;
  }

  /* ── Color picker popover ─────────────────────────────────────── */

  [data-hawk-eye-ui="color-popover"] {
    z-index: 2147483647;
    width: 232px;
    padding: 10px;
    border-radius: 8px;
    background: var(--he-bg);
    border: 1px solid var(--he-panel-border);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.06);
    display: grid;
    gap: 8px;
    pointer-events: auto;
  }

  [data-hawk-eye-ui="color-canvas-wrap"] {
    position: relative;
    width: 100%;
    height: 140px;
    border-radius: 6px;
    overflow: hidden;
    cursor: crosshair;
  }

  [data-hawk-eye-ui="color-canvas-wrap"] canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  [data-hawk-eye-ui="color-canvas-thumb"] {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  [data-hawk-eye-ui="color-sliders"] {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 6px;
    align-items: center;
  }

  [data-hawk-eye-ui="color-slider-stack"] {
    display: grid;
    gap: 6px;
  }

  [data-hawk-eye-ui="color-swatch-preview"] {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23ccc'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23ccc'/%3E%3C/svg%3E");
    background-size: 8px 8px;
  }

  [data-hawk-eye-ui="hue-slider"],
  [data-hawk-eye-ui="alpha-slider"] {
    display: block;
    width: 100%;
    height: 10px;
    border-radius: 5px;
    appearance: none;
    cursor: pointer;
    border: none;
    outline: none;
  }

  [data-hawk-eye-ui="hue-slider"]:focus-visible,
  [data-hawk-eye-ui="alpha-slider"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="hue-slider"] {
    background: linear-gradient(
      to right,
      #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
    );
  }

  [data-hawk-eye-ui="alpha-slider"] {
    background:
      var(--alpha-gradient, transparent),
      repeating-linear-gradient(
        45deg,
        #ccc 0 4px,
        transparent 4px 8px
      );
  }

  [data-hawk-eye-ui="hue-slider"]::-webkit-slider-thumb,
  [data-hawk-eye-ui="alpha-slider"]::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.2);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  [data-hawk-eye-ui="hue-slider"]::-moz-range-thumb,
  [data-hawk-eye-ui="alpha-slider"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.2);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  /* ── Color tabs ───────────────────────────────────────────────── */

  [data-hawk-eye-ui="color-tabs"] {
    display: flex;
    gap: 2px;
    border-radius: 5px;
    background: var(--he-input);
    padding: 2px;
  }

  [data-hawk-eye-ui="color-tab"] {
    flex: 1;
    min-height: 22px;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="color-tab"][data-active="true"] {
    background: #404040;
    color: var(--he-fg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  /* ── Color fields ─────────────────────────────────────────────── */

  [data-hawk-eye-ui="color-fields"] {
    display: flex;
    gap: 4px;
    align-items: stretch;
  }

  [data-hawk-eye-ui="color-field-wrap"] {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    position: relative;
  }

  [data-hawk-eye-ui="color-field-wrap"] [data-hawk-eye-ui="text-input"] {
    text-align: center;
    padding: 0 4px;
    min-height: 24px;
    font-size: 11px;
  }

  /* Hex input with # prefix inside the field */
  [data-hawk-eye-ui="color-field-wrap"] [data-hawk-eye-ui="color-field-label"] {
    position: absolute;
    left: 4px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    color: var(--he-label);
    font-size: 11px;
    pointer-events: none;
  }

  [data-hawk-eye-ui="color-field-wrap"] [data-hawk-eye-ui="color-field-label"] + [data-hawk-eye-ui="text-input"] {
    padding-left: 18px;
  }

  [data-hawk-eye-ui="color-field-unit"] {
    text-align: center;
    color: var(--he-muted);
    font-family: var(--he-font-ui);
    font-size: 9px;
    letter-spacing: 0.04em;
    user-select: none;
  }

  /* ── Shadow color input (uses ColorInput) ────────────────────── */

  [data-hawk-eye-ui="shadow-color-input"] {
    flex: 1;
    min-width: 0;
  }

  [data-hawk-eye-ui="shadow-color-row"] {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  /* ── Panel tabs (Properties | Layers) ────────────────────────── */

  [data-hawk-eye-ui="panel-tabs"] {
    display: flex;
    gap: 2px;
    margin: 0 16px;
    padding: 2px;
    border-radius: 8px;
    background: var(--he-input);
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="panel-tab"] {
    flex: 1;
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    font-weight: 400;
    cursor: pointer;
    letter-spacing: -0.02em;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="panel-tab"]:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  [data-hawk-eye-ui="panel-tab"][data-active="true"] {
    background: #ffffff;
    color: #111111;
  }

  [data-hawk-eye-ui="panel-tab-icon"] {
    display: inline-flex;
    align-items: center;
  }

  [data-hawk-eye-ui="panel-tab"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: -2px;
  }

  /* ── Layers tree ─────────────────────────────────────────────── */

  [data-hawk-eye-ui="layers-section"] {
    display: grid;
    gap: 12px;
    padding: 16px;
  }

  [data-hawk-eye-ui="layers-heading"] {
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.02em;
  }

  [data-hawk-eye-ui="layers-tree"] {
    display: grid;
    gap: 4px;
  }

  [data-hawk-eye-ui="layer-row"] {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 20px;
    padding: 0;
    border-radius: 4px;
    user-select: none;
    transition: background 60ms ease;
  }

  [data-hawk-eye-ui="layer-row"]:focus-within,
  [data-hawk-eye-ui="layer-row"]:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  [data-hawk-eye-ui="layer-row"][data-selected="true"] {
    color: #ffffff;
  }

  [data-hawk-eye-ui="layer-expand-btn"] {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    background: none;
    border: 0;
    color: var(--he-muted);
    font-size: 11px;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 80ms ease;
  }

  [data-hawk-eye-ui="layer-expand-btn"]:disabled {
    cursor: default;
    opacity: 0.45;
  }

  [data-hawk-eye-ui="layer-expand-btn"]:hover {
    color: var(--he-label);
  }

  [data-hawk-eye-ui="layer-expand-btn"]:focus-visible,
  [data-hawk-eye-ui="layer-select-btn"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="layer-select-btn"] {
    display: inline-flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  [data-hawk-eye-ui="layer-label"] {
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    color: var(--he-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }

  [data-hawk-eye-ui="layers-empty"] {
    padding: 16px;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 12px;
  }

  [data-hawk-eye-ui="panel-resize"] {
    position: absolute;
    right: 10px;
    bottom: 10px;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: nwse-resize;
    opacity: 0.35;
  }

  [data-hawk-eye-ui="panel-resize"]::before,
  [data-hawk-eye-ui="panel-resize"]::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    border-bottom: 1.5px solid rgba(255, 255, 255, 0.4);
    border-right: 1.5px solid rgba(255, 255, 255, 0.4);
  }

  [data-hawk-eye-ui="panel-resize"]::before {
    width: 10px;
    height: 10px;
  }

  [data-hawk-eye-ui="panel-resize"]::after {
    width: 6px;
    height: 6px;
    right: 4px;
    bottom: 4px;
  }

  /* ── Responsive ──────────────────────────────────────────────── */

  @media (max-width: 640px) {
    [data-hawk-eye-ui="trigger"] {
      right: 16px;
      bottom: 16px;
      min-height: 40px;
      padding: 0 14px;
    }

    [data-hawk-eye-ui="control-grid"] {
      grid-template-columns: 1fr;
    }

    [data-hawk-eye-ui="section-grid"] {
      grid-template-columns: 1fr;
    }

    [data-hawk-eye-ui="shadow-grid"] {
      grid-template-columns: 1fr;
    }

    [data-hawk-eye-ui="shadow-color-row"] {
      grid-template-columns: 28px minmax(0, 1fr);
    }

    [data-hawk-eye-ui="opacity-row"] {
      grid-template-columns: 1fr;
    }

    [data-hawk-eye-ui="number-input-row"] {
      grid-template-columns: 1fr;
    }

    [data-hawk-eye-ui="search-row"] {
      grid-template-columns: 24px minmax(0, 1fr);
    }

    [data-hawk-eye-ui="compact-row"] {
      grid-template-columns: 1fr;
    }
  }
`;
