import { DesignTool } from '@hawk-eye/client';

export default function App() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hawk-Eye Demo</h1>
          <p className="text-lg text-gray-600 mb-8">
            Toggle Hawk-Eye in the bottom-right corner, click any card or button, then live-edit
            spacing, colors, type, radius, and opacity from the inspector panel.
          </p>

          {/* Example card component for testing */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Example Card</h2>
            <p className="text-gray-600 mb-4">
              This is a sample card component. Phase 2 lets you lock it, preview visual edits in
              place, switch to another element, then come back without losing the current session’s
              draft changes.
            </p>
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
              Click me
            </button>
          </div>

          {/* Another example */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="w-full h-48 bg-gray-200 rounded mb-4" />
                <h3 className="font-semibold text-gray-900">Item {i}</h3>
                <p className="text-gray-600 text-sm">Sample content for testing</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Hawk-Eye Design Tool — only in development */}
      {import.meta.env.DEV && <DesignTool />}
    </>
  );
}
