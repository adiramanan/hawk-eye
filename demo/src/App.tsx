import { useState } from 'react';
import { DesignTool } from 'hawk-eye';
import { DesignLab } from './DesignLab';

type LaunchState =
  | 'idle'
  | 'opened'
  | 'already-open'
  | 'missing'
  | 'unavailable';

const runtimeFacts = [
  { label: 'Inspector', tone: 'live', value: 'Live in dev' },
  { label: 'Selection overlay', tone: 'live', value: 'Real DOM' },
  { label: 'Preview edits', tone: 'live', value: 'Session scoped' },
  { label: 'Source updates', tone: 'manual', value: 'Manual + opt-in' },
  { label: 'Entry surface', tone: 'dev', value: 'Local Vite app' },
] as const;

const workflowSteps = [
  {
    step: '01',
    title: 'Open the real runtime',
    body: 'Launch Hawk-Eye from this page instead of clicking fake product chrome.',
  },
  {
    step: '02',
    title: 'Lock a surface',
    body: 'Select a heading, caption, card shell, or metric tile and edit against the live DOM.',
  },
  {
    step: '03',
    title: 'Save from the panel',
    body: 'Detach, preview, and update source only inside the inspector where the actual write path lives.',
  },
] as const;

function openInspectorFromDemo(): Exclude<LaunchState, 'idle' | 'unavailable'> {
  const host = document.querySelector('[data-hawk-eye-ui="host"]');

  if (!(host instanceof HTMLElement) || !host.shadowRoot) {
    return 'missing';
  }

  if (host.shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')) {
    return 'already-open';
  }

  const trigger = host.shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]');

  if (trigger instanceof HTMLButtonElement) {
    trigger.click();
    return 'opened';
  }

  return 'missing';
}

function getLaunchMessage(state: LaunchState) {
  switch (state) {
    case 'opened':
      return 'Inspector opened. Click any specimen below to lock selection.';
    case 'already-open':
      return 'Inspector is already open. Click a surface to begin editing.';
    case 'missing':
      return 'The inspector host is still mounting. Try once more in a moment.';
    case 'unavailable':
      return 'The inspector is mounted only while the demo runs in development mode.';
    default:
      return null;
  }
}

