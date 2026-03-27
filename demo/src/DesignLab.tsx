import React, { useMemo, useState } from 'react';
// Import directly from source so Vite's Babel transform injects data-hawk-eye-source attrs
import { PropertiesPanel } from '../../packages/client/src/PropertiesPanel';
import { LayersPanel } from '../../packages/client/src/LayersPanel';
import { ColorInput } from '../../packages/client/src/controls/ColorInput';
import { NumberInput } from '../../packages/client/src/controls/NumberInput';
import { SliderInput } from '../../packages/client/src/controls/SliderInput';
import { SegmentedControl } from '../../packages/client/src/controls/SegmentedControl';
import { SelectInput } from '../../packages/client/src/controls/SelectInput';
import { TextInput } from '../../packages/client/src/controls/TextInput';
import { SizeInput } from '../../packages/client/src/controls/SizeInput';
import { ToggleSwitch } from '../../packages/client/src/controls/ToggleSwitch';
import { editablePropertyDefinitions } from '../../packages/client/src/editable-properties';
import { DesignLabTheme } from './DesignLabTheme';
import { makePropertySnapshot, mockSelectionDraft } from './design-lab-mock';

// Grab a definition by ID for the controls gallery
function defFor(id: string) {
  const def = editablePropertyDefinitions.find((d) => d.id === id);
  if (!def) throw new Error(`No definition for "${id}"`);
  return def;
}

interface DesignLabProps {
  onBack(): void;
}

