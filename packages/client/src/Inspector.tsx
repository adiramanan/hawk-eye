import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import type {
  EditablePropertyId,
  MeasuredElement,
  SaveResult,
  SelectionDraft,
  SizeAxis,
  SizeMode,
} from './types';

export type InspectorShellState = 'closed' | 'opening' | 'open' | 'closing';
export type ToggleIntent = 'pointer' | 'keyboard' | 'escape';

export interface InspectorMotionTimings {
  shell: number;
  status: number;
  view: number;
}

interface InspectorProps {
  enabled: boolean;
  hovered: MeasuredElement | null;
  motionTimings: InspectorMotionTimings;
  pendingDrafts: SelectionDraft[];
  prefersReducedMotion: boolean;
  savePending: boolean;
  saveBlockedReason: string | null;
  saveBlockedState: 'error' | 'pending';
  saveInfoMessage: string | null;
  saveInfoState: 'error' | 'info';
  saveResult: SaveResult | null;
  shellState: InspectorShellState;
  selected: MeasuredElement | null;
  selectedDraft: SelectionDraft | null;
  selectedInstanceKey: string | null;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onChangeSizeMode(axis: SizeAxis, mode: SizeMode): void;
  onChangeSizeValue(axis: SizeAxis, value: string): void;
  onDetach(): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  onSave(): void;
  onSelectByKey(instanceKey: string): void;
  onToggleAspectRatioLock(): void;
  onToggle(intent?: ToggleIntent): void;
}

interface DragState {
  startX: number;
  startY: number;
  startPanelX: number;
  startPanelY: number;
}

type InspectorView = 'properties' | 'layers' | 'changes';
type FooterStatusTone = 'error' | 'info' | 'pending' | 'success';
type ViewTransitionState = 'idle' | 'to-properties' | 'to-layers' | 'to-changes';
type PresenceState = 'current' | 'entering' | 'exiting';

interface FooterStatusEntry {
  key: string;
  message: string;
  state: FooterStatusTone;
}

const PANEL_HEIGHT = 792;
const PANEL_WIDTH = 320;
const PANEL_VIEWPORT_GUTTER = 24;

