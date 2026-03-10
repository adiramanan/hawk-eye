import {
  editablePropertyDefinitionMap,
  editablePropertyDefinitions,
  editablePropertyGroupLabels,
  editablePropertyGroupOrder,
} from './editable-properties';
import { getDirtyPropertyIds } from './drafts';
import type { EditablePropertyId, SelectionDraft } from './types';

interface PropertiesPanelProps {
  pendingDrafts: SelectionDraft[];
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetAll(): void;
  onResetProperty(source: string, propertyId: EditablePropertyId): void;
}

function renderValue(value: string) {
  return value || 'none';
}

export function PropertiesPanel({
  pendingDrafts,
  selectedDraft,
  onChange,
  onResetAll,
  onResetProperty,
}: PropertiesPanelProps) {
  const dirtyDrafts = pendingDrafts.filter((draft) => getDirtyPropertyIds(draft).length > 0);

  return (
    <>
      <section data-hawk-eye-ui="property-stack">
        {editablePropertyGroupOrder.map((group) => {
          const definitions = editablePropertyDefinitions.filter(
            (definition) => definition.group === group
          );

          return (
            <section data-hawk-eye-ui="property-group" key={group}>
              <div data-hawk-eye-ui="group-header">
                <h3 data-hawk-eye-ui="group-title">{editablePropertyGroupLabels[group]}</h3>
              </div>

              <div data-hawk-eye-ui={group === 'opacity' ? 'opacity-control' : 'control-grid'}>
                {definitions.map((definition) => {
                  const snapshot = selectedDraft.properties[definition.id];
                  const dirty = snapshot.value !== snapshot.baseline;

                  return (
                    <label
                      data-dirty={dirty ? 'true' : 'false'}
                      data-hawk-eye-ui="control"
                      data-invalid={snapshot.invalid ? 'true' : 'false'}
                      data-property-id={definition.id}
                      key={definition.id}
                    >
                      <span data-hawk-eye-ui="control-head">
                        <span data-hawk-eye-ui="control-label">{definition.label}</span>
                        {dirty ? (
                          <button
                            data-hawk-eye-ui="control-reset"
                            onClick={() => onResetProperty(selectedDraft.source, definition.id)}
                            type="button"
                          >
                            Reset
                          </button>
                        ) : null}
                      </span>

                      {definition.control === 'opacity' ? (
                        <div data-hawk-eye-ui="opacity-row">
                          <input
                            aria-label={definition.label}
                            data-hawk-eye-control={definition.id}
                            data-hawk-eye-ui="range-input"
                            max="1"
                            min="0"
                            onChange={(event) => onChange(definition.id, event.currentTarget.value)}
                            step="0.01"
                            type="range"
                            value={snapshot.invalid ? snapshot.value : snapshot.inputValue || '0'}
                          />
                          <input
                            aria-label={`${definition.label} value`}
                            data-hawk-eye-control={`${definition.id}-number`}
                            data-hawk-eye-ui="text-input"
                            inputMode="decimal"
                            onChange={(event) => onChange(definition.id, event.currentTarget.value)}
                            placeholder={definition.placeholder}
                            type="number"
                            value={snapshot.inputValue}
                          />
                        </div>
                      ) : (
                        <input
                          aria-label={definition.label}
                          data-hawk-eye-control={definition.id}
                          data-hawk-eye-ui="text-input"
                          onChange={(event) => onChange(definition.id, event.currentTarget.value)}
                          placeholder={definition.placeholder}
                          type="text"
                          value={snapshot.inputValue}
                        />
                      )}

                      <span data-hawk-eye-ui="control-meta">
                        {snapshot.invalid
                          ? `Invalid value. Preview stays at ${renderValue(snapshot.value)}.`
                          : dirty
                            ? `${renderValue(snapshot.baseline)} -> ${renderValue(snapshot.value)}`
                            : `Baseline ${renderValue(snapshot.baseline)}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>

      <section data-hawk-eye-ui="changes-section">
        <div data-hawk-eye-ui="group-header">
          <h3 data-hawk-eye-ui="group-title">Pending changes</h3>
          {dirtyDrafts.length > 0 ? (
            <button data-hawk-eye-ui="secondary-button" onClick={onResetAll} type="button">
              Reset all changes
            </button>
          ) : null}
        </div>

        {dirtyDrafts.length > 0 ? (
          <div data-hawk-eye-ui="changes-list">
            {dirtyDrafts.map((draft) => {
              const dirtyProperties = getDirtyPropertyIds(draft);

              return (
                <article data-hawk-eye-ui="change-card" key={draft.source}>
                  <div data-hawk-eye-ui="change-card-head">
                    <div>
                      <p data-hawk-eye-ui="change-title">{draft.tagName}</p>
                      <p data-hawk-eye-ui="change-source">{draft.source}</p>
                    </div>
                    <span data-hawk-eye-ui="change-count">{dirtyProperties.length} edits</span>
                  </div>

                  <div data-hawk-eye-ui="change-items">
                    {dirtyProperties.map((propertyId) => {
                      const definition = editablePropertyDefinitionMap[propertyId];
                      const snapshot = draft.properties[propertyId];

                      return (
                        <div data-hawk-eye-ui="change-item" key={`${draft.source}-${propertyId}`}>
                          <div data-hawk-eye-ui="change-copy">
                            <span data-hawk-eye-ui="change-label">{definition.shortLabel}</span>
                            <span data-hawk-eye-ui="change-values">
                              {renderValue(snapshot.baseline)} {'->'} {renderValue(snapshot.value)}
                            </span>
                          </div>
                          <button
                            data-hawk-eye-ui="pill-button"
                            onClick={() => onResetProperty(draft.source, propertyId)}
                            type="button"
                          >
                            Reset
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p data-hawk-eye-ui="hint">
            Live preview changes stay in this session only. Use the controls above to start editing.
          </p>
        )}
      </section>
    </>
  );
}
