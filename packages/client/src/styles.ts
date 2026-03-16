export const hawkEyeStyles = `
  :host {
    all: initial;
    --he-bg:              #282828;
    --he-panel-border:    rgba(255, 255, 255, 0.08);
    --he-divider:         #3a3a3a;
    --he-input:           #3d3d3d;
    --he-input-hover:     #484848;
    --he-fg:              #f0f0f0;
    --he-label:           #9a9a9a;
    --he-muted:           #666;
    --he-section-title:   #ffffff;
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
    width: min(var(--hawk-eye-panel-width, 280px), calc(100vw - 32px));
    height: calc(100vh - 48px);
    max-height: calc(100vh - 48px);
    overflow: hidden;
    border-radius: 14px;
    background: var(--he-bg);
    border: 1px solid var(--he-panel-border);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.6),
      0 8px 32px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
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
    gap: 8px;
    padding: 10px 12px;
    cursor: grab;
    border-bottom: 1px solid var(--he-panel-border);
    flex-shrink: 0;
    user-select: none;
  }

  [data-hawk-eye-ui="panel-drag-header"]:active {
    cursor: grabbing;
  }

  [data-hawk-eye-ui="drag-icon"] {
    flex-shrink: 0;
    color: var(--he-label);
    opacity: 0.6;
  }

  [data-hawk-eye-ui="panel-title"] {
    flex: 1;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  [data-hawk-eye-ui="panel-close-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: var(--he-label);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="panel-close-btn"]:hover {
    background: rgba(255, 255, 255, 0.16);
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
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: var(--he-label);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="panel-back-btn"]:hover {
    background: rgba(255, 255, 255, 0.16);
    color: var(--he-fg);
  }

  /* ── Panel footer ────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-footer"] {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 10px;
    border-top: 1px solid var(--he-panel-border);
    background: var(--he-bg);
    flex-shrink: 0;
    border-radius: 0 0 14px 14px;
  }

  [data-hawk-eye-ui="footer-changes-btn"] {
    flex: 1;
    min-height: 34px;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="footer-changes-btn"]:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  [data-hawk-eye-ui="footer-actions"] {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="footer-apply-btn"] {
    min-height: 34px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: #e8e8e8;
    color: #111111;
    font-family: var(--he-font-ui);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="footer-apply-btn"]:hover {
    background: #ffffff;
  }

  [data-hawk-eye-ui="footer-apply-btn"]:disabled {
    cursor: progress;
    opacity: 0.5;
  }

  [data-hawk-eye-ui="panel-footer"] [data-hawk-eye-ui="footer-apply-btn"]:only-child {
    flex: 1;
  }

  [data-hawk-eye-ui="footer-revert-btn"] {
    flex: 1;
    min-height: 34px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="footer-revert-btn"]:hover {
    background: rgba(255, 255, 255, 0.1);
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

  /* ── Changes view ────────────────────────────────────────────── */

  [data-hawk-eye-ui="changes-view"] {
    display: grid;
    gap: 1px;
    padding: 8px;
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

  [data-hawk-eye-ui="badge"] {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--he-input);
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
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
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0;
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
    min-height: 28px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: var(--he-input);
    color: var(--he-fg);
    font-family: var(--he-font-mono);
    font-size: 11px;
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
    gap: 4px;
    padding: 6px 12px 10px;
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
    grid-template-columns: minmax(0, 1fr) 72px;
    align-items: center;
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

  [data-hawk-eye-ui="change-card"] {
    display: grid;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--he-input);
    border: none;
  }

  [data-hawk-eye-ui="change-card-head"] {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  [data-hawk-eye-ui="change-title"] {
    margin: 0 0 2px;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 12px;
    font-weight: 600;
    text-transform: lowercase;
  }

  [data-hawk-eye-ui="change-source"] {
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-mono);
    font-size: 10px;
    line-height: 1.4;
    word-break: break-word;
  }

  [data-hawk-eye-ui="change-count"] {
    color: var(--he-label);
    font-family: var(--he-font-mono);
    font-size: 10px;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="change-items"] {
    display: grid;
    gap: 6px;
  }

  [data-hawk-eye-ui="change-item"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  [data-hawk-eye-ui="change-copy"] {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  [data-hawk-eye-ui="change-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
  }

  [data-hawk-eye-ui="change-values"] {
    color: var(--he-fg);
    font-family: var(--he-font-mono);
    font-size: 10px;
    line-height: 1.4;
    word-break: break-word;
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
    min-height: 28px;
    padding: 0 26px 0 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: var(--he-input);
    color: var(--he-fg);
    font-family: var(--he-font-mono);
    font-size: 11px;
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
    gap: 6px;
    align-items: center;
  }

  [data-hawk-eye-ui="color-swatch"] {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    cursor: pointer;
  }

  [data-hawk-eye-ui="color-row"] [data-hawk-eye-ui="text-input"] {
    flex: 1;
    min-width: 0;
  }

  /* ── Collapsible section ─────────────────────────────────────── */

  /* ── Static (non-collapsible) section ───────────────────────────── */

  [data-hawk-eye-ui="static-section"] {
    border-top: 1px solid var(--he-divider);
  }

  [data-hawk-eye-ui="static-section"]:first-child {
    border-top: none;
  }

  [data-hawk-eye-ui="static-section-header"] {
    display: flex;
    align-items: center;
    padding: 10px 12px 6px;
  }

  [data-hawk-eye-ui="static-section-body"] {
    padding: 0 8px 10px;
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

  [data-hawk-eye-ui="per-side-control"] {
    display: grid;
    gap: 6px;
  }

  [data-hawk-eye-ui="per-side-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  [data-hawk-eye-ui="per-side-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11px;
    line-height: 1.2;
  }

  [data-hawk-eye-ui="per-side-link"] {
    padding: 2px 7px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: var(--he-input);
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 10px;
    cursor: pointer;
    transition: background 80ms ease;
  }

  [data-hawk-eye-ui="per-side-link"][data-active="true"] {
    background: #505050;
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="per-side-inputs"] {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  [data-hawk-eye-ui="per-side-cell"] {
    display: grid;
    gap: 3px;
  }

  [data-hawk-eye-ui="per-side-cell"][data-invalid="true"]
    [data-hawk-eye-ui="per-side-input-wrap"] [data-hawk-eye-ui="text-input"] {
    border-color: var(--he-destructive-border);
  }

  [data-hawk-eye-ui="per-side-input-wrap"] {
    display: grid;
    gap: 3px;
    text-align: center;
  }

  [data-hawk-eye-ui="per-side-input-label"] {
    color: var(--he-muted);
    font-family: var(--he-font-mono);
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="per-side-input-wrap"] [data-hawk-eye-ui="text-input"] {
    text-align: center;
    padding: 0 2px;
    min-height: 26px;
    font-size: 11px;
  }

  [data-hawk-eye-ui="per-side-reset"] {
    min-height: 20px;
    padding: 0 6px;
    border: 0;
    border-radius: 4px;
    background: var(--he-input);
    color: var(--he-label);
    cursor: pointer;
    font-family: var(--he-font-ui);
    font-size: 9px;
  }

  [data-hawk-eye-ui="per-side-reset"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
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
    min-height: 26px;
    font-size: 10px;
    padding: 0 20px 0 4px;
  }

  /* ── Compact row (2-col paired inputs) ────────────────────────── */

  [data-hawk-eye-ui="compact-row"] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
  }

  [data-hawk-eye-ui="compact-row-full"] {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
  }

  /* Weight (60%) | Size (40%) two-col row */
  [data-hawk-eye-ui~="typo-weight-size"] {
    grid-template-columns: 3fr 2fr;
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
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
  }

  [data-hawk-eye-ui="icon-seg-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: var(--he-input);
    color: var(--he-label);
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="icon-seg-btn"]:hover {
    background: var(--he-input-hover);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="icon-seg-btn"][data-active="true"] {
    background: rgba(255, 255, 255, 0.18);
    color: var(--he-fg);
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
    display: grid;
    gap: 3px;
    flex: 1;
  }

  [data-hawk-eye-ui="color-field-wrap"] [data-hawk-eye-ui="text-input"] {
    text-align: center;
    padding: 0 4px;
    min-height: 24px;
    font-size: 11px;
  }

  [data-hawk-eye-ui="color-field-unit"],
  [data-hawk-eye-ui="color-field-label"] {
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

    [data-hawk-eye-ui="per-side-inputs"] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    [data-hawk-eye-ui="compact-row"] {
      grid-template-columns: 1fr;
    }
  }
`;
