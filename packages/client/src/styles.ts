export const hawkEyeStyles = `
  :host {
    all: initial;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  [data-hawk-eye-ui="root"] {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    pointer-events: none;
    color: #111827;
    font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
  }

  [data-hawk-eye-ui="surface"] {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  [data-hawk-eye-ui="outline"] {
    position: fixed;
    border: 2px solid #ff6b35;
    border-radius: 14px;
    background:
      linear-gradient(180deg, rgba(255, 107, 53, 0.14), rgba(255, 107, 53, 0.05));
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.9),
      0 18px 44px rgba(17, 24, 39, 0.16);
  }

  [data-hawk-eye-ui="measure"] {
    position: fixed;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.92);
    color: #fff7ed;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: 0 12px 30px rgba(17, 24, 39, 0.24);
    white-space: nowrap;
  }

  [data-hawk-eye-ui="panel"] {
    position: fixed;
    display: grid;
    gap: 14px;
    right: 24px;
    bottom: 92px;
    width: min(var(--hawk-eye-panel-width, 420px), calc(100vw - 32px));
    max-height: min(var(--hawk-eye-panel-height, 760px), calc(100vh - 120px));
    overflow: auto;
    padding: 18px 18px 42px;
    border-radius: 22px;
    background:
      linear-gradient(145deg, rgba(255, 247, 237, 0.96), rgba(255, 237, 213, 0.9));
    border: 1px solid rgba(251, 146, 60, 0.28);
    box-shadow:
      0 24px 60px rgba(15, 23, 42, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(18px);
    overscroll-behavior: contain;
    pointer-events: auto;
  }

  [data-hawk-eye-ui="eyebrow"] {
    margin: 0 0 10px;
    color: #9a3412;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="title-row"] {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 8px;
  }

  [data-hawk-eye-ui="title"] {
    margin: 0;
    font-size: 22px;
    line-height: 1;
  }

  [data-hawk-eye-ui="badge"] {
    display: inline-flex;
    align-items: center;
    padding: 4px 9px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: #7c2d12;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  [data-hawk-eye-ui="detail-list"] {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.52);
    border: 1px solid rgba(251, 146, 60, 0.14);
  }

  [data-hawk-eye-ui="inspector-actions"] {
    display: grid;
    gap: 8px;
  }

  [data-hawk-eye-ui="status-note"] {
    margin: 0;
    color: rgba(124, 45, 18, 0.84);
    font-size: 12px;
    line-height: 1.5;
  }

  [data-hawk-eye-ui="status-note"][data-state="success"] {
    color: #166534;
  }

  [data-hawk-eye-ui="status-note"][data-state="error"] {
    color: #b91c1c;
  }

  [data-hawk-eye-ui="status-note"][data-state="pending"] {
    color: #9a3412;
  }

  [data-hawk-eye-ui="panel-toolbar"] {
    display: grid;
    gap: 8px;
    padding: 14px;
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 251, 247, 0.88));
    border: 1px solid rgba(251, 146, 60, 0.18);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 10px 24px rgba(194, 65, 12, 0.06);
  }

  [data-hawk-eye-ui="search-shell"] {
    display: grid;
    gap: 8px;
  }

  [data-hawk-eye-ui="search-label"] {
    color: rgba(124, 45, 18, 0.82);
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="search-row"] {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
  }

  [data-hawk-eye-ui="search-icon"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    border-radius: 11px;
    background: rgba(154, 52, 18, 0.08);
    color: #9a3412;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 12px;
  }

  [data-hawk-eye-ui="search-meta"] {
    margin: 0;
    color: rgba(124, 45, 18, 0.8);
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="property-stack"] {
    display: grid;
    gap: 14px;
  }

  [data-hawk-eye-ui="property-group"],
  [data-hawk-eye-ui="changes-section"],
  [data-hawk-eye-ui="search-empty"] {
    display: grid;
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.56);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74);
  }

  [data-hawk-eye-ui="group-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  [data-hawk-eye-ui="group-title"] {
    margin: 0;
    color: #7c2d12;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="control-grid"] {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  [data-hawk-eye-ui="section-count"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(154, 52, 18, 0.08);
    color: #9a3412;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="opacity-control"] {
    display: grid;
    gap: 10px;
  }

  [data-hawk-eye-ui="control"] {
    display: grid;
    gap: 8px;
    padding: 11px;
    border-radius: 15px;
    background: rgba(255, 251, 247, 0.84);
    border: 1px solid rgba(251, 146, 60, 0.18);
  }

  [data-hawk-eye-ui="control"][data-dirty="true"] {
    border-color: rgba(234, 88, 12, 0.34);
    box-shadow: 0 10px 20px rgba(251, 146, 60, 0.1);
  }

  [data-hawk-eye-ui="control"][data-invalid="true"] {
    border-color: rgba(220, 38, 38, 0.32);
  }

  [data-hawk-eye-ui="control"][data-compact="true"] {
    padding: 10px;
  }

  [data-hawk-eye-ui="control-head"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  [data-hawk-eye-ui="control-label"] {
    color: #7c2d12;
    font-size: 12px;
    line-height: 1.3;
  }

  [data-hawk-eye-ui="text-input"] {
    width: 100%;
    min-height: 38px;
    padding: 0 12px;
    border: 1px solid rgba(194, 65, 12, 0.18);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.95);
    color: #111827;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 12px;
  }

  [data-hawk-eye-ui="text-input"]:disabled {
    cursor: not-allowed;
    color: rgba(17, 24, 39, 0.58);
    background: rgba(255, 247, 237, 0.9);
  }

  [data-hawk-eye-ui="text-input"]:focus-visible,
  [data-hawk-eye-ui="range-input"]:focus-visible {
    outline: 2px solid rgba(251, 146, 60, 0.42);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="opacity-row"] {
    display: grid;
    gap: 10px;
    grid-template-columns: minmax(0, 1fr) 84px;
    align-items: center;
  }

  [data-hawk-eye-ui="range-input"] {
    width: 100%;
    accent-color: #ea580c;
  }

  [data-hawk-eye-ui="control-meta"] {
    color: rgba(124, 45, 18, 0.82);
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    line-height: 1.4;
  }

  [data-hawk-eye-ui="section-stack"] {
    display: grid;
    gap: 10px;
  }

  [data-hawk-eye-ui="section-grid"] {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  [data-hawk-eye-ui="section-grid"] > [data-hawk-eye-ui="control"][data-span="full"] {
    grid-column: 1 / -1;
  }

  [data-hawk-eye-ui="shadow-editor"] {
    display: grid;
    gap: 8px;
  }

  [data-hawk-eye-ui="shadow-grid"] {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  [data-hawk-eye-ui="shadow-field"] {
    display: grid;
    gap: 4px;
  }

  [data-hawk-eye-ui="shadow-color-row"] {
    display: grid;
    gap: 8px;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    align-items: center;
  }

  [data-hawk-eye-ui="control-reset"],
  [data-hawk-eye-ui="primary-button"],
  [data-hawk-eye-ui="secondary-button"],
  [data-hawk-eye-ui="pill-button"] {
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="control-reset"],
  [data-hawk-eye-ui="pill-button"] {
    padding: 5px 8px;
    background: rgba(255, 237, 213, 0.92);
    color: #9a3412;
  }

  [data-hawk-eye-ui="primary-button"],
  [data-hawk-eye-ui="secondary-button"] {
    min-height: 34px;
    padding: 0 12px;
  }

  [data-hawk-eye-ui="primary-button"] {
    background: linear-gradient(180deg, #c2410c, #9a3412);
    color: #fff7ed;
  }

  [data-hawk-eye-ui="secondary-button"] {
    background: #9a3412;
    color: #fff7ed;
  }

  [data-hawk-eye-ui="primary-button"]:disabled,
  [data-hawk-eye-ui="secondary-button"]:disabled {
    cursor: progress;
    opacity: 0.72;
  }

  [data-hawk-eye-ui="changes-list"] {
    display: grid;
    gap: 10px;
  }

  [data-hawk-eye-ui="change-card"] {
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(255, 251, 247, 0.86);
    border: 1px solid rgba(251, 146, 60, 0.18);
  }

  [data-hawk-eye-ui="change-card-head"] {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  [data-hawk-eye-ui="change-title"] {
    margin: 0 0 3px;
    color: #7c2d12;
    font-size: 14px;
    text-transform: lowercase;
  }

  [data-hawk-eye-ui="change-source"] {
    margin: 0;
    color: rgba(124, 45, 18, 0.8);
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    line-height: 1.4;
    word-break: break-word;
  }

  [data-hawk-eye-ui="change-count"] {
    color: #9a3412;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="change-items"] {
    display: grid;
    gap: 8px;
  }

  [data-hawk-eye-ui="change-item"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  [data-hawk-eye-ui="change-copy"] {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  [data-hawk-eye-ui="change-label"] {
    color: #7c2d12;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="change-values"] {
    color: #111827;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 11px;
    line-height: 1.4;
    word-break: break-word;
  }

  [data-hawk-eye-ui="detail"] {
    display: grid;
    gap: 4px;
  }

  [data-hawk-eye-ui="label"] {
    color: rgba(124, 45, 18, 0.8);
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="value"] {
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 13px;
    line-height: 1.4;
    word-break: break-word;
  }

  [data-hawk-eye-ui="hint"] {
    margin: 0;
    color: rgba(124, 45, 18, 0.84);
    font-size: 13px;
    line-height: 1.5;
  }

  [data-hawk-eye-ui="trigger"] {
    position: fixed;
    right: 24px;
    bottom: 24px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background:
      radial-gradient(circle at top left, #fb923c, #ea580c 62%, #9a3412);
    color: #fff7ed;
    cursor: pointer;
    pointer-events: auto;
    box-shadow:
      0 18px 35px rgba(194, 65, 12, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      filter 140ms ease;
  }

  [data-hawk-eye-ui="trigger"]:hover {
    transform: translateY(-1px);
    box-shadow:
      0 24px 44px rgba(194, 65, 12, 0.34),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
    filter: saturate(1.05);
  }

  [data-hawk-eye-ui="trigger"]:focus-visible {
    outline: 3px solid rgba(251, 191, 36, 0.58);
    outline-offset: 4px;
  }

  [data-hawk-eye-ui="trigger-dot"] {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #fff7ed;
    box-shadow: 0 0 0 6px rgba(255, 247, 237, 0.16);
  }

  /* ── Select Input ──────────────────────────────────────────────── */

  [data-hawk-eye-ui="number-input-row"] {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, 1fr) 88px;
    align-items: center;
  }

  [data-hawk-eye-ui="select-input"] {
    width: 100%;
    min-height: 38px;
    padding: 0 12px;
    border: 1px solid rgba(194, 65, 12, 0.18);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.95);
    color: #111827;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 12px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%237c2d12' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  [data-hawk-eye-ui="select-input"]:focus-visible {
    outline: 2px solid rgba(251, 146, 60, 0.42);
    outline-offset: 2px;
  }

  /* ── Segmented Control ──────────────────────────────────────── */

  [data-hawk-eye-ui="segmented-row"] {
    display: flex;
    gap: 0;
    border-radius: 11px;
    overflow: hidden;
    border: 1px solid rgba(194, 65, 12, 0.18);
    background: rgba(255, 255, 255, 0.95);
  }

  [data-hawk-eye-ui="segmented-button"] {
    flex: 1;
    min-height: 34px;
    padding: 0 6px;
    border: 0;
    border-right: 1px solid rgba(194, 65, 12, 0.12);
    background: transparent;
    color: #7c2d12;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 100ms ease, color 100ms ease;
  }

  [data-hawk-eye-ui="segmented-button"]:last-child {
    border-right: 0;
  }

  [data-hawk-eye-ui="segmented-button"][data-active="true"] {
    background: rgba(234, 88, 12, 0.12);
    color: #ea580c;
    font-weight: 600;
  }

  [data-hawk-eye-ui="segmented-button"]:focus-visible {
    outline: 2px solid rgba(251, 146, 60, 0.42);
    outline-offset: -2px;
  }

  /* ── Toggle Control ─────────────────────────────────────────── */

  [data-hawk-eye-ui="toggle-row"] {
    display: flex;
    gap: 0;
    border-radius: 11px;
    overflow: hidden;
    border: 1px solid rgba(194, 65, 12, 0.18);
    background: rgba(255, 255, 255, 0.95);
  }

  [data-hawk-eye-ui="toggle-button"] {
    flex: 1;
    min-height: 34px;
    padding: 0 10px;
    border: 0;
    background: transparent;
    color: #7c2d12;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 11px;
    cursor: pointer;
    transition: background 100ms ease, color 100ms ease;
  }

  [data-hawk-eye-ui="toggle-button"][data-active="true"] {
    background: rgba(234, 88, 12, 0.12);
    color: #ea580c;
    font-weight: 600;
  }

  [data-hawk-eye-ui="toggle-button"]:focus-visible {
    outline: 2px solid rgba(251, 146, 60, 0.42);
    outline-offset: -2px;
  }

  /* ── Color Input ────────────────────────────────────────────── */

  [data-hawk-eye-ui="color-row"] {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  [data-hawk-eye-ui="color-swatch"] {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(194, 65, 12, 0.22);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
    cursor: pointer;
  }

  [data-hawk-eye-ui="color-row"] [data-hawk-eye-ui="text-input"] {
    flex: 1;
    min-width: 0;
  }

  /* ── Collapsible Section ──────────────────────────────────────── */

  [data-hawk-eye-ui="collapsible-section"] {
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.64), rgba(255, 249, 242, 0.76));
    border: 1px solid rgba(251, 146, 60, 0.16);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.78),
      0 8px 18px rgba(194, 65, 12, 0.04);
    overflow: hidden;
  }

  [data-hawk-eye-ui="collapsible-header"] {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    padding: 13px 14px;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  [data-hawk-eye-ui="collapsible-header"]:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  [data-hawk-eye-ui="collapsible-header"]:focus-visible {
    outline: 2px solid rgba(251, 146, 60, 0.42);
    outline-offset: -2px;
  }

  [data-hawk-eye-ui="collapsible-chevron"] {
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 5px solid #7c2d12;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    transition: transform 120ms ease;
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
    gap: 4px;
    min-width: 0;
    flex: 1;
  }

  [data-hawk-eye-ui="section-subtitle"] {
    color: rgba(124, 45, 18, 0.76);
    font-size: 12px;
    line-height: 1.4;
  }

  [data-hawk-eye-ui="collapsible-action"] {
    margin-left: auto;
  }

  [data-hawk-eye-ui="collapsible-body"] {
    padding: 0 14px 14px;
    border-top: 1px solid rgba(251, 146, 60, 0.12);
  }

  /* ── Per-Side Control ─────────────────────────────────────────── */

  [data-hawk-eye-ui="per-side-control"] {
    display: grid;
    gap: 8px;
  }

  [data-hawk-eye-ui="per-side-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  [data-hawk-eye-ui="per-side-label"] {
    color: #7c2d12;
    font-size: 12px;
    line-height: 1.3;
  }

  [data-hawk-eye-ui="per-side-link"] {
    padding: 4px 8px;
    border: 1px solid rgba(194, 65, 12, 0.18);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
    color: #7c2d12;
    font-size: 11px;
    cursor: pointer;
  }

  [data-hawk-eye-ui="per-side-link"][data-active="true"] {
    background: rgba(234, 88, 12, 0.1);
    border-color: rgba(234, 88, 12, 0.28);
  }

  [data-hawk-eye-ui="per-side-inputs"] {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  [data-hawk-eye-ui="per-side-cell"] {
    display: grid;
    gap: 4px;
  }

  [data-hawk-eye-ui="per-side-cell"][data-invalid="true"]
    [data-hawk-eye-ui="per-side-input-wrap"] [data-hawk-eye-ui="text-input"] {
    border-color: rgba(220, 38, 38, 0.32);
  }

  [data-hawk-eye-ui="per-side-input-wrap"] {
    display: grid;
    gap: 4px;
    text-align: center;
  }

  [data-hawk-eye-ui="per-side-input-label"] {
    color: rgba(124, 45, 18, 0.7);
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="per-side-input-wrap"] [data-hawk-eye-ui="text-input"] {
    text-align: center;
    padding: 0 4px;
    min-height: 32px;
    font-size: 11px;
  }

  [data-hawk-eye-ui="per-side-reset"] {
    min-height: 22px;
    padding: 0 6px;
    border: 0;
    border-radius: 999px;
    background: rgba(255, 237, 213, 0.92);
    color: #9a3412;
    cursor: pointer;
    font-family: "SFMono-Regular", "Menlo", "Monaco", monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="per-side-reset"]:focus-visible {
    outline: 2px solid rgba(251, 146, 60, 0.42);
    outline-offset: 2px;
  }

  [data-hawk-eye-ui="panel-resize"] {
    position: absolute;
    left: 12px;
    bottom: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow:
      0 10px 20px rgba(15, 23, 42, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.92);
    color: #9a3412;
    cursor: nwse-resize;
  }

  [data-hawk-eye-ui="panel-resize"]:focus-visible {
    outline: 2px solid rgba(251, 146, 60, 0.42);
    outline-offset: 3px;
  }

  [data-hawk-eye-ui="panel-resize-grip"] {
    width: 12px;
    height: 12px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translate(-1px, -1px);
    opacity: 0.7;
  }

  @media (max-width: 640px) {
    [data-hawk-eye-ui="trigger"] {
      right: 16px;
      bottom: 16px;
      min-height: 48px;
      padding: 0 16px;
    }

    [data-hawk-eye-ui="panel"] {
      right: 16px;
      bottom: 80px;
      width: calc(100vw - 32px);
      max-height: min(var(--hawk-eye-panel-height, 720px), calc(100vh - 112px));
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
      grid-template-columns: 28px minmax(0, 1fr);
    }

    [data-hawk-eye-ui="per-side-inputs"] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
