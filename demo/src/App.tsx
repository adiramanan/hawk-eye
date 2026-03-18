import { DesignTool } from 'hawk-eye';

export default function App() {
  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef2ff_56%,_#e0e7ff_100%)]">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 lg:px-8">
          <header className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Hawk-Eye demo
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  Inspect, edit, detach, and save UI changes from the browser.
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Open the inspector, click any card below, and use the public `hawk-eye`
                  runtime. The demo enables branch saves so you can test the full prerelease flow
                  end to end.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-slate-200 shadow-lg">
                <p className="font-medium text-white">Public entrypoints</p>
                <p className="mt-1">`hawk-eye` and `hawk-eye/vite`</p>
              </div>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-sky-700">Studio overview</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    A more realistic page for selection, preview, and review.
                  </h2>
                </div>
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                  Publish release
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Selected card
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Design system hero</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Spacing, color, typography, and radius are all intentionally inspectable so the
                    panel has real work to do.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500">
                      Open inspector
                    </button>
                    <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white">
                      Save to Branch
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Status
                  </p>
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    <li className="flex items-center justify-between gap-4">
                      <span>Inspector trigger</span>
                      <span className="font-medium text-emerald-700">Ready</span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>Hover overlay</span>
                      <span className="font-medium text-emerald-700">Active</span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>Branch save</span>
                      <span className="font-medium text-amber-700">Opt-in</span>
                    </li>
                  </ul>
                </div>
              </div>
            </article>

            <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-sm">
              <p className="text-sm font-medium text-sky-300">Review queue</p>
              <h2 className="mt-2 text-2xl font-semibold">Drafts ready for branch save</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Marketing hero</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Background, headline weight, and call-to-action spacing.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Feature card</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Border radius, shadow depth, and label alignment.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Settings panel</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Form controls, section spacing, and state indicator colors.
                  </p>
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {[
              {
                accent: 'from-sky-500 to-cyan-400',
                eyebrow: 'Campaign card',
                title: 'Launch checklist',
                body: 'Tight spacing, stronger hierarchy, and a saved branch for review.',
              },
              {
                accent: 'from-violet-500 to-fuchsia-400',
                eyebrow: 'Control panel',
                title: 'Typography editor',
                body: 'Font family, weight, and alignment states show up clearly in the inspector.',
              },
              {
                accent: 'from-amber-500 to-orange-400',
                eyebrow: 'Checkout rail',
                title: 'Status summary',
                body: 'Color, opacity, and layout edits can be previewed without leaving the page.',
              },
            ].map((card) => (
              <article
                key={card.title}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className={`h-36 bg-gradient-to-br ${card.accent}`} />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>

      {/* Hawk-Eye Design Tool — only in development */}
      {import.meta.env.DEV && <DesignTool />}
    </>
  );
}