export function DesignLab({ onBack }: DesignLabProps) {
  const draft = useMemo(() => mockSelectionDraft(), []);
  const [selectedInstanceKey, setSelectedInstanceKey] = useState<string | null>(null);

  return (
    <DesignLabTheme>
      <main className="he-shell">
        <div aria-hidden="true" className="he-grid" />
        <div aria-hidden="true" className="he-orb he-orb-a" />
        <div aria-hidden="true" className="he-orb he-orb-b" />

        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* ── Header ───────────────────────────────────────────────── */}
          <header className="he-panel he-reveal mb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="he-kicker">Design Lab</span>
                  <span className="he-chip">Dogfooding</span>
                  <span className="he-chip">Live preview</span>
                </div>
                <h1 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-tight tracking-[-0.05em] text-slate-950">
                  Use Hawk-Eye to design Hawk-Eye.
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  The components below are the actual Hawk-Eye source files rendered in the host
                  page. Open the inspector, click any element, and live-preview style changes on
                  the real UI.
                </p>
              </div>
              <button
                className="he-button mt-1 shrink-0"
                onClick={onBack}
                type="button"
              >
                ← Back to demo
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Source origin', value: 'packages/client/src' },
                { label: 'CSS scoping', value: '.he-dl wrapper' },
                { label: 'Write-back', value: 'Live preview only' },
                { label: 'Vite transform', value: 'Source attrs injected' },
              ].map((fact) => (
                <div className="rounded-xl border border-slate-200 bg-white p-4" key={fact.label}>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{fact.label}</span>
                  <p className="mt-1.5 text-sm font-semibold text-slate-800">{fact.value}</p>
                </div>
              ))}
            </div>
          </header>

          {/* ── Main columns ─────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-[340px_340px_1fr]">

            {/* Column 1: Properties Panel */}
            <section className="he-reveal he-delay-1">
              <div className="mb-3 flex items-center gap-2">
                <span className="he-panel-label">Component</span>
                <span className="he-chip">PropertiesPanel</span>
              </div>
              <div
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: 'var(--he-panel-border)', background: 'var(--he-bg)' }}
              >
                <PropertiesPanel
                  context={draft.context}
                  onChange={() => {}}
                  onChangeClassTarget={() => {}}
                  onChangeSizeMode={() => {}}
                  onChangeSizeValue={() => {}}
                  onDetach={() => {}}
                  onResetAll={() => {}}
                  onResetProperty={() => {}}
                  onToggleAspectRatioLock={() => {}}
                  pendingDrafts={[draft]}
                  selectedDraft={draft}
                />
              </div>
            </section>

            {/* Column 2: Layers Panel */}
            <section className="he-reveal he-delay-2">
              <div className="mb-3 flex items-center gap-2">
                <span className="he-panel-label">Component</span>
                <span className="he-chip">LayersPanel</span>
              </div>
              <div
                className="min-h-64 overflow-hidden rounded-xl border"
                style={{ borderColor: 'var(--he-panel-border)', background: 'var(--he-bg)' }}
              >
                <LayersPanel
                  onSelectByKey={setSelectedInstanceKey}
                  selectedInstanceKey={selectedInstanceKey}
                />
              </div>
            </section>

            {/* Column 3: Controls Gallery */}
            <section className="he-reveal he-delay-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="he-panel-label">Component</span>
                <span className="he-chip">Controls gallery</span>
              </div>
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: 'var(--he-panel-border)', background: 'var(--he-bg)' }}
              >
                <div className="space-y-5">

                  {/* Color */}
                  <ControlRow label="ColorInput" type="color">
                    <ColorInput
                      definition={defFor('backgroundColor')}
                      onChange={() => {}}
                      snapshot={makePropertySnapshot('backgroundColor', '#3d3d3d')}
                    />
                  </ControlRow>

                  {/* Number */}
                  <ControlRow label="NumberInput" type="number">
                    <NumberInput
                      definition={defFor('fontSize')}
                      onChange={() => {}}
                      scrubLabel="FS"
                      snapshot={makePropertySnapshot('fontSize', '12px')}
                    />
                  </ControlRow>

                  {/* Slider */}
                  <ControlRow label="SliderInput" type="slider">
                    <SliderInput
                      definition={defFor('opacity')}
                      onChange={() => {}}
                      snapshot={makePropertySnapshot('opacity', '1')}
                    />
                  </ControlRow>

                  {/* Segmented */}
                  <ControlRow label="SegmentedControl" type="segmented">
                    <SegmentedControl
                      definition={defFor('textAlign')}
                      onChange={() => {}}
                      snapshot={makePropertySnapshot('textAlign', 'left')}
                    />
                  </ControlRow>

                  {/* Select */}
                  <ControlRow label="SelectInput" type="select">
                    <SelectInput
                      definition={defFor('display')}
                      onChange={() => {}}
                      snapshot={makePropertySnapshot('display', 'flex')}
                    />
                  </ControlRow>

                  {/* Toggle */}
                  <ControlRow label="ToggleSwitch" type="toggle">
                    <ToggleSwitch
                      definition={defFor('flexWrap')}
                      onChange={() => {}}
                      snapshot={makePropertySnapshot('flexWrap', 'nowrap')}
                    />
                  </ControlRow>

                  {/* Size */}
                  <ControlRow label="SizeInput" type="size">
                    <SizeInput
                      definition={defFor('width')}
                      label="W"
                      mode="fixed"
                      onChange={() => {}}
                      onModeChange={() => {}}
                      snapshot={makePropertySnapshot('width', '320px')}
                    />
                  </ControlRow>

                  {/* Text */}
                  <ControlRow label="TextInput" type="text">
                    <TextInput
                      definition={defFor('fontFamily')}
                      onChange={() => {}}
                      snapshot={makePropertySnapshot(
                        'fontFamily',
                        '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
                      )}
                    />
                  </ControlRow>

                </div>
              </div>
            </section>
          </div>

          {/* ── Footer note ──────────────────────────────────────────── */}
          <footer className="he-reveal he-delay-4 mt-6">
            <div className="he-panel-dark he-panel rounded-xl p-5">
              <p className="he-panel-label he-panel-label-dark">How this works</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    step: '01',
                    title: 'Direct source imports',
                    body: 'Components are imported from packages/client/src directly — not the compiled package — so Vite injects data-hawk-eye-source attributes into their JSX.',
                  },
                  {
                    step: '02',
                    title: 'CSS cascade via .he-dl',
                    body: 'All --he-* CSS variables are defined on the .he-dl wrapper and cascade into Hawk-Eye components. Positioning overrides make fixed-layout elements render in flow.',
                  },
                  {
                    step: '03',
                    title: 'Inspector on top',
                    body: 'The DesignTool shadow overlay sits above the page. Click any rendered element — a control, a panel section, a button — and live-preview its styling.',
                  },
                ].map((item) => (
                  <div className="he-step-card" key={item.step}>
                    <span className="he-step-index">{item.step}</span>
                    <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </main>
    </DesignLabTheme>
  );
}

// ── Helper component ──────────────────────────────────────────────────────────

function ControlRow({
  label,
  type,
  children,
}: {
  label: string;
  type: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="mb-1.5 flex items-center gap-2"
        style={{ fontFamily: 'var(--he-font-ui)' }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--he-muted)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'var(--he-input)',
            color: 'var(--he-label)',
            fontFamily: 'var(--he-font-mono)',
          }}
        >
          {type}
        </span>
      </div>
      {children}
    </div>
  );
}