export default function App() {
  const inspectorAvailable = import.meta.env.DEV;
  const [launchState, setLaunchState] = useState<LaunchState>('idle');
  const [view, setView] = useState<'demo' | 'design-lab'>('demo');
  const launchMessage = getLaunchMessage(launchState);

  function handleOpenInspector() {
    if (!inspectorAvailable) {
      setLaunchState('unavailable');
      return;
    }

    setLaunchState(openInspectorFromDemo());
  }

  if (view === 'design-lab') {
    return (
      <>
        <DesignLab onBack={() => setView('demo')} />
        {inspectorAvailable && <DesignTool />}
      </>
    );
  }

  return (
    <>
      <main className="he-shell">
        <div aria-hidden="true" className="he-grid" />
        <div aria-hidden="true" className="he-orb he-orb-a" />
        <div aria-hidden="true" className="he-orb he-orb-b" />

        <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="he-panel he-reveal">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-end">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="he-kicker">Pre-alpha workbench</span>
                  <span className="he-chip">React + Vite</span>
                  <span className="he-chip">Honest demo surface</span>
                </div>

                <div className="max-w-3xl space-y-4">
                  <p className="he-overline">Hawk-Eye</p>
                  <h1 className="text-[clamp(3rem,6vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-slate-950">
                    Shape UI directly on the live surface.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    This page is intentionally quiet. The floating inspector is the product,
                    this app is the specimen, and source updates only happen from inside the
                    panel where the actual write path exists.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    className="he-button he-button-primary"
                    onClick={handleOpenInspector}
                    type="button"
                  >
                    {inspectorAvailable ? 'Open Hawk-Eye' : 'Inspector Runs In Dev'}
                  </button>
                  <button
                    className="he-button"
                    onClick={() => setView('design-lab')}
                    type="button"
                  >
                    Design Lab →
                  </button>
                  <div className="he-inline-note">
                    Save happens inside the inspector, not from this page.
                  </div>
                </div>

                {launchMessage ? (
                  <p className="he-launch-note" role="status">
                    {launchMessage}
                  </p>
                ) : null}
              </div>

              <aside className="he-panel-dark he-reveal he-delay-1">
                <p className="he-panel-label he-panel-label-dark">Current runtime</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Pre-alpha, pointed at the real demo DOM.
                </h2>
                <div className="mt-6 space-y-3">
                  {runtimeFacts.map((fact) => (
                    <div className="he-fact-row" key={fact.label}>
                      <span className="text-sm text-slate-300">{fact.label}</span>
                      <span className="he-status-chip" data-tone={fact.tone}>
                        {fact.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="he-panel-label he-panel-label-dark">Public entrypoints</p>
                  <code className="he-code mt-3" style={{ fontFamily: "SFMono-Regular, Menlo, Monaco, monospace",
                      textAlign: "center"
                }}>hawk-eye · hawk-eye/vite</code>
                </div>
              </aside>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <article className="he-panel he-reveal he-delay-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="he-panel-label">Use this demo like a workbench</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                    Real workflow, minimal ceremony.
                  </h2>
                </div>
                <div className="he-chip he-chip-strong">
                  {inspectorAvailable ? 'Dev-only runtime is mounted' : 'Preview mode has no inspector'}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {workflowSteps.map((item) => (
                  <article className="he-step-card" key={item.step}>
                    <span className="he-step-index">{item.step}</span>
                    <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                  </article>
                ))}
              </div>

              <div className="he-code-callout mt-6">
                <p className="he-panel-label he-panel-label-dark">Write path</p>
                <code className="he-code">hawkeyePlugin({`{ enableSave: true }`})</code>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  Without save enabled, Hawk-Eye still previews edits in the browser session.
                  This demo keeps that distinction explicit so the surface stays believable.
                </p>
              </div>
            </article>

            <aside className="he-panel he-reveal he-delay-3">
              <p className="he-panel-label">Why this page changed</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Fewer fake actions, more usable context.
              </h2>

              <div className="mt-6 space-y-3">
                <div className="he-note-row">
                  <div>
                    <p className="he-note-title">One real launch point</p>
                    <p className="he-note-body">
                      The primary button opens the actual Hawk-Eye trigger instead of mimicking a
                      publish flow.
                    </p>
                  </div>
                  <span className="he-note-tag">Open</span>
                </div>

                <div className="he-note-row">
                  <div>
                    <p className="he-note-title">Specimens, not marketing cards</p>
                    <p className="he-note-body">
                      The surfaces below exist to be selected and edited, not to pretend there is a
                      bigger product shell behind them.
                    </p>
                  </div>
                  <span className="he-note-tag">Edit</span>
                </div>

                <div className="he-note-row">
                  <div>
                    <p className="he-note-title">Typography is intentional now</p>
                    <p className="he-note-body">
                      The demo uses the imported Geist variable font directly instead of silently
                      falling back to a generic system stack.
                    </p>
                  </div>
                  <span className="he-note-tag">Type</span>
                </div>
              </div>
            </aside>
          </section>

          <section className="he-reveal he-delay-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="he-panel-label">Inspectable surfaces</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  Three grounded specimens for today&apos;s pre-alpha pass.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Select a shell, caption, heading, chip, metric tile, or note row. The point is to
                give the inspector enough texture to feel useful without pretending these cards are
                full product features.
              </p>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.85fr)]">
              <article className="he-surface-card he-reveal he-delay-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="he-panel-label">Specimen A</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Release readiness frame
                    </h3>
                  </div>
                  <span className="he-chip he-chip-strong">Typography + spacing</span>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                  Use this card for large-type rhythm, tag styling, metric density, and shell
                  treatments. It is deliberately rich enough for the panel to do real work.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="he-chip">Headings</span>
                  <span className="he-chip">Chips</span>
                  <span className="he-chip">Metrics</span>
                  <span className="he-chip">Card shell</span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="he-metric-card">
                    <span className="he-metric-value">14</span>
                    <span className="he-metric-label">editable fields in focus</span>
                  </div>
                  <div className="he-metric-card">
                    <span className="he-metric-value">1.8s</span>
                    <span className="he-metric-label">from launch to first selection</span>
                  </div>
                  <div className="he-metric-card">
                    <span className="he-metric-value">0</span>
                    <span className="he-metric-label">pretend publish flows left on page</span>
                  </div>
                </div>
              </article>

              <article className="he-surface-card he-surface-card-dark he-reveal he-delay-5">
                <p className="he-panel-label he-panel-label-dark">Specimen B</p>
                <h3 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">
                  Contrast, padding, and hierarchy should hold up under pressure.
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Good target for color, corner radius, opacity, and text rhythm without relying on
                  fake product actions to create interest.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="he-tone-row">
                    <span className="he-tone-key">Lead</span>
                    <span className="he-tone-value">High-contrast message block</span>
                  </div>
                  <div className="he-tone-row">
                    <span className="he-tone-key">Support</span>
                    <span className="he-tone-value">Quiet caption + softened border</span>
                  </div>
                  <div className="he-tone-row">
                    <span className="he-tone-key">Shell</span>
                    <span className="he-tone-value">Dark glass with restrained glow</span>
                  </div>
                </div>
              </article>

              <article className="he-surface-card he-reveal he-delay-6">
                <p className="he-panel-label">Specimen C</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Release notes rail
                </h3>
                <div className="mt-5 space-y-3">
                  <div className="he-release-row">
                    <div>
                      <p className="he-note-title">Selection and hover overlay</p>
                      <p className="he-note-body">Useful immediately when the page stays uncluttered.</p>
                    </div>
                    <span className="he-note-tag">Live</span>
                  </div>
                  <div className="he-release-row">
                    <div>
                      <p className="he-note-title">Preview edits</p>
                      <p className="he-note-body">Safe to explore before deciding whether to save.</p>
                    </div>
                    <span className="he-note-tag">Session</span>
                  </div>
                  <div className="he-release-row">
                    <div>
                      <p className="he-note-title">Source updates</p>
                      <p className="he-note-body">Manual, opt-in, and intentionally visible in the panel.</p>
                    </div>
                    <span className="he-note-tag">Manual</span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </main>

      {inspectorAvailable && <DesignTool />}
    </>
  );
}
