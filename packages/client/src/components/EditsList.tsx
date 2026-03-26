/**
 * EditsList Component
 *
 * Displays a list of property edits/changes made to the selected element.
 * Supports two variants:
 * - Default: Shows list of recent changes
 * - Reset: Shows reset state with action buttons
 */

import React from 'react';

export interface Edit {
  id: string;
  propertyName: string;
  previousValue: string;
  newValue: string;
  timestamp: number;
}

interface EditsListProps {
  edits: Edit[];
  variant?: 'default' | 'reset';
  onReset?(): void;
  onUndo?(editId: string): void;
}

/**
 * EditsList - Displays property changes in chronological order
 *
 * Usage:
 * ```tsx
 * <EditsList
 *   edits={[
 *     { id: '1', propertyName: 'color', previousValue: '#000', newValue: '#fff', timestamp: Date.now() }
 *   ]}
 *   onReset={() => console.log('Reset all')}
 * />
 * ```
 */
export const EditsList = React.forwardRef<HTMLDivElement, EditsListProps>(
  function EditsList({ edits, variant = 'default', onReset, onUndo }, ref) {
    return (
      <div
        ref={ref}
        data-hawk-eye-ui="edits-list"
        data-variant={variant}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-base)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-secondary)',
        }}
      >
        {variant === 'reset' ? (
          // Reset state - empty or minimal content
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-2xl) var(--spacing-lg)',
              color: 'var(--color-text-muted)',
            }}
          >
            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
              No changes yet
            </p>

            {onReset && (
              <button
                onClick={onReset}
                style={{
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-text-inverse)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-strong)',
                  cursor: 'pointer',
                  transition: `all var(--duration-base) var(--easing-standard)`,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-accent-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-accent)';
                }}
              >
                Reset All
              </button>
            )}
          </div>
        ) : (
          // Default state - show list of edits
          <>
            {edits.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-base)',
                }}
              >
                {edits.map((edit) => (
                  <div
                    key={edit.id}
                    data-hawk-eye-ui="edits-list-item"
                    style={{
                      padding: 'var(--spacing-md)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: `1px solid var(--color-border)`,
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 'var(--spacing-md)',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 'var(--font-weight-strong)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-xs)',
                          }}
                        >
                          {edit.propertyName}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          <code
                            style={{
                              backgroundColor: 'var(--color-bg)',
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-xs)',
                            }}
                          >
                            {edit.previousValue}
                          </code>
                          <span>→</span>
                          <code
                            style={{
                              backgroundColor: 'var(--color-bg)',
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-xs)',
                              color: 'var(--color-accent)',
                            }}
                          >
                            {edit.newValue}
                          </code>
                        </div>
                      </div>

                      {onUndo && (
                        <button
                          onClick={() => onUndo(edit.id)}
                          aria-label={`Undo ${edit.propertyName} change`}
                          style={{
                            padding: 'var(--spacing-xs) var(--spacing-md)',
                            borderRadius: 'var(--radius-xs)',
                            border: `1px solid var(--color-border)`,
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-xs)',
                            cursor: 'pointer',
                            transition: `all var(--duration-base) var(--easing-standard)`,
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor =
                              'var(--color-bg-tertiary)';
                            (e.target as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                            (e.target as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                          }}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-2xl) var(--spacing-lg)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <p style={{ fontSize: 'var(--font-size-sm)' }}>No changes recorded</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

EditsList.displayName = 'EditsList';
