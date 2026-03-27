export const hawkEyeStyles = `
  :host {
    all: initial;
    --he-bg:              var(--color-surface-base);
    --he-panel-border:    var(--color-border);
    --he-panel-border-strong: var(--color-border-strong);
    --he-divider:         var(--color-divider);
    --he-surface-2:       var(--color-surface-raised);
    --he-surface-3:       var(--color-surface-strong);
    --he-surface-contrast: var(--color-surface-contrast);
    --he-input:           var(--color-input-bg);
    --he-input-hover:     var(--color-input-hover);
    --he-input-border:    var(--color-input-border);
    --he-fg:              var(--color-text-primary);
    --he-label:           var(--color-text-secondary);
    --he-muted:           var(--color-text-muted);
    --he-section-title:   var(--color-text-secondary);
    --he-accent:          var(--color-accent);
    --he-accent-strong:   var(--color-selection-strong);
    --he-accent-soft:     var(--color-selection-bg);
    --he-selection-border: var(--color-selection-border);
    --he-dirty:           var(--color-warning);
    --he-dirty-bg:        var(--color-warning-soft);
    --he-dirty-border:    color-mix(in srgb, var(--he-dirty) 42%, transparent);
    --he-success:         var(--color-success);
    --he-success-bg:      var(--color-status-success-bg);
    --he-warning-bg:      var(--color-status-warning-bg);
    --he-destructive:     var(--color-error);
    --he-destructive-bg:  var(--color-status-error-bg);
    --he-destructive-border: color-mix(in srgb, var(--he-destructive) 42%, transparent);
    --he-trigger-bg:           var(--color-fill-solid-default);
    --he-trigger-hover:        color-mix(in srgb, var(--color-fill-solid-default) 85%, white);
    --he-trigger-border-color: rgba(73, 73, 73, 0.9);
    --he-trigger-blur:         3px;
    --he-ring:            var(--color-input-focus);
    --he-panel-shadow:    var(--shadow-xl);
    --he-panel-glow:      var(--color-panel-glow);
    --he-font-ui:         var(--font-family-base);
    --he-font-mono:       ui-monospace, "SFMono-Regular", "Menlo", monospace;
    --he-ease-out:        var(--easing-standard);
    --he-ease-in-out:     var(--easing-out);
    --he-press-duration:  var(--duration-fast);
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
    border: var(--spacing-2px) solid var(--he-accent);
    border-radius: var(--radius-xs);
    background: transparent;
    box-shadow: 0 0 0 var(--spacing-1px) color-mix(in srgb, var(--he-accent) 30%, transparent);
    pointer-events: none;
  }

  [data-hawk-eye-ui="measure"] {
    position: fixed;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) 7px;
    border-radius: var(--radius-sm);
    padding: var(--spacing-xs) var(--spacing-base);
    border: var(--spacing-1px) solid color-mix(in srgb, var(--he-accent) 22%, transparent);
    background: color-mix(in srgb, var(--he-surface-2) 84%, #020304 16%);
    color: var(--he-fg);
    font-family: var(--he-font-mono);
    font-size: var(--font-size-xs);
    box-shadow: 0 var(--spacing-10px) 30px rgba(3, 6, 11, 0.26);
    white-space: nowrap;
  }

  /* ── Panel ───────────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel"] {
    position: fixed;
    display: flex;
    flex-direction: column;
    width: min(var(--hawk-eye-panel-width, 320px), calc(100vw - 32px));
    height: min(var(--hawk-eye-panel-height, calc(100vh - 64px)), calc(100vh - 64px));
    min-width: min(var(--hawk-eye-panel-width, 320px), calc(100vw - 32px));
    max-width: min(var(--hawk-eye-panel-width, 320px), calc(100vw - 32px));
    max-height: min(var(--hawk-eye-panel-height, calc(100vh - 64px)), calc(100vh - 64px));
    overflow: hidden;
    border-radius: 28px;
    background: #222222;
    border: 1px solid #595959;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
    pointer-events: auto;
    opacity: 1;
    transform: translateY(0) scale(1);
    transform-origin: top right;
    transition:
      opacity var(--hawk-eye-shell-duration, 220ms) var(--he-ease-out),
      transform var(--hawk-eye-shell-duration, 220ms) var(--he-ease-out),
      box-shadow var(--hawk-eye-shell-duration, 220ms) var(--he-ease-out);
    will-change: opacity, transform;
  }

  [data-hawk-eye-ui="panel"][data-state="opening"] {
    @starting-style {
      opacity: 0;
      transform: translateY(14px) scale(0.985);
    }
  }

  [data-hawk-eye-ui="panel"][data-state="closing"] {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
    pointer-events: none;
  }

  [data-hawk-eye-ui="panel"]::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 28px;
    background: transparent;
    pointer-events: none;
    z-index: 0;
  }

  [data-hawk-eye-ui="panel"] > * {
    position: relative;
    z-index: 1;
  }

  [data-hawk-eye-ui="panel-body"] {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  [data-hawk-eye-ui="view-stack"] {
    display: grid;
    flex: 1 1 auto;
    height: 100%;
    min-height: 0;
    position: relative;
  }

  [data-hawk-eye-ui="panel-view"] {
    grid-area: 1 / 1;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    opacity: 1;
    transform: translateX(0);
    transition:
      opacity var(--hawk-eye-view-duration, 180ms) var(--he-ease-out),
      transform var(--hawk-eye-view-duration, 180ms) var(--he-ease-in-out),
      filter var(--hawk-eye-view-duration, 180ms) var(--he-ease-out);
    will-change: opacity, transform;
  }

  [data-hawk-eye-ui="panel-view"][data-presence="entering"] {
    @starting-style {
      opacity: 0;
      filter: blur(4px);
    }
  }

  [data-hawk-eye-ui="view-stack"][data-state="to-changes"]
    [data-hawk-eye-ui="panel-view"][data-view="changes"][data-presence="entering"] {
    @starting-style {
      opacity: 0;
      transform: translateX(12px);
      filter: blur(4px);
    }
  }

  [data-hawk-eye-ui="view-stack"][data-state="to-layers"]
    [data-hawk-eye-ui="panel-view"][data-view="layers"][data-presence="entering"] {
    @starting-style {
      opacity: 0;
      transform: translateX(12px);
      filter: blur(4px);
    }
  }

  [data-hawk-eye-ui="view-stack"][data-state="to-properties"]
    [data-hawk-eye-ui="panel-view"][data-view="properties"][data-presence="entering"] {
    @starting-style {
      opacity: 0;
      transform: translateX(-12px);
      filter: blur(4px);
    }
  }

  [data-hawk-eye-ui="view-stack"][data-state="to-changes"]
    [data-hawk-eye-ui="panel-view"][data-presence="exiting"] {
    opacity: 0;
    transform: translateX(-12px);
    filter: blur(4px);
    pointer-events: none;
  }

  [data-hawk-eye-ui="view-stack"][data-state="to-layers"]
    [data-hawk-eye-ui="panel-view"][data-presence="exiting"] {
    opacity: 0;
    transform: translateX(-12px);
    filter: blur(4px);
    pointer-events: none;
  }

  [data-hawk-eye-ui="view-stack"][data-state="to-properties"]
    [data-hawk-eye-ui="panel-view"][data-presence="exiting"] {
    opacity: 0;
    transform: translateX(12px);
    filter: blur(4px);
    pointer-events: none;
  }

  /* ── Panel drag header ───────────────────────────────────────── */

  [data-hawk-eye-ui="panel-drag-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 12px;
    background: transparent;
    cursor: grab;
    flex-shrink: 0;
    user-select: none;
  }

  [data-hawk-eye-ui="panel"][data-view="changes"] [data-hawk-eye-ui="panel-drag-header"] {
    padding-bottom: 16px;
    border-bottom: 1px solid #595959;
  }

  [data-hawk-eye-ui="panel-drag-header"]:active {
    cursor: grabbing;
  }

  [data-hawk-eye-ui="panel-leading-spacer"] {
    display: none;
  }

  [data-hawk-eye-ui="panel-header-main"] {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1 1 auto;
    min-width: 0;
  }

  [data-hawk-eye-ui="panel-header-copy"] {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  [data-hawk-eye-ui="panel-header-actions"] {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="panel-eyebrow"] {
    margin: 0;
    color: var(--he-muted);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    font-weight: var(--font-weight-strong);
    letter-spacing: 0.14em;
    line-height: 1;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="panel-title"] {
    margin: 0;
    min-width: 0;
    color: #fcfcfc;
    font-family: var(--he-font-ui);
    font-size: 17px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.25px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-hawk-eye-ui="panel-brand"] {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  [data-hawk-eye-ui="panel-brand-mark"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--he-fg);
    opacity: 0.92;
  }

  [data-hawk-eye-ui="panel-brand-mark"] svg {
    width: 18px;
    height: 18px;
  }

  [data-hawk-eye-ui="panel-header-badge"] {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 var(--spacing-10px);
    border: var(--spacing-1px) solid var(--he-selection-border);
    border-radius: var(--radius-full);
    background: var(--he-accent-soft);
    color: var(--he-accent);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    font-weight: var(--font-weight-strong);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="panel-brand-image"] {
    display: block;
    width: 18px;
    height: 18px;
    object-fit: contain;
  }

  [data-hawk-eye-ui="panel-brand-copy"] {
    display: inline-flex;
    align-items: center;
  }

  [data-hawk-eye-ui="panel-close-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #bcbcbc;
    opacity: 1;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      color 120ms var(--he-ease-out),
      opacity 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="panel-close-btn"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
  }

  [data-hawk-eye-ui="panel-back-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #fcfcfc;
    opacity: 1;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      color 120ms var(--he-ease-out),
      opacity 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="panel"][data-view="changes"] [data-hawk-eye-ui="panel-back-btn"] {
    color: #d9d9d9;
  }

  [data-hawk-eye-ui="panel-close-btn"] svg,
  [data-hawk-eye-ui="panel-back-btn"] svg {
    display: block;
    width: 16px;
    height: 16px;
  }

  /* ── Panel footer ────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-footer"] {
    display: flex;
    align-items: stretch;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid #595959;
    background: #222222;
    backdrop-filter: blur(var(--blur-xs));
    flex-shrink: 0;
    border-radius: 0 0 28px 28px;
  }

  [data-hawk-eye-ui="footer-changes-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 2px;
    flex: 1;
    min-width: 0;
    min-height: 40px;
    padding: 10px 12px;
    border: 0;
    border-radius: 8px;
    background: #f5f5f5;
    color: #000000;
    font-family: var(--he-font-ui);
    font-size: 16.5px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.25px;
    cursor: pointer;
    text-align: left;
    transition:
      background 120ms var(--he-ease-out),
      box-shadow 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="footer-changes-label"] {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="footer-changes-arrow"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
    padding-top: var(--spacing-2px);
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="footer-actions"] {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="footer-action-icon-shell"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    overflow: hidden;
  }

  [data-hawk-eye-ui="footer-action-icon"] {
    display: block;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="footer-action-label"] {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="footer-apply-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    border: 0;
    border-radius: var(--radius-md);
    font-family: var(--he-font-ui);
    font-weight: 400;
    letter-spacing: -0.25px;
    cursor: pointer;
    transition:
      background 120ms var(--he-ease-out),
      box-shadow 120ms var(--he-ease-out),
      color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="footer-preview-toggle-btn"],
  [data-hawk-eye-ui="footer-hide-btn"],
  [data-hawk-eye-ui="footer-revert-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    border: 0;
    border-radius: var(--radius-md);
    font-family: var(--he-font-ui);
    font-weight: 400;
    letter-spacing: -0.25px;
    cursor: pointer;
    transition:
      background 120ms var(--he-ease-out),
      box-shadow 120ms var(--he-ease-out),
      color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-apply-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-preview-toggle-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-revert-btn"] {
    width: 40px;
    min-width: 40px;
    min-height: 40px;
    padding: 12px;
    flex-shrink: 0;
    border-radius: 8px;
  }

  [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-apply-btn"] {
    background: #e1f1ff;
    color: #007ef4;
  }

  [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-preview-toggle-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-revert-btn"] {
    background: #3b3b3b;
    color: #ffffff;
  }

  [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-preview-toggle-btn"][data-active="true"] {
    background: #2d6ee8;
    color: #ffffff;
  }

  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-apply-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-hide-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-revert-btn"] {
    flex: 0 0 auto;
    min-height: 40px;
    padding: 10px 12px;
    font-size: 16.5px;
  }

  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-apply-btn"] {
    background: #e1f1ff;
    color: #007ef4;
  }

  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-hide-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-revert-btn"] {
    background: #3b3b3b;
    color: #ffffff;
  }

  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-apply-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-hide-btn"],
  [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-revert-btn"] {
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    letter-spacing: -0.25px;
    line-height: 1;
    border: 0;
    border-radius: 8px;
    font-family: var(--he-font-ui);
    font-weight: 400;
    cursor: pointer;
    transition:
      background 120ms var(--he-ease-out),
      box-shadow 120ms var(--he-ease-out),
      color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="footer-apply-btn"]:disabled,
  [data-hawk-eye-ui="footer-preview-toggle-btn"]:disabled,
  [data-hawk-eye-ui="footer-hide-btn"]:disabled,
  [data-hawk-eye-ui="footer-revert-btn"]:disabled,
  [data-hawk-eye-ui="footer-icon-btn"]:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  [data-hawk-eye-ui="footer-apply-btn"] svg,
  [data-hawk-eye-ui="footer-preview-toggle-btn"] svg,
  [data-hawk-eye-ui="footer-hide-btn"] svg,
  [data-hawk-eye-ui="footer-revert-btn"] svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="footer-apply-btn"] img,
  [data-hawk-eye-ui="footer-preview-toggle-btn"] img,
  [data-hawk-eye-ui="footer-hide-btn"] img,
  [data-hawk-eye-ui="footer-revert-btn"] img,
  [data-hawk-eye-ui="footer-button-icon"] {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: block;
  }

  [data-hawk-eye-ui="footer-button-label"] {
    white-space: nowrap;
  }

  [data-hawk-eye-ui="sr-only"] {
    position: absolute;
    width: var(--spacing-1px);
    height: var(--spacing-1px);
    padding: 0;
    margin: calc(var(--spacing-1px) * -1);
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  [data-hawk-eye-ui="footer-reset-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--he-surface-3) 82%, transparent);
    color: var(--he-label);
    cursor: pointer;
    transition:
      background 120ms var(--he-ease-out),
      color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
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
    border-radius: var(--radius-md);
    border: var(--spacing-1px) solid var(--he-input-border);
    background: var(--he-surface-2);
    color: var(--he-fg);
    cursor: pointer;
    transition:
      background 120ms var(--he-ease-out),
      color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="footer-status"] {
    grid-area: 1 / 1;
    display: inline-flex;
    align-items: center;
    width: fit-content;
    max-width: 100%;
    margin: 0;
    padding: var(--spacing-sm) var(--spacing-10px);
    border: var(--spacing-1px) solid transparent;
    border-radius: var(--radius-full);
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-xs);
    line-height: 1.4;
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity var(--hawk-eye-status-duration, 160ms) var(--he-ease-out),
      transform var(--hawk-eye-status-duration, 160ms) var(--he-ease-out),
      filter var(--hawk-eye-status-duration, 160ms) var(--he-ease-out);
  }

  [data-hawk-eye-ui="footer-status"][data-presence="entering"] {
    @starting-style {
      opacity: 0;
      transform: translateY(var(--spacing-sm));
      filter: blur(4px);
    }
  }

  [data-hawk-eye-ui="footer-status"][data-presence="exiting"] {
    opacity: 0;
    transform: translateY(calc(-1 * var(--spacing-sm)));
    filter: blur(4px);
    pointer-events: none;
  }

  [data-hawk-eye-ui="footer-status"][data-state="success"] {
    color: var(--he-success);
    background: var(--he-success-bg);
    border-color: color-mix(in srgb, var(--he-success) 32%, transparent);
  }

  [data-hawk-eye-ui="footer-status"][data-state="error"] {
    color: var(--he-destructive);
    background: var(--he-destructive-bg);
    border-color: color-mix(in srgb, var(--he-destructive) 32%, transparent);
  }

  [data-hawk-eye-ui="footer-status"][data-state="info"] {
    color: var(--he-label);
    background: color-mix(in srgb, var(--he-surface-3) 78%, transparent);
    border-color: var(--he-input-border);
  }

  [data-hawk-eye-ui="footer-status"][data-state="pending"] {
    color: var(--he-dirty);
    background: var(--he-warning-bg);
    border-color: color-mix(in srgb, var(--he-dirty) 30%, transparent);
  }

  [data-hawk-eye-ui="panel-footer-status"] {
    display: grid;
    min-height: 28px;
    padding: 0 16px 12px;
    justify-content: flex-start;
  }

  /* ── Changes view ────────────────────────────────────────────── */

  [data-hawk-eye-ui="changes-view"] {
    display: grid;
    gap: 16px;
    align-content: start;
    min-height: 100%;
    padding: 16px;
    background: none;
  }

  /* ── Panel header ────────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-header"] {
    display: grid;
    gap: 0;
    padding: var(--spacing-md) var(--spacing-md) 0;
    border-bottom: var(--spacing-1px) solid var(--he-divider);
    margin-bottom: 0;
  }

  [data-hawk-eye-ui="eyebrow"] {
    margin: 0 0 var(--spacing-xs);
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-xs);
  }

  [data-hawk-eye-ui="title-row"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-base);
    margin-bottom: var(--spacing-base);
  }

  [data-hawk-eye-ui="title"] {
    margin: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: var(--font-weight-strong);
    line-height: 1.2;
  }

  [data-hawk-eye-ui="panel-meta"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-10px);
    padding: 12px var(--spacing-lg) 0;
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity var(--hawk-eye-view-duration, 180ms) var(--he-ease-out),
      transform var(--hawk-eye-view-duration, 180ms) var(--he-ease-out),
      filter var(--hawk-eye-view-duration, 180ms) var(--he-ease-out);
  }

  [data-hawk-eye-ui="panel-meta"][data-presence="entering"] {
    @starting-style {
      opacity: 0;
      transform: translateY(-6px);
      filter: blur(4px);
    }
  }

  [data-hawk-eye-ui="panel-meta"][data-presence="exiting"] {
    opacity: 0;
    transform: translateY(-6px);
    filter: blur(4px);
    pointer-events: none;
  }

  [data-hawk-eye-ui="panel-meta-badge"] {
    display: inline-grid;
    gap: var(--spacing-2px);
    min-width: 0;
    padding: var(--spacing-10px) var(--spacing-md);
    border: var(--spacing-1px) solid var(--he-input-border);
    border-radius: var(--spacing-14px);
    background: color-mix(in srgb, var(--he-surface-2) 86%, black 14%);
  }

  [data-hawk-eye-ui="panel-meta-badge"][data-state="active"] {
    background: color-mix(in srgb, var(--he-accent) 10%, var(--he-surface-2) 90%);
    border-color: var(--he-selection-border);
  }

  [data-hawk-eye-ui="panel-meta-badge-label"] {
    color: var(--he-muted);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    font-weight: var(--font-weight-strong);
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="panel-meta-badge-value"] {
    min-width: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-base);
    letter-spacing: -0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="panel-meta-btn"] {
    padding: var(--spacing-sm) var(--spacing-10px);
    border: var(--spacing-1px) solid var(--he-input-border);
    border-radius: var(--radius-full);
    background: var(--he-surface-2);
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition:
      background 120ms var(--he-ease-out),
      border-color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="detail-list"] {
    display: grid;
    gap: var(--spacing-sm);
    margin: 0 0 var(--spacing-10px);
    padding: 0;
    border: none;
    background: none;
  }

  [data-hawk-eye-ui="inspector-actions"] {
    display: grid;
    gap: var(--spacing-sm);
    padding-bottom: var(--spacing-10px);
  }

  [data-hawk-eye-ui="status-note"] {
    margin: 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-xs);
    line-height: 1.5;
  }

  [data-hawk-eye-ui="status-note"][data-state="success"] {
    color: var(--he-success);
  }

  [data-hawk-eye-ui="status-note"][data-state="error"] {
    color: var(--he-destructive);
  }

  [data-hawk-eye-ui="status-note"][data-state="pending"] {
    color: var(--he-dirty);
  }

  /* ── Toolbar / search ────────────────────────────────────────── */

  [data-hawk-eye-ui="panel-toolbar"] {
    display: grid;
    gap: var(--spacing-sm);
    padding: var(--spacing-10px) var(--spacing-md);
    border-bottom: var(--spacing-1px) solid var(--he-divider);
    background: var(--he-bg);
  }

  [data-hawk-eye-ui="search-shell"] {
    display: grid;
    gap: var(--spacing-sm);
  }

  [data-hawk-eye-ui="search-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="search-row"] {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    gap: var(--spacing-sm);
    align-items: center;
  }

  [data-hawk-eye-ui="search-icon"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    border-radius: var(--radius-sm);
    background: var(--he-input);
    color: var(--he-label);
    font-family: var(--he-font-mono);
    font-size: var(--font-size-xs);
  }

  [data-hawk-eye-ui="search-meta"] {
    margin: 0;
    color: var(--he-muted);
    font-family: var(--he-font-mono);
    font-size: var(--spacing-10px);
  }

  /* ── Property stack ──────────────────────────────────────────── */

  [data-hawk-eye-ui="property-stack"] {
    display: grid;
    gap: 0;
    padding: 0 16px 16px;
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
    gap: var(--spacing-base);
    padding: var(--spacing-md);
    border-top: var(--spacing-1px) solid var(--he-divider);
    background: none;
    border-bottom: none;
    border-left: none;
    border-right: none;
  }

  [data-hawk-eye-ui="group-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-base);
    padding: 0 var(--spacing-md);
  }

  [data-hawk-eye-ui="group-title"] {
    margin: 0;
    color: #fcfcfc;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-transform: none;
  }

  [data-hawk-eye-ui="control-grid"] {
    display: grid;
    gap: var(--spacing-xs) var(--spacing-base);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-10px);
  }

  [data-hawk-eye-ui="section-count"] {
    display: none;
  }

  /* ── Individual property control (no card borders) ────────────── */

  [data-hawk-eye-ui="opacity-control"] {
    display: grid;
    gap: var(--spacing-xs);
  }

  [data-hawk-eye-ui="control"] {
    display: grid;
    gap: 6px;
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
  [data-hawk-eye-ui="control"][data-dirty="true"] [data-hawk-eye-ui="select-input"],
  [data-hawk-eye-ui="control"][data-dirty="true"] [data-hawk-eye-ui="number-input-shell"] {
    border: 1px solid var(--he-dirty-border);
  }

  [data-hawk-eye-ui="control"][data-invalid="true"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="control"][data-invalid="true"] [data-hawk-eye-ui="select-input"],
  [data-hawk-eye-ui="control"][data-invalid="true"] [data-hawk-eye-ui="number-input-shell"] {
    border: var(--spacing-1px) solid var(--he-destructive-border);
  }

  [data-hawk-eye-ui="control"][data-compact="true"] {
    padding: 0;
  }

  [data-hawk-eye-ui="control-head"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-xs);
  }

  [data-hawk-eye-ui="control-label"] {
    color: #9a9a9a;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0;
    line-height: 1.2;
    text-transform: none;
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
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    background: #3b3b3b;
    color: #fcfcfc;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.25px;
    line-height: normal;
    transition:
      border-color 100ms ease,
      background 100ms ease,
      box-shadow 100ms ease,
      transform 100ms ease;
  }

  [data-hawk-eye-ui="text-input"]:hover {
    background: #434343;
  }

  [data-hawk-eye-ui="text-input"]:focus-visible {
    outline: none;
    border-color: var(--he-ring);
    background: #434343;
    box-shadow: 0 0 0 var(--spacing-xs) color-mix(in srgb, var(--he-ring) 18%, transparent);
  }

  [data-hawk-eye-ui="text-input"]:disabled {
    cursor: not-allowed;
    color: var(--he-muted);
    background: #3b3b3b;
    opacity: 0.6;
  }

  [data-hawk-eye-ui="range-input"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
  }

  [data-hawk-eye-ui="opacity-row"] {
    display: grid;
    gap: var(--spacing-base);
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
    gap: var(--spacing-xs) var(--spacing-base);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-10px);
  }

  [data-hawk-eye-ui="section-grid"] > [data-hawk-eye-ui="control"][data-span="full"] {
    grid-column: 1 / -1;
  }

  /* ── Shadow editor ───────────────────────────────────────────── */

  [data-hawk-eye-ui="shadow-editor"] {
    display: grid;
    gap: var(--spacing-sm);
  }

  [data-hawk-eye-ui="shadow-grid"] {
    display: grid;
    gap: var(--spacing-xs) var(--spacing-base);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  [data-hawk-eye-ui="shadow-field"] {
    display: grid;
    gap: var(--spacing-xs);
  }

  [data-hawk-eye-ui="shadow-color-row"] {
    display: grid;
    gap: var(--spacing-sm);
    grid-template-columns: 28px minmax(0, 1fr) auto;
    align-items: center;
  }

  /* ── Number input row ────────────────────────────────────────── */

  [data-hawk-eye-ui="number-input-shell"] {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-width: 0;
    min-height: 32px;
    padding: 8px 10px;
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    background: #3b3b3b;
    transition: border-color 100ms ease, background 100ms ease, box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="number-input-shell"]:hover {
    background: #434343;
  }

  [data-hawk-eye-ui="number-input-shell"]:focus-within {
    border-color: var(--he-ring);
    background: #434343;
    box-shadow: 0 0 0 var(--spacing-xs) color-mix(in srgb, var(--he-ring) 18%, transparent);
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="text-input"] {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    color: #ffffff;
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="text-input"]:hover,
  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="text-input"]:focus-visible {
    background: transparent;
    border: none;
    box-shadow: none;
    outline: none;
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="text-input"]::placeholder {
    color: var(--he-muted);
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="text-input"]:disabled {
    background: transparent;
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="select-input"] {
    width: auto;
    min-width: 0;
    min-height: 0;
    padding: 0 var(--spacing-14px) 0 0;
    border: none;
    border-radius: 0;
    background-color: transparent;
    background-position: right 0 center;
    color: var(--he-label);
    box-shadow: none;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="select-input"]:hover,
  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="select-input"]:focus-visible {
    background-color: transparent;
    border: none;
    box-shadow: none;
    outline: none;
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
    font-size: var(--font-size-xs);
  }

  [data-hawk-eye-ui="control-reset"],
  [data-hawk-eye-ui="pill-button"] {
    padding: var(--spacing-xs) 7px;
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
    padding: 0 var(--spacing-md);
    font-weight: var(--font-weight-base);
    font-size: var(--font-size-sm);
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
    gap: var(--spacing-sm);
  }

  [data-hawk-eye-ui="changes-card"] {
    display: grid;
    gap: 8px;
    min-height: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: #3b3b3b;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    transform: translateY(0);
    transition:
      border-color 140ms var(--he-ease-out),
      background 140ms var(--he-ease-out),
      box-shadow 140ms var(--he-ease-out),
      transform var(--duration-base) var(--he-ease-out);
  }

  [data-hawk-eye-ui="changes-card"][data-clickable="true"] {
    cursor: pointer;
  }

  [data-hawk-eye-ui="changes-card"][data-active="true"] {
    border-color: rgba(255, 255, 255, 0.08);
    background: #414141;
    box-shadow: none;
  }

  [data-hawk-eye-ui="changes-card"][data-clickable="true"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
  }

  [data-hawk-eye-ui="changes-card-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  [data-hawk-eye-ui="changes-card-copy"] {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  [data-hawk-eye-ui="changes-card-source"] {
    margin: 0;
    color: #bcbcbc;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    line-height: 1;
    letter-spacing: -0.25px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="changes-card-actions"] {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
  }

  [data-hawk-eye-ui="changes-count"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 17px;
    height: 17px;
    padding: 0 4.5px;
    border-radius: 4px;
    background: #ffffff;
    color: #3b3b3b;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    line-height: 1;
    letter-spacing: -0.25px;
  }

  [data-hawk-eye-ui="changes-reset-btn"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #bcbcbc;
    cursor: pointer;
    border-radius: 4px;
    transition:
      background 120ms var(--he-ease-out),
      color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="changes-reset-btn"] svg {
    width: 12px;
    height: 12px;
  }

  [data-hawk-eye-ui="changes-card-body"] {
    display: grid;
    gap: 8px;
    align-content: start;
  }

  [data-hawk-eye-ui="changes-card-row"] {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }

  [data-hawk-eye-ui="changes-card-label"] {
    flex-shrink: 0;
    color: #dddddd;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.25px;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="changes-card-value"] {
    min-width: 0;
    flex: 1 1 auto;
    color: #ffffff;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.25px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="changes-card-overlay"] {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 50%, rgba(255, 255, 255, 0.04), transparent 26%),
      radial-gradient(circle at 43% 12%, rgba(255, 255, 255, 0.14), transparent 14%),
      radial-gradient(circle at 72% 52%, rgba(255, 255, 255, 0.05), transparent 28%),
      rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    opacity: 0;
    transform: scale(0.985);
    pointer-events: none;
    transition:
      opacity var(--hawk-eye-status-duration, 160ms) var(--he-ease-out),
      transform var(--hawk-eye-status-duration, 160ms) var(--he-ease-out),
      filter var(--hawk-eye-status-duration, 160ms) var(--he-ease-out);
  }

  [data-hawk-eye-ui="changes-card-overlay"][data-state="active"] {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  [data-hawk-eye-ui="changes-card-overlay"][data-state="active"] {
    @starting-style {
      opacity: 0;
      transform: scale(0.985);
      filter: blur(4px);
    }
  }

  [data-hawk-eye-ui="changes-overlay-actions"] {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  [data-hawk-eye-ui="overlay-reset-btn"],
  [data-hawk-eye-ui="overlay-keep-btn"] {
    min-width: 58px;
    min-height: 28px;
    padding: 7px 14px;
    border: 0;
    border-radius: 6px;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    line-height: 1;
    letter-spacing: -0.25px;
    cursor: pointer;
    transition:
      background 120ms var(--he-ease-out),
      color 120ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
  }

  [data-hawk-eye-ui="overlay-reset-btn"] {
    background: #ffffff;
    color: #111111;
  }

  [data-hawk-eye-ui="overlay-keep-btn"] {
    background: #e1f1ff;
    color: #007ef4;
  }

  /* ── Inspector detail list ───────────────────────────────────── */

  [data-hawk-eye-ui="detail"] {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: var(--spacing-xs);
    align-items: baseline;
  }

  [data-hawk-eye-ui="label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="value"] {
    color: var(--he-fg);
    font-family: var(--he-font-mono);
    font-size: var(--font-size-xs);
    line-height: 1.4;
    word-break: break-word;
  }

  [data-hawk-eye-ui="hint"] {
    margin: var(--spacing-md);
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  [data-hawk-eye-ui="empty-state"] {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    height: 100%;
    padding: 28px var(--spacing-lg);
    text-align: center;
  }

  [data-hawk-eye-ui="empty-state-icon"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: var(--spacing-1px) solid var(--he-input-border);
    border-radius: var(--spacing-14px);
    background: color-mix(in srgb, var(--he-surface-2) 88%, black 12%);
    color: var(--he-accent);
    opacity: 1;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="empty-state-title"] {
    margin: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 15px;
    font-weight: var(--font-weight-strong);
    letter-spacing: -0.03em;
  }

  [data-hawk-eye-ui="empty-state-body"] {
    margin: 0;
    max-width: 240px;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
    line-height: 1.6;
  }

  /* ── Trigger button ──────────────────────────────────────────── */

  [data-hawk-eye-ui="trigger"] {
    position: fixed;
    right: var(--spacing-xl);
    bottom: var(--spacing-xl);
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-base);
    border: 1.5px solid var(--he-trigger-border-color);
    border-radius: var(--radius-full);
    overflow: clip;
    background: var(--he-trigger-bg);
    color: var(--he-fg);
    cursor: pointer;
    pointer-events: auto;
    backdrop-filter: blur(var(--he-trigger-blur));
    -webkit-backdrop-filter: blur(var(--he-trigger-blur));
    box-shadow: 0 16px 40px rgba(3, 6, 11, 0.34);
    opacity: 1;
    transform: translateY(0) scale(1);
    transform-origin: bottom right;
    transition:
      opacity var(--hawk-eye-shell-duration, 220ms) var(--he-ease-out),
      transform var(--hawk-eye-shell-duration, 220ms) var(--he-ease-out),
      background 120ms var(--he-ease-out),
      border-color 120ms var(--he-ease-out),
      box-shadow 120ms var(--he-ease-out);
  }

  [data-hawk-eye-ui="trigger"][data-state="entering"] {
    @starting-style {
      opacity: 0;
      transform: translateY(10px) scale(0.985);
    }
  }

  [data-hawk-eye-ui="trigger"][data-state="exiting"] {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
    pointer-events: none;
  }

  [data-hawk-eye-ui="trigger"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-xs);
  }

  [data-hawk-eye-ui="trigger-brand-mark"] {
    display: inline-flex;
    width: var(--spacing-2xl);
    height: var(--spacing-2xl);
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="trigger-brand-image"] {
    display: block;
    width: var(--spacing-2xl);
    height: var(--spacing-2xl);
    object-fit: contain;
  }

  [data-hawk-eye-ui="trigger-copy"] {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  /* ── Select input ────────────────────────────────────────────── */

  [data-hawk-eye-ui="select-input"] {
    width: 100%;
    min-height: 32px;
    padding: 8px 28px 8px 10px;
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    background: #3b3b3b;
    color: #fcfcfc;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.25px;
    line-height: normal;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%238c8c8c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    transition:
      border-color 100ms ease,
      background 100ms ease,
      box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="select-input"]:hover {
    background-color: #434343;
  }

  [data-hawk-eye-ui="select-input"]:focus-visible {
    outline: none;
    border-color: var(--he-ring);
    background-color: #434343;
    box-shadow: 0 0 0 var(--spacing-xs) color-mix(in srgb, var(--he-ring) 18%, transparent);
  }

  /* ── Segmented control ───────────────────────────────────────── */

  [data-hawk-eye-ui="segmented-row"] {
    display: flex;
    gap: 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #4b4b4b;
    background: #3b3b3b;
    padding: 2px;
  }

  [data-hawk-eye-ui="segmented-button"] {
    flex: 1;
    min-height: 28px;
    padding: 6px 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #b3b3b3;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    letter-spacing: -0.25px;
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="segmented-button"]:last-child {
    border-right: 0;
  }

  [data-hawk-eye-ui="segmented-button"][data-active="true"] {
    background: #f5f5f5;
    color: #111111;
    font-weight: var(--font-weight-base);
  }

  [data-hawk-eye-ui="segmented-button"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: -2px;
  }

  /* ── Toggle control ──────────────────────────────────────────── */

  [data-hawk-eye-ui="toggle-row"] {
    display: flex;
    gap: 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #4b4b4b;
    background: #3b3b3b;
    padding: 2px;
  }

  [data-hawk-eye-ui="toggle-button"] {
    flex: 1;
    min-height: 28px;
    padding: 6px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #b3b3b3;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    letter-spacing: -0.25px;
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="toggle-button"][data-active="true"] {
    background: #f5f5f5;
    color: #111111;
    font-weight: var(--font-weight-base);
  }

  [data-hawk-eye-ui="toggle-button"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: -2px;
  }

  /* ── Color input ─────────────────────────────────────────────── */

  [data-hawk-eye-ui="color-row"] {
    display: flex;
    gap: 8px;
    align-items: center;
    background: #3b3b3b;
    border-radius: 8px;
    padding: 8px 10px;
    min-height: 32px;
    border: 1px solid #4b4b4b;
    transition: border-color 100ms ease, background 100ms ease;
  }

  [data-hawk-eye-ui="color-swatch"] {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border-radius: var(--radius-sm);
    border: var(--spacing-1px) solid rgba(255, 255, 255, 0.1);
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
    gap: 12px;
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
    color: #9a9a9a;
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0;
    text-transform: none;
  }

  [data-hawk-eye-ui="grid-track-editor"] {
    display: grid;
    gap: var(--spacing-base);
  }

  [data-hawk-eye-ui="grid-track-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-base);
  }

  [data-hawk-eye-ui="grid-track-title"] {
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: 13px;
    font-weight: var(--font-weight-base);
    letter-spacing: -0.25px;
  }

  [data-hawk-eye-ui="grid-track-list"] {
    display: grid;
    gap: var(--spacing-base);
  }

  [data-hawk-eye-ui="grid-track-row"] {
    display: grid;
    grid-template-columns: 18px 90px minmax(0, 1fr) 28px;
    gap: var(--spacing-base);
    align-items: center;
  }

  [data-hawk-eye-ui="grid-track-index"] {
    color: var(--he-muted);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
    line-height: 1;
    text-align: center;
  }

  [data-hawk-eye-ui="grid-track-editor"] [data-hawk-eye-ui="select-input"] {
    min-height: 32px;
  }

  [data-hawk-eye-ui="grid-track-value-shell"] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--spacing-sm);
    align-items: center;
    min-height: 32px;
    padding: var(--spacing-base) var(--spacing-10px);
    border: var(--spacing-1px) solid transparent;
    border-radius: var(--radius-md);
    background: var(--he-input);
    transition: border-color 100ms ease, background 100ms ease, box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="grid-track-value-shell"]:hover {
    background: var(--he-input-hover);
  }

  [data-hawk-eye-ui="grid-track-value-shell"]:focus-within {
    border-color: var(--he-ring);
    background: var(--he-bg);
    box-shadow: 0 0 0 var(--spacing-2px) rgba(13, 135, 247, 0.2);
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
    border-radius: var(--radius-md);
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
    box-shadow: 0 0 0 var(--spacing-2px) rgba(13, 135, 247, 0.25);
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
    font-size: var(--font-size-xs);
    letter-spacing: -0.2px;
    line-height: 1.4;
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="number-input-row"] {
    align-items: center;
    gap: var(--spacing-xs);
    min-height: 32px;
    padding: var(--spacing-base) var(--spacing-10px);
    border: var(--spacing-1px) solid transparent;
    border-radius: var(--radius-md);
    background: var(--he-input);
    transition: background 100ms ease, border-color 100ms ease, box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="number-input-row"]:hover {
    background: var(--he-input-hover);
  }

  [data-hawk-eye-ui="labelled-row"][data-appearance-row="true"] [data-property-id="opacity"] [data-hawk-eye-ui="number-input-row"]:focus-within {
    border-color: var(--he-ring);
    box-shadow: 0 0 0 var(--spacing-2px) rgba(13, 135, 247, 0.2);
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
    padding: var(--spacing-base) 26px var(--spacing-base) var(--spacing-10px);
    font-size: 13.5px;
    line-height: normal;
  }

  /* ── Static (non-collapsible) section ───────────────────────────── */

  [data-hawk-eye-ui="static-section"] {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin: 0;
    padding: 16px 0;
    border-top: 1px solid #595959;
    border-bottom: none;
    background: transparent;
  }

  [data-hawk-eye-ui="static-section"]:first-child {
    margin-top: 0;
    border-top: none;
  }

  [data-hawk-eye-ui="static-section"]:last-child {
    border-bottom: none;
  }

  [data-hawk-eye-ui="static-section-header"] {
    display: flex;
    align-items: center;
    padding: 0;
    min-height: 18px;
  }

  [data-hawk-eye-ui="static-section-body"] {
    padding: 0;
  }

  /* ── (Legacy) collapsible section ───────────────────────────────── */

  [data-hawk-eye-ui="collapsible-section"] {
    border-radius: 0;
    background: transparent;
    border: none;
    border-top: var(--spacing-1px) solid var(--he-divider);
    overflow: visible;
  }

  [data-hawk-eye-ui="collapsible-section"]:first-child {
    border-top: none;
  }

  [data-hawk-eye-ui="collapsible-header"] {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    width: 100%;
    padding: var(--spacing-10px) var(--spacing-md) var(--spacing-base);
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  [data-hawk-eye-ui="collapsible-header"]:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  [data-hawk-eye-ui="collapsible-header"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: -2px;
  }

  [data-hawk-eye-ui="collapsible-chevron"] {
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 4px solid var(--he-label);
    border-top: var(--spacing-xs) solid transparent;
    border-bottom: var(--spacing-xs) solid transparent;
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
    gap: var(--spacing-1px);
    min-width: 0;
    flex: 1;
  }

  [data-hawk-eye-ui="section-subtitle"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    letter-spacing: -0.25px;
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
    gap: var(--spacing-sm);
    width: 100%;
    min-width: 0;
  }

  [data-hawk-eye-ui="per-side-row"] {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    width: 100%;
    min-width: 0;
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
    min-width: 0;
    height: 32px;
    padding: 8px 10px;
    background: #3b3b3b;
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    transition: border-color 100ms ease, background 100ms ease, box-shadow 100ms ease;
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
    font-size: 13.5px;
    letter-spacing: -0.25px;
    line-height: normal;
  }

  [data-hawk-eye-ui="per-side-all-input"] [data-hawk-eye-ui="input-unit-label"] {
    margin-left: auto;
  }

  [data-hawk-eye-ui="per-side-all-input"] [data-hawk-eye-ui="text-input"]:hover,
  [data-hawk-eye-ui="per-side-all-input"] [data-hawk-eye-ui="text-input"]:focus-visible {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* "Each" mode: 4 separate rounded pill inputs */
  [data-hawk-eye-ui="per-side-each-pills"] {
    flex: 1;
    display: flex;
    gap: var(--spacing-xs);
    min-width: 0;
  }

  [data-hawk-eye-ui="per-side-opposite-pills"] {
    flex: 1;
    display: flex;
    gap: var(--spacing-xs);
    min-width: 0;
  }

  [data-hawk-eye-ui="per-side-pill"] {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    background: #3b3b3b;
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    height: 32px;
    padding: 8px 10px;
    min-width: 0;
    transition: border-color 100ms ease, background 100ms ease, box-shadow 100ms ease;
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
    color: #ffffff;
    font-size: 13.5px;
    letter-spacing: -0.25px;
    line-height: normal;
  }

  [data-hawk-eye-ui="per-side-pill"] [data-hawk-eye-ui="text-input"]:hover,
  [data-hawk-eye-ui="per-side-pill"] [data-hawk-eye-ui="text-input"]:focus-visible {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  [data-hawk-eye-ui="per-side-all-input"]:focus-within,
  [data-hawk-eye-ui="per-side-pill"]:focus-within {
    border-color: var(--he-ring);
    background: #434343;
    box-shadow: 0 0 0 var(--spacing-xs) color-mix(in srgb, var(--he-ring) 18%, transparent);
  }

  [data-hawk-eye-ui="per-side-all-input"]:hover,
  [data-hawk-eye-ui="per-side-pill"]:hover {
    background: #434343;
  }

  /* Link / Broken-link toggle button for per-side controls */
  [data-hawk-eye-ui="link-toggle-btn"] {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 6px;
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    background: #3b3b3b;
    color: #bcbcbc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  [data-hawk-eye-ui="link-toggle-btn"][data-linked="true"] {
    background: #e1f1ff;
    border-color: #e1f1ff;
    color: #007ef4;
  }

  [data-hawk-eye-ui="link-toggle-btn"]:hover {
    background: #434343;
  }

  [data-hawk-eye-ui="link-toggle-btn"][data-linked="true"]:hover {
    background: #eef7ff;
    border-color: #eef7ff;
  }

  [data-hawk-eye-ui="link-toggle-btn"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
  }

  [data-hawk-eye-ui="link-toggle-btn"] svg {
    width: 20px;
    height: 20px;
  }

  /* Unit label: muted "px" / "em" etc */
  [data-hawk-eye-ui="input-unit-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    letter-spacing: -0.25px;
    line-height: normal;
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
    padding: 0 var(--spacing-xs);
    border-radius: var(--radius-xs);
    cursor: ew-resize;
    user-select: none;
    color: var(--he-label);
    font-family: var(--he-font-mono);
    font-size: var(--spacing-10px);
    font-weight: var(--font-weight-base);
    letter-spacing: 0.02em;
    flex-shrink: 0;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="scrub-label"]:hover {
    background: var(--he-input);
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="scrub-label"] {
    min-width: 12px;
    min-height: 0;
    padding: 0;
    border-radius: 0;
    background: transparent;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    font-weight: 400;
    letter-spacing: -0.25px;
    line-height: normal;
  }

  [data-hawk-eye-ui="number-input-shell"] [data-hawk-eye-ui="scrub-label"]:hover {
    background: transparent;
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="number-input-with-scrub"] {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: var(--spacing-2px);
    align-items: center;
  }

  [data-hawk-eye-ui="number-input-with-scrub"][data-scrubbing="true"] [data-hawk-eye-ui="scrub-label"] {
    background: var(--he-accent);
    color: #ffffff;
  }

  [data-hawk-eye-ui="number-input-shell"][data-scrubbing="true"] [data-hawk-eye-ui="scrub-label"] {
    color: #ffffff;
  }

  [data-hawk-eye-ui="number-input-with-scrub"] [data-hawk-eye-ui="select-input"] {
    min-height: 32px;
    font-size: var(--font-size-sm);
    padding: 0 20px 0 var(--spacing-sm);
  }

  /* ── Compact row (2-col paired inputs) ────────────────────────── */

  [data-hawk-eye-ui="compact-row"] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  [data-hawk-eye-ui="compact-row-full"] {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
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
    padding: 8px;
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    background: #3b3b3b;
    color: #9a9a9a;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"][data-locked="true"] {
    background: #f5f5f5;
    border-color: #f5f5f5;
    color: #111111;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"]:hover {
    background: #434343;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"][data-locked="true"]:hover {
    background: #ffffff;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-button"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
  }

  [data-hawk-eye-ui="aspect-ratio-lock-icon"] {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  [data-hawk-eye-ui="aspect-ratio-lock-icon"] svg {
    display: block;
    width: 14.5833px;
    height: 16.25px;
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
    gap: 8px;
    width: 100%;
    min-width: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: #3b3b3b;
    overflow: hidden;
    border: 1px solid #4b4b4b;
    transition:
      background 100ms ease,
      border-color 100ms ease,
      box-shadow 100ms ease;
  }

  [data-hawk-eye-ui="size-input-label"] {
    flex-shrink: 0;
    color: #9a9a9a;
    font-size: 13.5px;
    font-family: var(--he-font-ui);
    letter-spacing: -0.25px;
    width: 12px;
    text-align: center;
  }

  [data-hawk-eye-ui="size-input-token"] {
    flex: 1;
    min-width: 0;
    color: #fcfcfc;
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
    color: #fcfcfc;
    cursor: pointer;
    display: flex;
    flex: 1;
    gap: var(--spacing-xs);
    min-width: 0;
    padding: 0;
  }

  [data-hawk-eye-ui="size-input-token-chevron"] {
    color: #9a9a9a;
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
    color: #9a9a9a;
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
    color: #fcfcfc;
    font-size: 13.5px;
    font-family: var(--he-font-ui);
    min-width: 28px;
  }

  [data-hawk-eye-ui="size-input-value-input"]::placeholder {
    color: #9a9a9a;
  }

  [data-hawk-eye-ui="size-input-unit-text"] {
    flex-shrink: 0;
    color: #9a9a9a;
    font-size: 13.5px;
    font-family: var(--he-font-ui);
    white-space: nowrap;
  }

  [data-hawk-eye-ui="size-input-pill"]:focus-within {
    border-color: var(--he-ring);
    background: #434343;
    box-shadow: 0 0 0 var(--spacing-xs) color-mix(in srgb, var(--he-ring) 18%, transparent);
  }

  [data-hawk-eye-ui="size-input-value-input"]:focus-visible,
  [data-hawk-eye-ui="size-input-token-trigger"]:focus-visible,
  [data-hawk-eye-ui="size-input-menu-button"]:focus-visible {
    outline: none;
  }

  [data-hawk-eye-ui="size-input-menu"] {
    position: absolute;
    top: calc(100% + var(--spacing-base));
    left: 0;
    z-index: 12;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
    min-width: 120px;
    padding: var(--spacing-base) var(--spacing-10px);
    border: var(--spacing-1px) solid var(--he-panel-border);
    border-radius: var(--radius-md);
    background: var(--he-input);
    box-shadow:
      0 var(--spacing-xs) 6px rgba(0, 0, 0, 0.01),
      0 11px 11px rgba(0, 0, 0, 0.01),
      0 24px var(--spacing-14px) rgba(0, 0, 0, 0.01);
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
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
    border-radius: var(--radius-sm);
  }

  /* ── Typography sub-labels ──────────────────────────────────────── */

  [data-hawk-eye-ui="typo-label-row"] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-xs);
    margin-bottom: calc(-1 * var(--spacing-2px));
  }

  [data-hawk-eye-ui="typo-label-row"] span {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    font-weight: 400;
    letter-spacing: 0.01em;
    padding-left: var(--spacing-base);
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="typo-align-header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: calc(-1 * var(--spacing-2px));
  }

  [data-hawk-eye-ui="typo-section-label"] {
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: 11.5px;
    font-weight: 400;
    letter-spacing: -0.25px;
    padding-left: 0;
    text-transform: none;
  }

  /* ── Icon segmented control (text-align, etc.) ──────────────────── */

  [data-hawk-eye-ui="icon-segmented"] {
    display: flex;
    gap: 0;
    background: #3b3b3b;
    border-radius: 8px;
    overflow: hidden;
  }

  [data-hawk-eye-ui="icon-seg-btn"] {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: var(--spacing-sm) var(--spacing-xs);
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #b3b3b3;
    cursor: pointer;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="segmented-icon"] {
    display: block;
    width: 20px;
    height: 20px;
    pointer-events: none;
    user-select: none;
  }

  [data-hawk-eye-ui="icon-seg-btn"]:hover {
    background: #434343;
    color: #fcfcfc;
  }

  [data-hawk-eye-ui="icon-seg-btn"][data-active="true"] {
    background: #f5f5f5;
    color: #111111;
    border: none;
    border-radius: 8px;
  }

  /* ── Compact card (individual property in new panel) ──────────── */

  [data-hawk-eye-ui="compact-card"] {
    display: grid;
    gap: 6px;
    position: relative;
  }

  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="select-input"],
  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="number-input-shell"] {
    border: 1px solid var(--he-dirty-border);
  }

  [data-hawk-eye-ui="compact-card"][data-invalid="true"] [data-hawk-eye-ui="text-input"],
  [data-hawk-eye-ui="compact-card"][data-invalid="true"] [data-hawk-eye-ui="select-input"],
  [data-hawk-eye-ui="compact-card"][data-invalid="true"] [data-hawk-eye-ui="number-input-shell"] {
    border: var(--spacing-1px) solid var(--he-destructive-border);
  }

  /* Color row dirty/invalid — border on the container, not the inner input */
  [data-hawk-eye-ui="compact-card"][data-dirty="true"] [data-hawk-eye-ui="color-row"] {
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
    border-radius: var(--radius-xs);
    background: color-mix(in srgb, var(--he-dirty) 88%, #704400 12%);
    color: #ffffff;
    cursor: pointer;
    font-size: var(--spacing-10px);
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(1);
    transition:
      opacity 100ms var(--he-ease-out),
      transform var(--he-press-duration) var(--he-ease-out);
    z-index: 1;
  }

  [data-hawk-eye-ui="control-reset-mini"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
  }

  [data-hawk-eye-ui="compact-card"]:focus-within [data-hawk-eye-ui="control-reset-mini"] {
    opacity: 1;
  }

  [data-hawk-eye-ui="per-side-wrap"] {
    display: grid;
    gap: var(--spacing-2px);
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
    border-radius: var(--radius-sm);
  }

  [data-hawk-eye-ui="color-swatch-btn"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-1px);
  }

  /* ── Color picker popover ─────────────────────────────────────── */

  [data-hawk-eye-ui="color-popover"] {
    z-index: 2147483647;
    width: 232px;
    padding: var(--spacing-10px);
    border-radius: var(--radius-md);
    background: var(--he-bg);
    border: var(--spacing-1px) solid var(--he-panel-border);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.5),
      0 0 0 var(--spacing-1px) rgba(255, 255, 255, 0.06);
    display: grid;
    gap: var(--spacing-base);
    pointer-events: auto;
  }


  [data-hawk-eye-ui="color-canvas-wrap"] {
    position: relative;
    width: 100%;
    height: 140px;
    border-radius: 6px;
    overflow: hidden;
    cursor: crosshair;
    touch-action: none;
    user-select: none;
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
    border: var(--spacing-2px) solid white;
    box-shadow: 0 0 0 var(--spacing-1px) rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  [data-hawk-eye-ui="color-sliders"] {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: var(--spacing-sm);
    align-items: center;
  }

  [data-hawk-eye-ui="color-slider-stack"] {
    display: grid;
    gap: var(--spacing-sm);
  }

  [data-hawk-eye-ui="color-swatch-preview"] {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: var(--spacing-1px) solid rgba(0, 0, 0, 0.12);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23ccc'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23ccc'/%3E%3C/svg%3E");
    background-size: 8px 8px;
  }

  [data-hawk-eye-ui="hue-slider"],
  [data-hawk-eye-ui="alpha-slider"] {
    display: block;
    width: 100%;
    height: var(--spacing-10px);
    border-radius: var(--spacing-sm);
    appearance: none;
    cursor: pointer;
    border: none;
    outline: none;
  }

  [data-hawk-eye-ui="hue-slider"]:focus-visible,
  [data-hawk-eye-ui="alpha-slider"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
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
    width: var(--spacing-14px);
    height: var(--spacing-14px);
    border-radius: 50%;
    background: white;
    border: var(--spacing-2px) solid rgba(0, 0, 0, 0.2);
    box-shadow: 0 var(--spacing-1px) var(--spacing-xs) rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  [data-hawk-eye-ui="hue-slider"]::-moz-range-thumb,
  [data-hawk-eye-ui="alpha-slider"]::-moz-range-thumb {
    width: var(--spacing-14px);
    height: var(--spacing-14px);
    border-radius: 50%;
    background: white;
    border: var(--spacing-2px) solid rgba(0, 0, 0, 0.2);
    box-shadow: 0 var(--spacing-1px) var(--spacing-xs) rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  /* ── Color tabs ───────────────────────────────────────────────── */

  [data-hawk-eye-ui="color-tabs"] {
    display: flex;
    gap: var(--spacing-2px);
    border-radius: var(--spacing-sm);
    background: var(--he-input);
    padding: var(--spacing-2px);
  }

  [data-hawk-eye-ui="color-tab"] {
    flex: 1;
    min-height: 22px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-xs);
    background: transparent;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    font-weight: var(--font-weight-base);
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: background 80ms ease, color 80ms ease;
  }

  [data-hawk-eye-ui="color-tab"][data-active="true"] {
    background: #404040;
    color: var(--he-fg);
    box-shadow: 0 var(--spacing-1px) var(--spacing-xs) rgba(0, 0, 0, 0.4);
  }

  /* ── Color fields ─────────────────────────────────────────────── */

  [data-hawk-eye-ui="color-fields"] {
    display: flex;
    gap: var(--spacing-xs);
    align-items: stretch;
  }

  [data-hawk-eye-ui="color-fallback-fields"] {
    display: flex;
    gap: var(--spacing-xs);
    align-items: stretch;
  }

  [data-hawk-eye-ui="color-field-wrap"] {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex: 1;
    position: relative;
  }

  [data-hawk-eye-ui="color-field-wrap"] [data-hawk-eye-ui="text-input"] {
    text-align: center;
    padding: 0 var(--spacing-xs);
    min-height: 24px;
    font-size: var(--font-size-xs);
  }

  /* Hex input with # prefix inside the field */
  [data-hawk-eye-ui="color-field-wrap"] [data-hawk-eye-ui="color-field-label"] {
    position: absolute;
    left: var(--spacing-xs);
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    color: var(--he-label);
    font-size: var(--font-size-xs);
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
    gap: var(--spacing-sm);
    align-items: center;
  }

  /* ── Panel tabs (Properties | Layers) ────────────────────────── */

  [data-hawk-eye-ui="panel-tabs"] {
    display: flex;
    gap: 0;
    margin: 0 16px;
    padding: 2px;
    border: 0;
    border-radius: 10px;
    background: #3b3b3b;
    flex-shrink: 0;
  }

  [data-hawk-eye-ui="panel-tab"] {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 32px;
    padding: 7px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #b3b3b3;
    font-family: var(--he-font-ui);
    font-size: 13.5px;
    font-weight: 400;
    cursor: pointer;
    letter-spacing: -0.02em;
    transition:
      background 80ms ease,
      color 80ms ease;
  }

  [data-hawk-eye-ui="panel-tab"]:hover {
    background: #434343;
    color: #fcfcfc;
  }

  [data-hawk-eye-ui="panel-tab"][data-active="true"] {
    background: #f5f5f5;
    color: #111111;
  }

  [data-hawk-eye-ui="panel-tab-icon"] {
    display: inline-flex;
    align-items: center;
  }

  [data-hawk-eye-ui="panel-tab-count"] {
    display: none;
  }

  [data-hawk-eye-ui="panel-tab"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: -2px;
  }

  /* ── Layers tree ─────────────────────────────────────────────── */

  [data-hawk-eye-ui="layers-section"] {
    display: grid;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
  }

  [data-hawk-eye-ui="layers-heading-row"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-base);
  }

  [data-hawk-eye-ui="layers-heading"] {
    margin: 0;
    color: var(--he-fg);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-strong);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="layers-count"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    min-height: 24px;
    padding: 0 var(--spacing-base);
    border: var(--spacing-1px) solid var(--he-input-border);
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--he-surface-2) 88%, black 12%);
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--spacing-10px);
    font-weight: var(--font-weight-strong);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  [data-hawk-eye-ui="layers-summary"] {
    margin: calc(-1 * var(--spacing-xs)) 0 0;
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  [data-hawk-eye-ui="layers-tree"] {
    display: grid;
    gap: 0;
  }

  [data-hawk-eye-ui="layer-row"] {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-height: 28px;
    padding: var(--spacing-xs) var(--spacing-base);
    border: var(--spacing-1px) solid transparent;
    border-radius: var(--radius-sm);
    user-select: none;
    transition:
      background 60ms ease,
      border-color 60ms ease,
      transform 60ms ease;
  }

  [data-hawk-eye-ui="layer-row"]:focus-within,
  [data-hawk-eye-ui="layer-row"]:hover {
    background: color-mix(in srgb, var(--he-surface-2) 82%, black 18%);
    border-color: var(--he-input-border);
  }

  [data-hawk-eye-ui="layer-row"][data-selected="true"] {
    background: color-mix(in srgb, var(--he-accent) 10%, var(--he-input) 90%);
    border-color: var(--he-selection-border);
    color: var(--he-fg);
    transform: translateX(2px);
  }

  [data-hawk-eye-ui="layer-expand-btn"] {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    background: none;
    border: 0;
    color: var(--he-muted);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 80ms ease, transform 120ms ease;
  }

  [data-hawk-eye-ui="layer-expand-btn"]:not([data-expanded]) {
    visibility: hidden;
  }

  [data-hawk-eye-ui="layer-expand-btn"][data-expanded="false"] {
    transform: rotate(-90deg);
  }

  [data-hawk-eye-ui="layer-expand-btn"]:disabled {
    cursor: default;
  }

  [data-hawk-eye-ui="layer-expand-btn"]:hover {
    color: var(--he-label);
  }

  [data-hawk-eye-ui="layer-expand-btn"]:focus-visible,
  [data-hawk-eye-ui="layer-select-btn"]:focus-visible {
    outline: var(--spacing-2px) solid var(--he-ring);
    outline-offset: var(--spacing-2px);
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

  [data-hawk-eye-ui="layer-copy"] {
    display: grid;
    gap: var(--spacing-2px);
    min-width: 0;
    flex: 1;
  }

  [data-hawk-eye-ui="layer-label"] {
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
    color: var(--he-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }

  [data-hawk-eye-ui="layer-source"] {
    color: var(--he-muted);
    font-family: var(--he-font-mono);
    font-size: var(--spacing-10px);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-hawk-eye-ui="layer-row"][data-selected="true"] [data-hawk-eye-ui="layer-label"] {
    color: var(--he-fg);
  }

  [data-hawk-eye-ui="layer-row"][data-selected="true"] [data-hawk-eye-ui="layer-source"] {
    color: var(--he-label);
  }

  [data-hawk-eye-ui="layers-empty"] {
    padding: var(--spacing-lg);
    color: var(--he-label);
    font-family: var(--he-font-ui);
    font-size: var(--font-size-sm);
  }

  [data-hawk-eye-ui="panel-resize"] {
    position: absolute;
    right: var(--spacing-10px);
    bottom: var(--spacing-10px);
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
    width: var(--spacing-10px);
    height: var(--spacing-10px);
  }

  [data-hawk-eye-ui="panel-resize"]::after {
    width: 6px;
    height: 6px;
    right: var(--spacing-xs);
    bottom: var(--spacing-xs);
  }

  /* ── Responsive ──────────────────────────────────────────────── */

  @media (max-width: 640px) {
    [data-hawk-eye-ui="trigger"] {
      right: var(--spacing-lg);
      bottom: var(--spacing-lg);
      padding: var(--spacing-base);
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

  @media (hover: hover) and (pointer: fine) {
    [data-hawk-eye-ui="panel-close-btn"]:hover {
      background: color-mix(in srgb, var(--he-surface-contrast) 10%, transparent);
      border-color: var(--he-input-border);
      color: var(--he-fg);
    }

    [data-hawk-eye-ui="panel-back-btn"]:hover {
      background: color-mix(in srgb, var(--he-surface-contrast) 10%, transparent);
      border-color: var(--he-input-border);
      color: var(--he-fg);
    }

    [data-hawk-eye-ui="footer-changes-btn"]:hover {
      background: #ebebeb;
      box-shadow: 0 12px 24px rgba(3, 6, 11, 0.18);
    }

    [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-apply-btn"]:hover,
    [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-apply-btn"]:hover {
      box-shadow: 0 12px 24px rgba(17, 103, 198, 0.18);
    }

    [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-apply-btn"]:hover {
      background: #d5eaff;
    }

    [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-preview-toggle-btn"]:hover,
    [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-revert-btn"]:hover,
    [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-hide-btn"]:hover,
    [data-hawk-eye-ui="panel-footer"][data-view="changes"] [data-hawk-eye-ui="footer-revert-btn"]:hover {
      background: #474747;
      box-shadow: 0 var(--spacing-10px) 20px rgba(3, 6, 11, 0.16);
    }

    [data-hawk-eye-ui="panel-footer"][data-view="properties"] [data-hawk-eye-ui="footer-preview-toggle-btn"][data-active="true"]:hover {
      background: #2568e4;
    }

    [data-hawk-eye-ui="footer-reset-btn"]:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--he-fg);
    }

    [data-hawk-eye-ui="footer-icon-btn"]:hover {
      background: var(--he-input-hover);
    }

    [data-hawk-eye-ui="panel-meta-btn"]:hover {
      background: var(--he-input-hover);
      border-color: var(--he-selection-border);
    }

    [data-hawk-eye-ui="changes-card"][data-clickable="true"]:hover {
      border-color: rgba(255, 255, 255, 0.08);
      background: #414141;
      box-shadow: none;
      transform: translateY(0);
    }

    [data-hawk-eye-ui="changes-reset-btn"]:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--he-fg);
    }

    [data-hawk-eye-ui="trigger"]:hover {
      background: var(--he-trigger-hover);
      box-shadow: 0 18px 42px rgba(3, 6, 11, 0.38);
      transform: translateY(-1px) scale(1.01);
    }

    [data-hawk-eye-ui="compact-card"]:hover [data-hawk-eye-ui="control-reset-mini"] {
      opacity: 1;
    }
  }

  [data-hawk-eye-ui="panel-close-btn"]:active,
  [data-hawk-eye-ui="panel-back-btn"]:active,
  [data-hawk-eye-ui="panel-meta-btn"]:active,
  [data-hawk-eye-ui="footer-changes-btn"]:active,
  [data-hawk-eye-ui="footer-apply-btn"]:active,
  [data-hawk-eye-ui="footer-hide-btn"]:active,
  [data-hawk-eye-ui="footer-revert-btn"]:active,
  [data-hawk-eye-ui="footer-reset-btn"]:active,
  [data-hawk-eye-ui="footer-icon-btn"]:active,
  [data-hawk-eye-ui="changes-reset-btn"]:active,
  [data-hawk-eye-ui="overlay-reset-btn"]:active,
  [data-hawk-eye-ui="overlay-keep-btn"]:active,
  [data-hawk-eye-ui="control-reset-mini"]:active,
  [data-hawk-eye-ui="trigger"]:active {
    transform: scale(0.97);
  }

  [data-hawk-eye-ui="changes-card"][data-clickable="true"]:active {
    transform: translateY(1px) scale(0.995);
  }

  @media (prefers-reduced-motion: reduce) {
    [data-hawk-eye-ui="panel"],
    [data-hawk-eye-ui="trigger"],
    [data-hawk-eye-ui="panel-view"],
    [data-hawk-eye-ui="panel-meta"],
    [data-hawk-eye-ui="footer-status"],
    [data-hawk-eye-ui="changes-card"],
    [data-hawk-eye-ui="changes-card-overlay"],
    [data-hawk-eye-ui="panel-close-btn"],
    [data-hawk-eye-ui="panel-back-btn"],
    [data-hawk-eye-ui="panel-meta-btn"],
    [data-hawk-eye-ui="footer-changes-btn"],
    [data-hawk-eye-ui="footer-apply-btn"],
    [data-hawk-eye-ui="footer-hide-btn"],
    [data-hawk-eye-ui="footer-revert-btn"],
    [data-hawk-eye-ui="footer-reset-btn"],
    [data-hawk-eye-ui="footer-icon-btn"],
    [data-hawk-eye-ui="changes-reset-btn"],
    [data-hawk-eye-ui="overlay-reset-btn"],
    [data-hawk-eye-ui="overlay-keep-btn"],
    [data-hawk-eye-ui="control-reset-mini"] {
      animation: none !important;
      filter: none !important;
      transition-duration: 0ms !important;
    }

    [data-hawk-eye-ui="panel-view"],
    [data-hawk-eye-ui="panel-meta"],
    [data-hawk-eye-ui="footer-status"],
    [data-hawk-eye-ui="changes-card-overlay"] {
      transform: none !important;
    }
  }
`;
