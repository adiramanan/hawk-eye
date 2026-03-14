export const hawkEyeStyles = `
  :host {
    all: initial;
    --he-bg:              #ffffff;
    --he-panel-border:    #e5e5e5;
    --he-divider:         #e5e5e5;
    --he-input:           #ebebeb;
    --he-input-hover:     #e0e0e0;
    --he-fg:              #1e1e1e;
    --he-label:           #8c8c8c;
    --he-muted:           #b3b3b3;
    --he-section-title:   #1e1e1e;
    --he-accent:          #0066ff;
    --he-dirty:           #d97706;
    --he-dirty-bg:        rgba(217, 119, 6, 0.08);
    --he-dirty-border:    rgba(217, 119, 6, 0.4);
    --he-destructive:     #ef4444;
    --he-destructive-border: rgba(239, 68, 68, 0.5);
    --he-trigger-bg:      #1e1e1e;
    --he-trigger-hover:   #3c3c3c;
    --he-ring:            #0066ff;
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
    background: var(--he-fg);
    color: #ffffff;
    font-family: var(--he-font-mono);
    font-size: 11px;
    white-space: nowrap;
  }

  /* ── Panel ───────────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel"] {
    position: fixed;
    display: grid;
    gap: 0;
    right: 24px;
    bottom: 92px;
    width: min(var(--hawk-eye-panel-width, 280px), calc(100vw - 32px));
    max-height: min(var(--hawk-eye-panel-height, 760px), calc(100vh - 120px));
    overflow: auto;
    padding: 0 0 40px;
    border-radius: 8px;
    background: var(--he-bg);
    border: 1px solid var(--he-panel-border);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.08),
      0 2px 4px -2px rgba(0, 0, 0, 0.05),
      0 0 0 1px rgba(0, 0, 0, 0.04);
    overscroll-behavior: contain;
    pointer-events: auto;
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
    box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.15);
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
    background: var(--he-fg);
    color: #ffffff;
  }

  [data-hawk-eye-ui="primary-button"]:hover {
    background: #3c3c3c;
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
    box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.15);
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
    background: #ffffff;
    color: var(--he-fg);
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
    background: #ffffff;
    color: var(--he-fg);
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
    background: rgba(0, 0, 0, 0.02);
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
    padding: 0;
    border-top: none;
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
    background: var(--he-fg);
    color: #ffffff;
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

  /* ── Panel resize ────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-resize"] {
    position: absolute;
    left: 10px;
    bottom: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--he-panel-border);
    border-radius: 4px;
    background: var(--he-bg);
    color: var(--he-label);
    cursor: nwse-resize;
  }

  [data-hawk-eye-ui="panel-resize"]:focus-visible {
    outline: 2px solid var(--he-ring);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="panel-resize-grip"] {
    width: 8px;
    height: 8px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translate(-1px, -1px);
    opacity: 0.5;
  }

  /* ── Responsive ──────────────────────────────────────────────── */

  @media (max-width: 640px) {
    [data-hawk-eye-ui="trigger"] {
      right: 16px;
      bottom: 16px;
      min-height: 40px;
      padding: 0 14px;
    }

    [data-hawk-eye-ui="panel"] {
      right: 16px;
      bottom: 72px;
      width: calc(100vw - 32px);
      max-height: min(var(--hawk-eye-panel-height, 720px), calc(100vh - 96px));
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
  }
`;