function HawkEyeMark({ ui }: { ui: string }) {
  return (
    <svg
      aria-hidden="true"
      data-hawk-eye-ui={ui}
      fill="none"
      focusable="false"
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M35.2526 33.2526C35.7453 32.7599 36.4591 32.5589 37.1364 32.7223L55.1452 37.07C55.4374 37.1405 55.9729 37.2474 56.4704 37.5134L56.6803 37.6374L56.8366 37.7458C57.1929 38.0082 57.4938 38.3394 57.7214 38.7204C58.0579 39.2838 58.1608 39.9402 58.2282 40.277L59.4841 46.5573C59.6943 46.5668 59.904 46.5948 60.11 46.6442L60.363 46.7155L60.5456 46.7819C60.9579 46.9469 61.2729 47.181 61.5046 47.3776C61.7513 47.5871 62.016 47.8538 62.2565 48.0944L63.2389 49.0768C63.4795 49.3174 63.7463 49.5821 63.9557 49.8288C64.1524 50.0604 64.3864 50.3755 64.5514 50.7878L64.6178 50.9704L64.6891 51.2233C64.8319 51.819 64.8082 52.4442 64.6178 53.03C64.4543 53.5333 64.1804 53.9059 63.9557 54.1706C63.7462 54.4174 63.4796 54.6819 63.2389 54.9225L56.9225 61.2389C56.6819 61.4796 56.4174 61.7462 56.1706 61.9557C55.9059 62.1804 55.5333 62.4543 55.03 62.6178C54.3606 62.8353 53.6397 62.8352 52.9704 62.6178C52.4671 62.4543 52.0934 62.1804 51.8288 61.9557C51.5821 61.7463 51.3174 61.4795 51.0768 61.2389L50.0944 60.2565C49.8538 60.016 49.5871 59.7513 49.3776 59.5046C49.1529 59.2399 48.879 58.8663 48.7155 58.363C48.6225 58.0767 48.5707 57.7811 48.5573 57.4841L42.277 56.2282C41.9402 56.1608 41.2838 56.0579 40.7204 55.7214C40.2849 55.4613 39.9144 55.1052 39.6374 54.6803C39.279 54.1307 39.1506 53.4791 39.07 53.1452L34.7223 35.1364C34.5589 34.4591 34.7599 33.7453 35.2526 33.2526ZM52.8288 57.3327C52.8584 57.3624 52.8893 57.3942 52.9225 57.4274L53.9059 58.4108C53.9388 58.4437 53.9703 58.4742 53.9997 58.5036C54.0292 58.4741 54.0613 58.4439 54.0944 58.4108L60.4108 52.0944C60.4439 52.0613 60.4741 52.0292 60.5036 51.9997C60.4742 51.9703 60.4437 51.9388 60.4108 51.9059L59.4274 50.9225C59.3942 50.8893 59.3624 50.8584 59.3327 50.8288L52.8288 57.3327ZM49.3337 46.6667C49.3337 46.2985 49.0349 45.9997 48.6667 45.9997C48.4826 45.9997 48.3166 46.0753 48.196 46.196C48.1939 46.1981 48.1913 46.1997 48.1891 46.2018C48.0722 46.3219 47.9997 46.4858 47.9997 46.6667C47.9997 47.0349 48.2985 47.3337 48.6667 47.3337C49.0349 47.3337 49.3337 47.0349 49.3337 46.6667ZM53.3337 46.6667C53.3337 49.244 51.244 51.3337 48.6667 51.3337C46.0893 51.3337 43.9997 49.244 43.9997 46.6667C43.9997 46.1168 44.0955 45.5892 44.2702 45.0993L40.278 41.1071L42.9577 52.2067C42.9647 52.2357 42.971 52.263 42.9772 52.2887C43.0036 52.294 43.0314 52.3004 43.0612 52.3063L50.6755 53.8288L55.8288 48.6755L54.3063 41.0612C54.3004 41.0314 54.294 41.0036 54.2887 40.9772C54.263 40.971 54.2357 40.9647 54.2067 40.9577L43.1071 38.278L47.0993 42.2702C47.5892 42.0955 48.1168 41.9997 48.6667 41.9997C51.244 41.9997 53.3337 44.0893 53.3337 46.6667Z"
        fill="currentColor"
      />
      <path
        d="M48 73.5C49.1044 73.5001 49.9999 74.3956 50 75.5V84.5352L57.8262 80.0176C58.7826 79.4659 60.0055 79.7937 60.5576 80.75C61.1097 81.7064 60.7824 82.93 59.8262 83.4824L51 88.5771C49.1437 89.6488 46.8563 89.6487 45 88.5771L36.1748 83.4824C35.2183 82.9301 34.8911 81.7066 35.4434 80.75C35.9957 79.7938 37.2184 79.4656 38.1748 80.0176L46 84.5352V75.5C46.0001 74.3956 46.8956 73.5001 48 73.5ZM13.3594 53.5C14.4638 53.5002 15.3594 54.3956 15.3594 55.5V65.6904C15.3594 66.405 15.7406 67.0656 16.3594 67.4228L25.1846 72.5176C26.1409 73.0699 26.469 74.2935 25.917 75.25C25.3648 76.2065 24.1411 76.5344 23.1846 75.9824L14.3594 70.8867C12.503 69.8149 11.3594 67.834 11.3594 65.6904V55.5C11.3594 54.3954 12.2548 53.5 13.3594 53.5ZM82.6416 53.5C83.7459 53.5003 84.6416 54.3956 84.6416 55.5V65.6904C84.6416 67.8339 83.4978 69.8149 81.6416 70.8867L72.8164 75.9824C71.8599 76.5347 70.6363 76.2065 70.084 75.25C69.5317 74.2934 69.8598 73.0699 70.8164 72.5176L79.6416 67.4228C80.2602 67.0655 80.6416 66.4048 80.6416 65.6904V55.5C80.6416 54.3954 81.537 53.5 82.6416 53.5ZM23.1846 20.0176C24.1411 19.4656 25.3648 19.7935 25.917 20.75C26.469 21.7065 26.1409 22.9301 25.1846 23.4824L17.3594 27.999L25.1846 32.5176C26.1408 33.0699 26.469 34.2935 25.917 35.25C25.3648 36.2065 24.1411 36.5344 23.1846 35.9824L15.3594 31.4639V43C15.3594 44.1044 14.4638 44.9998 13.3594 45C12.2548 45 11.3594 44.1046 11.3594 43V30.3096C11.3594 28.166 12.503 26.1851 14.3594 25.1133L23.1846 20.0176ZM70.084 20.75C70.6363 19.7935 71.8599 19.4653 72.8164 20.0176L81.6416 25.1133C83.4978 26.1851 84.6416 28.1661 84.6416 30.3096V40.5C84.6416 41.6044 83.7459 42.4997 82.6416 42.5C81.537 42.5 80.6416 41.6046 80.6416 40.5V31.4639L72.8164 35.9824C71.8599 36.5347 70.6363 36.2065 70.084 35.25C69.5317 34.2934 69.8598 33.0699 70.8164 32.5176L78.6406 27.999L70.8164 23.4824C69.8598 22.9301 69.5317 21.7066 70.084 20.75ZM45 7.42285C46.8563 6.35125 49.1437 6.35123 51 7.42285L59.8262 12.5176C60.7824 13.07 61.1097 14.2936 60.5576 15.25C60.0055 16.2063 58.7826 16.5341 57.8262 15.9824L49 10.8867C48.3813 10.5297 47.6186 10.5297 47 10.8867L38.1748 15.9824C37.2184 16.5344 35.9957 16.2062 35.4434 15.25C34.8911 14.2934 35.2183 13.0699 36.1748 12.5176L45 7.42285Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.5 3 5.5 8l5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.5 3 7.5 6l-3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 4 12 12M12 4 4 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 20 20" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.66669 8.33333C1.66669 8.33333 3.33751 6.05685 4.69488 4.69854C6.05226 3.34022 7.92802 2.5 10 2.5C14.1422 2.5 17.5 5.85786 17.5 10C17.5 14.1421 14.1422 17.5 10 17.5C6.58078 17.5 3.69595 15.2119 2.79316 12.0833M1.66669 8.33333V3.33333M1.66669 8.33333H6.66669"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 20 20" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.8333 3.74984C15.8333 4.13705 15.8333 4.33066 15.8013 4.49165C15.6698 5.15281 15.153 5.66964 14.4918 5.80115C14.3308 5.83317 14.1372 5.83317 13.75 5.83317H4.58333C4.19612 5.83317 4.00251 5.83317 3.84152 5.80115C3.18037 5.66964 2.66354 5.15281 2.53202 4.49165C2.5 4.33066 2.5 4.13705 2.5 3.74984C2.5 3.36262 2.5 3.16902 2.53202 3.00802C2.66354 2.34687 3.18037 1.83004 3.84152 1.69853C4.00251 1.6665 4.19612 1.6665 4.58333 1.6665H13.75C14.1372 1.6665 14.3308 1.6665 14.4918 1.69853C15.153 1.83004 15.6698 2.34687 15.8013 3.00802C15.8333 3.16902 15.8333 3.36262 15.8333 3.74984ZM15.8333 3.74984C16.6099 3.74984 16.9982 3.74984 17.3045 3.8767C17.7129 4.04586 18.0373 4.37032 18.2065 4.7787C18.3333 5.08498 18.3333 5.47327 18.3333 6.24984V6.49984C18.3333 7.43326 18.3333 7.89997 18.1517 8.25649C17.9919 8.57009 17.7369 8.82506 17.4233 8.98485C17.0668 9.1665 16.6001 9.1665 15.6667 9.1665H12.6667C11.7332 9.1665 11.2665 9.1665 10.91 9.34816C10.5964 9.50795 10.3414 9.76292 10.1817 10.0765C10 10.433 10 10.8998 10 11.8332V12.4998M9.66667 18.3332H10.3333C10.8 18.3332 11.0334 18.3332 11.2117 18.2423C11.3685 18.1624 11.4959 18.035 11.5758 17.8782C11.6667 17.6999 11.6667 17.4665 11.6667 16.9998V13.8332C11.6667 13.3665 11.6667 13.1331 11.5758 12.9548C11.4959 12.798 11.3685 12.6706 11.2117 12.5907C11.0334 12.4998 10.8 12.4998 10.3333 12.4998H9.66667C9.19996 12.4998 8.9666 12.4998 8.78834 12.5907C8.63154 12.6706 8.50406 12.798 8.42416 12.9548C8.33333 13.1331 8.33333 13.3665 8.33333 13.8332V16.9998C8.33333 17.4665 8.33333 17.6999 8.42416 17.8782C8.50406 18.035 8.63154 18.1624 8.78834 18.2423C8.9666 18.3332 9.19996 18.3332 9.66667 18.3332Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function getDefaultPanelPos() {
  if (typeof window === 'undefined') return { x: 24, y: 16 };
  return {
    x: Math.max(PANEL_VIEWPORT_GUTTER, window.innerWidth - PANEL_WIDTH - PANEL_VIEWPORT_GUTTER),
    y: 16,
  };
}

function formatMeasurement(value: number) {
  return Math.max(0, Math.round(value));
}

function toOutlineStyle(measured: MeasuredElement): CSSProperties {
  return {
    height: measured.rect.height,
    left: measured.rect.left,
    top: measured.rect.top,
    width: measured.rect.width,
  };
}

function toMeasureStyle(measured: MeasuredElement): CSSProperties {
  return {
    left: measured.rect.left,
    top: Math.max(12, measured.rect.top - 36),
  };
}

function getSaveStatusMessage(savePending: boolean, saveResult: SaveResult | null) {
  if (savePending) {
    return 'Syncing source…';
  }

  if (!saveResult) {
    return null;
  }

  if (saveResult.success) {
    const targetLabel =
      saveResult.modifiedFiles.length === 1
        ? saveResult.modifiedFiles[0]
        : `${saveResult.modifiedFiles.length} files`;

    if (saveResult.warnings.length === 0) {
      return `Updated ${targetLabel}.`;
    }

    const [firstWarning, ...restWarnings] = saveResult.warnings;
    const extraWarningSuffix =
      restWarnings.length > 0 ? ` ${restWarnings.length} more warning(s).` : '';
    return `Updated ${targetLabel}. ${firstWarning.message}${extraWarningSuffix}`;
  }

  return saveResult.error;
}

function getFooterStatusEntry({
  saveBlockedReason,
  saveBlockedState,
  saveInfoMessage,
  saveInfoState,
  savePending,
  saveResult,
}: {
  saveBlockedReason: string | null;
  saveBlockedState: 'error' | 'pending';
  saveInfoMessage: string | null;
  saveInfoState: 'error' | 'info';
  savePending: boolean;
  saveResult: SaveResult | null;
}): FooterStatusEntry | null {
  const saveStatusMessage = getSaveStatusMessage(savePending, saveResult);

  if (saveStatusMessage) {
    const state = savePending ? 'pending' : saveResult?.success ? 'success' : 'error';
    return {
      key: `${state}:${saveStatusMessage}`,
      message: saveStatusMessage,
      state,
    };
  }

  if (saveBlockedReason) {
    return {
      key: `${saveBlockedState}:${saveBlockedReason}`,
      message: saveBlockedReason,
      state: saveBlockedState,
    };
  }

  if (saveInfoMessage) {
    return {
      key: `${saveInfoState}:${saveInfoMessage}`,
      message: saveInfoMessage,
      state: saveInfoState,
    };
  }

  return null;
}

function getDirtyProperties(
  draft: SelectionDraft
): Array<{ id: string; from: string; resetId: EditablePropertyId; to: string }> {
  const propertyChanges = (
    Object.entries(draft.properties) as Array<
      [EditablePropertyId, (typeof draft.properties)[EditablePropertyId]]
    >
  )
    .filter(([, snap]) => snap.inputValue !== '' && snap.inputValue !== snap.baseline)
    .map(([id, snap]) => ({ id, from: snap.baseline, resetId: id, to: snap.inputValue }));
  const modeChanges: Array<{ id: string; from: string; resetId: EditablePropertyId; to: string }> =
    [];

  if (draft.sizeControl.widthMode.value !== draft.sizeControl.widthMode.baseline) {
    modeChanges.push({
      id: 'width mode',
      from: draft.sizeControl.widthMode.baseline,
      resetId: 'width',
      to: draft.sizeControl.widthMode.value,
    });
  }

  if (draft.sizeControl.heightMode.value !== draft.sizeControl.heightMode.baseline) {
    modeChanges.push({
      id: 'height mode',
      from: draft.sizeControl.heightMode.baseline,
      resetId: 'height',
      to: draft.sizeControl.heightMode.value,
    });
  }

  return [...propertyChanges, ...modeChanges];
}

function getDraftLabel(draft: SelectionDraft) {
  const segments = draft.file.split('/');
  const basename = segments[segments.length - 1] ?? draft.file;
  return `${basename}:${draft.line}`;
}

function canDetachDraft(draft: SelectionDraft | null) {
  if (!draft || draft.detached) {
    return false;
  }

  return draft.styleMode === 'tailwind' || draft.styleMode === 'mixed';
}

function getSelectedTagLabel(draft: SelectionDraft | null) {
  return draft?.tagName.toLowerCase() ?? null;
}

const PRIMARY_PANEL_TABS: Array<{
  id: Extract<InspectorView, 'properties' | 'layers'>;
  label: string;
}> = [
  { id: 'layers', label: 'Layers' },
  { id: 'properties', label: 'Properties' },
];

function getToggleIntentFromClick(detail: number): ToggleIntent {
  return detail > 0 ? 'pointer' : 'keyboard';
}

export function Inspector({
  enabled,
  hovered,
  motionTimings,
  pendingDrafts,
  prefersReducedMotion,
  savePending,
  saveBlockedReason,
  saveBlockedState,
  saveInfoMessage,
  saveInfoState,
  saveResult,
  shellState,
  selected,
  selectedDraft,
  selectedInstanceKey,
  onChange,
  onChangeSizeMode,
  onChangeSizeValue,
  onDetach,
  onResetAll,
  onResetProperty,
  onSave,
  onSelectByKey,
  onToggleAspectRatioLock,
  onToggle,
}: InspectorProps) {
  const [panelPos, setPanelPos] = useState(getDefaultPanelPos);
  const [panelSize] = useState(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight - 64 : PANEL_HEIGHT,
    width: PANEL_WIDTH,
  }));
  const [view, setView] = useState<InspectorView>('properties');
  const [exitingView, setExitingView] = useState<InspectorView | null>(null);
  const [viewTransitionState, setViewTransitionState] = useState<ViewTransitionState>('idle');
  const [displayedStatus, setDisplayedStatus] = useState<FooterStatusEntry | null>(() =>
    getFooterStatusEntry({
      saveBlockedReason,
      saveBlockedState,
      saveInfoMessage,
      saveInfoState,
      savePending,
      saveResult,
    })
  );
  const [exitingStatus, setExitingStatus] = useState<FooterStatusEntry | null>(null);
  const [statusTransitionState, setStatusTransitionState] = useState<'idle' | 'transitioning'>(
    'idle'
  );
  const [confirmingResetKey, setConfirmingResetKey] = useState<string | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const viewTimerRef = useRef<number | null>(null);
  const activeMeasurement = selected ?? hovered;
  const totalChanges = pendingDrafts.reduce((sum, d) => sum + getDirtyProperties(d).length, 0);
  const showDetach = canDetachDraft(selectedDraft);
  const liveStatusEntry = getFooterStatusEntry({
    saveBlockedReason,
    saveBlockedState,
    saveInfoMessage,
    saveInfoState,
    savePending,
    saveResult,
  });
  const liveStatusKey = liveStatusEntry?.key ?? 'none';
  const displayedStatusKey = displayedStatus?.key ?? 'none';
  const showPanel = shellState !== 'closed';
  const showTrigger = shellState !== 'open';
  const triggerState =
    shellState === 'opening' ? 'exiting' : shellState === 'closing' ? 'entering' : 'closed';
  const showMetaActions = showDetach && (view === 'properties' || exitingView === 'properties');
  const metaPresence: PresenceState =
    view !== 'changes' ? (exitingView !== 'changes' ? 'current' : 'entering') : 'exiting';
  const selectedTagLabel = getSelectedTagLabel(selectedDraft);
  const pendingEditsLabel = totalChanges === 1 ? '1 edit ready' : `${totalChanges} edits ready`;
  const panelEyebrow =
    view === 'changes'
      ? 'Review edits'
      : view === 'layers'
        ? 'Live document tree'
        : selectedDraft
          ? 'Active selection'
          : 'Inspector ready';
  const panelTitle = view === 'changes' ? 'Pending Changes' : 'Hawk-Eye';
  const panelMetaLabel = view === 'layers' ? 'Mode' : selectedDraft ? 'Editing' : 'Status';
  const panelMetaValue =
    view === 'layers'
      ? 'Live DOM map'
      : selectedTagLabel
        ? `<${selectedTagLabel}>`
        : 'Choose a surface';

  function transitionToView(nextView: InspectorView) {
    if (nextView === view) {
      return;
    }

    setConfirmingResetKey(null);

    if (viewTimerRef.current) {
      window.clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }

    if (prefersReducedMotion || motionTimings.view === 0) {
      setExitingView(null);
      setView(nextView);
      setViewTransitionState('idle');
      return;
    }

    setExitingView(view);
    setView(nextView);
    setViewTransitionState(
      nextView === 'changes' ? 'to-changes' : nextView === 'layers' ? 'to-layers' : 'to-properties'
    );
    viewTimerRef.current = window.setTimeout(() => {
      setExitingView(null);
      setViewTransitionState('idle');
      viewTimerRef.current = null;
    }, motionTimings.view);
  }

  useEffect(() => {
    if (pendingDrafts.length !== 0 || view !== 'changes') {
      return;
    }

    if (viewTimerRef.current) {
      window.clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }

    if (prefersReducedMotion || motionTimings.view === 0) {
      setExitingView(null);
      setView('properties');
      setViewTransitionState('idle');
      return;
    }

    setExitingView(view);
    setView('properties');
    setViewTransitionState('to-properties');
    viewTimerRef.current = window.setTimeout(() => {
      setExitingView(null);
      setViewTransitionState('idle');
      viewTimerRef.current = null;
    }, motionTimings.view);
  }, [motionTimings.view, pendingDrafts.length, prefersReducedMotion, view]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
      }

      if (viewTimerRef.current) {
        window.clearTimeout(viewTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (displayedStatusKey === liveStatusKey) {
      return;
    }

    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }

    if (prefersReducedMotion || motionTimings.status === 0) {
      setDisplayedStatus(liveStatusEntry);
      setExitingStatus(null);
      setStatusTransitionState('idle');
      return;
    }

    setExitingStatus(displayedStatus);
    setDisplayedStatus(liveStatusEntry);
    setStatusTransitionState('transitioning');
    statusTimerRef.current = window.setTimeout(() => {
      setExitingStatus(null);
      setStatusTransitionState('idle');
      statusTimerRef.current = null;
    }, motionTimings.status);
  }, [
    displayedStatus,
    displayedStatusKey,
    liveStatusEntry,
    liveStatusKey,
    motionTimings.status,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    if (!enabled) {
      dragStateRef.current = null;
      return;
    }

    function handlePointerMove(event: globalThis.PointerEvent) {
      const state = dragStateRef.current;
      if (!state) return;

      const x = state.startPanelX + (event.clientX - state.startX);
      const y = state.startPanelY + (event.clientY - state.startY);
      const clampedX = Math.max(
        0,
        Math.min(window.innerWidth - panelSize.width - PANEL_VIEWPORT_GUTTER, x)
      );
      const clampedY = Math.max(
        0,
        Math.min(window.innerHeight - panelSize.height - PANEL_VIEWPORT_GUTTER, y)
      );
      setPanelPos({ x: clampedX, y: clampedY });
    }

    function handlePointerUp() {
      if (dragStateRef.current) {
        dragStateRef.current = null;
        document.body.style.cursor = '';
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
    };
  }, [enabled, panelSize.height, panelSize.width]);

  const panelStyle = {
    '--hawk-eye-panel-height': `${panelSize.height}px`,
    '--hawk-eye-panel-width': `${panelSize.width}px`,
    '--hawk-eye-shell-duration': `${motionTimings.shell}ms`,
    '--hawk-eye-status-duration': `${motionTimings.status}ms`,
    '--hawk-eye-view-duration': `${motionTimings.view}ms`,
    left: `${panelPos.x}px`,
    top: `${panelPos.y}px`,
  } as CSSProperties;

  function resetDraft(draft: SelectionDraft) {
    const resetIds = new Set(getDirtyProperties(draft).map(({ resetId }) => resetId));
    resetIds.forEach((propertyId) => onResetProperty(draft.instanceKey, propertyId));
  }

  function handleResetAll() {
    if (savePending || totalChanges === 0) {
      return;
    }

    if (!window.confirm('Revert all unsaved changes?')) {
      return;
    }

    onResetAll();
  }

  function renderPropertiesView() {
    if (selectedDraft) {
      return (
        <PropertiesPanel
          context={selectedDraft.context}
          onChange={onChange}
          onChangeSizeMode={onChangeSizeMode}
          onChangeSizeValue={onChangeSizeValue}
          onResetAll={onResetAll}
          onResetProperty={onResetProperty}
          onToggleAspectRatioLock={onToggleAspectRatioLock}
          pendingDrafts={pendingDrafts}
          selectedDraft={selectedDraft}
        />
      );
    }

    return (
      <div data-hawk-eye-ui="empty-state">
        <svg
          data-hawk-eye-ui="empty-state-icon"
          fill="none"
          height="32"
          viewBox="0 0 32 32"
          width="32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect height="20" rx="3" stroke="currentColor" strokeWidth="1.5" width="20" x="6" y="6" />
          <path
            d="M6 12h20M12 12v14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
        <p data-hawk-eye-ui="empty-state-title">No element selected</p>
        <p data-hawk-eye-ui="empty-state-body">
          Hover any element on the page and click to lock it. Preview changes happen immediately,
          and source updates stay explicit behind Update Design.
        </p>
      </div>
    );
  }

  function renderChangesView() {
    return (
      <div data-hawk-eye-ui="changes-view">
        {pendingDrafts.map((draft) => {
          const dirty = getDirtyProperties(draft);
          const visibleChanges = dirty.slice(0, 4);
          const isActive = selectedInstanceKey === draft.instanceKey;

          if (dirty.length === 0) {
            return null;
          }

          return (
            <div
              data-active={isActive ? 'true' : 'false'}
              data-clickable="true"
              data-hawk-eye-ui="changes-card"
              key={draft.instanceKey}
              onClick={() => {
                onSelectByKey(draft.instanceKey);
                transitionToView('properties');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectByKey(draft.instanceKey);
                  transitionToView('properties');
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div data-hawk-eye-ui="changes-card-header">
                <div data-hawk-eye-ui="changes-card-copy">
                  <p data-hawk-eye-ui="changes-card-source">{getDraftLabel(draft)}</p>
                  <span data-hawk-eye-ui="changes-count">{dirty.length}</span>
                </div>
                <button
                  aria-label={`Reset ${draft.tagName}`}
                  data-hawk-eye-ui="changes-reset-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmingResetKey(
                      confirmingResetKey === draft.instanceKey ? null : draft.instanceKey
                    );
                  }}
                  type="button"
                >
                  <RefreshIcon />
                </button>
              </div>
              <div data-hawk-eye-ui="changes-card-body">
                {visibleChanges.map(({ id, from, to }) => (
                  <div data-hawk-eye-ui="changes-card-row" key={id}>
                    <span data-hawk-eye-ui="changes-card-label">{id} :</span>
                    <span data-hawk-eye-ui="changes-card-value">{to || from || '—'}</span>
                  </div>
                ))}
              </div>
              <div
                aria-hidden={confirmingResetKey !== draft.instanceKey}
                data-hawk-eye-ui="changes-card-overlay"
                data-state={confirmingResetKey === draft.instanceKey ? 'active' : 'inactive'}
              >
                <div data-hawk-eye-ui="changes-overlay-actions">
                  <button
                    data-hawk-eye-ui="overlay-reset-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmingResetKey(null);
                      resetDraft(draft);
                    }}
                    tabIndex={confirmingResetKey === draft.instanceKey ? 0 : -1}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    data-hawk-eye-ui="overlay-keep-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmingResetKey(null);
                    }}
                    tabIndex={confirmingResetKey === draft.instanceKey ? 0 : -1}
                    type="button"
                  >
                    Keep
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderLayersView() {
    return <LayersPanel onSelectByKey={onSelectByKey} selectedInstanceKey={selectedInstanceKey} />;
  }

  function renderPanelView(nextView: InspectorView, presence: PresenceState) {
    return (
      <div
        aria-hidden={presence === 'exiting'}
        data-hawk-eye-ui="panel-view"
        data-presence={presence}
        data-view={nextView}
        key={`${nextView}-${presence}`}
      >
        {nextView === 'changes'
          ? renderChangesView()
          : nextView === 'layers'
            ? renderLayersView()
            : renderPropertiesView()}
      </div>
    );
  }

  return (
    <div
      data-hawk-eye-motion={prefersReducedMotion ? 'reduced' : 'full'}
      data-hawk-eye-shell-state={shellState}
      data-testid="hawk-eye-design-tool"
      data-hawk-eye-ui="root"
    >
      <div data-hawk-eye-ui="surface">
        {enabled && activeMeasurement ? (
          <>
            <div data-hawk-eye-ui="outline" style={toOutlineStyle(activeMeasurement)} />
            <div data-hawk-eye-ui="measure" style={toMeasureStyle(activeMeasurement)}>
              {formatMeasurement(activeMeasurement.rect.width)} x{' '}
              {formatMeasurement(activeMeasurement.rect.height)}
            </div>
          </>
        ) : null}

        {showPanel ? (
          <aside data-hawk-eye-ui="panel" data-state={shellState} style={panelStyle}>
            <div
              data-hawk-eye-ui="panel-drag-header"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                document.body.style.cursor = 'grabbing';
                dragStateRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  startPanelX: panelPos.x,
                  startPanelY: panelPos.y,
                };
              }}
            >
              {view === 'changes' ? (
                <div data-hawk-eye-ui="panel-header-main">
                  <button
                    aria-label="Back"
                    data-hawk-eye-ui="panel-back-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      transitionToView('properties');
                    }}
                    type="button"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <div data-hawk-eye-ui="panel-header-copy">
                    <p data-hawk-eye-ui="panel-eyebrow">{panelEyebrow}</p>
                    <span data-hawk-eye-ui="panel-title">{panelTitle}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div data-hawk-eye-ui="panel-header-main">
                    <span data-hawk-eye-ui="panel-brand-mark">
                      <HawkEyeMark ui="panel-brand-image" />
                    </span>
                    <div data-hawk-eye-ui="panel-header-copy">
                      <p data-hawk-eye-ui="panel-eyebrow">{panelEyebrow}</p>
                      <span data-hawk-eye-ui="panel-title">{panelTitle}</span>
                    </div>
                  </div>
                  <div data-hawk-eye-ui="panel-header-actions">
                    {totalChanges > 0 ? (
                      <span data-hawk-eye-ui="panel-header-badge">{pendingEditsLabel}</span>
                    ) : null}
                    <button
                      aria-label="Close panel"
                      data-hawk-eye-ui="panel-close-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggle(getToggleIntentFromClick(event.detail));
                      }}
                      type="button"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </>
              )}
            </div>

            {view !== 'changes' ? (
              <div data-hawk-eye-ui="panel-tabs" role="tablist">
                {PRIMARY_PANEL_TABS.map((tab) => {
                  const isActive = view === tab.id;

                  return (
                    <button
                      aria-selected={isActive}
                      data-active={isActive ? 'true' : 'false'}
                      data-hawk-eye-ui="panel-tab"
                      data-view={tab.id}
                      key={tab.id}
                      onClick={() => transitionToView(tab.id)}
                      role="tab"
                      type="button"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {view !== 'changes' ? (
              <div data-hawk-eye-ui="panel-meta" data-presence={metaPresence}>
                <div
                  data-hawk-eye-ui="panel-meta-badge"
                  data-state={selectedDraft ? 'active' : view === 'layers' ? 'layers' : 'idle'}
                >
                  <span data-hawk-eye-ui="panel-meta-badge-label">{panelMetaLabel}</span>
                  <span data-hawk-eye-ui="panel-meta-badge-value">{panelMetaValue}</span>
                </div>
                {showMetaActions ? (
                  <button
                    data-hawk-eye-control="detach"
                    data-hawk-eye-ui="panel-meta-btn"
                    onClick={onDetach}
                    type="button"
                  >
                    Detach
                  </button>
                ) : null}
              </div>
            ) : null}

            <div data-hawk-eye-ui="panel-body">
              <div data-hawk-eye-ui="view-stack" data-state={viewTransitionState}>
                {exitingView ? renderPanelView(exitingView, 'exiting') : null}
                {renderPanelView(view, exitingView ? 'entering' : 'current')}
              </div>
            </div>

            {view === 'changes' ? (
              <div data-hawk-eye-ui="panel-footer" data-view="changes">
                <button
                  data-hawk-eye-ui="footer-apply-btn"
                  disabled={savePending || Boolean(saveBlockedReason) || totalChanges === 0}
                  onClick={onSave}
                  type="button"
                >
                  {savePending ? 'Updating…' : 'Apply'}
                </button>
                <button
                  data-hawk-eye-ui="footer-hide-btn"
                  onClick={() => onToggle('pointer')}
                  type="button"
                >
                  Hide
                </button>
                <button
                  data-hawk-eye-ui="footer-revert-btn"
                  disabled={savePending || totalChanges === 0}
                  onClick={handleResetAll}
                  type="button"
                >
                  Reset
                </button>
              </div>
            ) : view === 'properties' && selectedDraft && totalChanges > 0 ? (
              <div data-hawk-eye-ui="panel-footer" data-view="properties">
                <button
                  data-hawk-eye-ui="footer-changes-btn"
                  onClick={() => transitionToView('changes')}
                  type="button"
                >
                  <span data-hawk-eye-ui="footer-changes-label">{totalChanges} Edits</span>
                  <span aria-hidden="true" data-hawk-eye-ui="footer-changes-arrow">
                    <ChevronRightIcon />
                  </span>
                </button>
                <button
                  aria-label={savePending ? 'Updating design' : 'Update design'}
                  data-hawk-eye-ui="footer-apply-btn"
                  disabled={savePending || Boolean(saveBlockedReason) || totalChanges === 0}
                  onClick={onSave}
                  type="button"
                >
                  <BrushIcon />
                  <span data-hawk-eye-ui="sr-only">
                    {savePending ? 'Updating…' : 'Update Design'}
                  </span>
                </button>
                <button
                  aria-label="Revert unsaved changes"
                  data-hawk-eye-ui="footer-revert-btn"
                  disabled={savePending || totalChanges === 0}
                  onClick={handleResetAll}
                  type="button"
                >
                  <RefreshIcon />
                  <span data-hawk-eye-ui="sr-only">Revert</span>
                </button>
              </div>
            ) : null}

            {displayedStatus || exitingStatus ? (
              <div data-hawk-eye-ui="panel-footer-status" data-state={statusTransitionState}>
                {exitingStatus ? (
                  <p
                    aria-hidden="true"
                    data-hawk-eye-ui="footer-status"
                    data-presence="exiting"
                    data-state={exitingStatus.state}
                  >
                    {exitingStatus.message}
                  </p>
                ) : null}
                {displayedStatus ? (
                  <p
                    aria-live="polite"
                    data-hawk-eye-ui="footer-status"
                    data-presence={exitingStatus ? 'entering' : 'current'}
                    data-state={displayedStatus.state}
                    role="status"
                  >
                    {displayedStatus.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </aside>
        ) : null}

        {showTrigger ? (
          <button
            data-hawk-eye-ui="trigger"
            data-state={triggerState}
            onClick={(event) => onToggle(getToggleIntentFromClick(event.detail))}
            type="button"
          >
            <span data-hawk-eye-ui="trigger-brand-mark">
              <HawkEyeMark ui="trigger-brand-image" />
            </span>
            <span data-hawk-eye-ui="trigger-copy">Hawk-Eye</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
