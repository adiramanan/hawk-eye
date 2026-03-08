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
    right: 24px;
    bottom: 92px;
    width: min(320px, calc(100vw - 32px));
    padding: 16px;
    border-radius: 22px;
    background:
      linear-gradient(145deg, rgba(255, 247, 237, 0.96), rgba(255, 237, 213, 0.9));
    border: 1px solid rgba(251, 146, 60, 0.28);
    box-shadow:
      0 24px 60px rgba(15, 23, 42, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(18px);
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
    }
  }
`;
