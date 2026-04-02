## 🗂️ AI Director Integration - File Structure & Imports

### New Files Created This Session

```
/apps/image/src/
├── stores/
│   └── plan-store.ts                 ✨ NEW: Zustand state management
├── services/
│   └── plan-applier.ts               ✨ NEW: Convert plans to operations
├── components/editor/
│   ├── PlanVisualizer.tsx            ✨ NEW: Timeline visualization
│   ├── ConstraintUIBuilder.tsx       ✨ NEW: Constraint selector
│   └── PlanComparison.tsx            ✨ NEW: A/B comparison UI
└── styles/
    ├── plan-visualizer.css           ✨ NEW: Visualizer styling
    ├── constraint-ui-builder.css     ✨ NEW: Constraint UI styling
    └── plan-comparison.css           ✨ NEW: Comparison styling
```

### Complete Type Definitions

**File**: `/apps/image/src/types/ai-director.types.ts`

```typescript
// Action types
export type EditActionType = 'cut' | 'transition' | 'effect' | 'color' | 'audio' | 'text' | 'speed' | 'layer';

// Generation modes
export type GenerationMode = 'style' | 'custom' | 'viral';
export type StyleMode = 'balanced' | 'energetic' | 'cinematic' | 'minimal' | 'dynamic';

// Constraint profiles
export type ConstraintMode = 
  | 'aggressive' 
  | 'balanced' 
  | 'cinematic' 
  | 'minimal' 
  | 'music_driven';

// Core interfaces
export interface VideoClip { ... }
export interface EditAction { ... }
export interface EditPlan { ... }
export interface Phase { ... }
export interface EditPlanMetadata { ... }
export interface EditStats { ... }
```

### API Service Layer

**File**: `/apps/image/src/services/ai-director-service.ts`

```typescript
// Main generation functions
export async function generateEditPlan(
  clips: VideoClip[],
  mode: GenerationMode,
  options?: GenerationOptions
): Promise<EditPlan>

export async function generateViralPlan(
  clips: VideoClip[],
  pattern?: string
): Promise<EditPlan>

export async function generateStylePlan(
  clips: VideoClip[],
  style: StyleMode
): Promise<EditPlan>

// Refinement & validation
export async function refinePlan(
  plan: EditPlan,
  clips: VideoClip[],
  instruction: string
): Promise<EditPlan>

export function validatePlan(plan: EditPlan): ValidationResult

// Export formats
export function exportPlanAsJSON(plan: EditPlan): string
export function exportPlanAsDaVinciXML(plan: EditPlan): string
export async function importPlanFromJSON(json: string): Promise<EditPlan>

// Utilities
export async function checkAPIHealth(): Promise<boolean>
export function getSupportedModes(): { modes, patterns, profiles }
```

### State Management (Zustand)

**File**: `/apps/image/src/stores/plan-store.ts`

```typescript
// Store state
export interface PlanStoreState {
  currentPlan: EditPlan | null;
  planHistory: EditPlan[];
  generationHistory: GenerationHistoryEntry[];
  status: PlanStatus;
  error: string | null;
  previewMode: boolean;
  selectedConstraints: ConstraintMode;
  pendingChanges: EditAction[];
  
  // Actions
  setCurrentPlan(plan: EditPlan | null): void;
  applyPlan(plan: EditPlan): void;
  updatePlanAction(actionId: string, updates: Partial<EditAction>): void;
  removePlanAction(actionId: string): void;
  addPlanAction(action: EditAction): void;
  reorderActions(fromIndex: number, toIndex: number): void;
  setStatus(status: PlanStatus): void;
  setError(error: string | null): void;
  setPreviewMode(enabled: boolean): void;
  setSelectedConstraints(constraints: ConstraintMode): void;
  // ... more actions
}

// Hooks
export const usePlanStore = create<PlanStoreState>(...)
export function usePlan(): PlanStoreState
export function usePlanHistory(): { planHistory, addToPlanHistory, undoToHistory, ... }
export function useGenerationHistory(): { generationHistory, addGenerationHistory, ... }
```

**Usage**:
```typescript
// In components
const plan = usePlan();
const { canUndo, historyCount } = usePlanHistory();
const currentPlan = usePlanStore(state => state.currentPlan);
```

### Plan Applier (Action Conversion)

**File**: `/apps/image/src/services/plan-applier.ts`

```typescript
// Main function
export function applyEditPlan(plan: EditPlan): PlanApplicationResult

// Validation
export function validatePlanForApplication(plan: EditPlan): {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Preview without applying
export function previewPlanApplication(plan: EditPlan): {
  clipsAffected: number;
  actionsToApply: number;
  affectedClipIds: string[];
  timelineChanges: string[];
}

// Batch & undo
export function applyMultiplePlans(plans: EditPlan[]): PlanApplicationResult
export function createUndoOperations(result: PlanApplicationResult): TimelineOperation[]

// Output
export interface TimelineOperation {
  clipId: string;
  type: EditActionType | string;
  startTime: number;
  duration: number;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}
```

### Component Imports

**Plan Visualizer**:
```typescript
import { PlanVisualizer } from '@/components/editor/PlanVisualizer';
import '@/styles/plan-visualizer.css';

<PlanVisualizer 
  plan={currentPlan}
  onActionSelect={handleActionSelect}
  onActionRemove={handleActionRemove}
  zoom={1.2}
/>
```

**Constraint UI Builder**:
```typescript
import { ConstraintUIBuilder } from '@/components/editor/ConstraintUIBuilder';
import '@/styles/constraint-ui-builder.css';

<ConstraintUIBuilder
  plan={currentPlan}
  onConstraintsChange={handleConstraintsChange}
  compact={false}
/>
```

**Plan Comparison**:
```typescript
import { PlanComparison } from '@/components/editor/PlanComparison';
import '@/styles/plan-comparison.css';

<PlanComparison
  planA={planA}
  planB={planB}
  onSelectPlan={handleSelectPlan}
  onExport={handleExport}
/>
```

### Integration Example

**Complete workflow**:
```typescript
import { usePlan, usePlanHistory } from '@/stores/plan-store';
import { generateEditPlan } from '@/services/ai-director-service';
import { applyEditPlan, previewPlanApplication } from '@/services/plan-applier';
import { PlanVisualizer } from '@/components/editor/PlanVisualizer';
import { ConstraintUIBuilder } from '@/components/editor/ConstraintUIBuilder';

function AIDirectorPanel({ clips }) {
  const { currentPlan, setCurrentPlan, applyPlan } = usePlan();
  const { canUndo, undoToHistory } = usePlanHistory();
  
  // 1. Generate a plan
  const handleGenerate = async () => {
    const plan = await generateEditPlan(clips, 'viral');
    setCurrentPlan(plan);
  };
  
  // 2. Preview
  const preview = previewPlanApplication(currentPlan);
  
  // 3. Apply to timeline
  const handleApply = () => {
    const result = applyEditPlan(currentPlan);
    if (result.success) {
      applyTimelineOperations(result.operations);
      applyPlan(currentPlan); // Save to history
    }
  };
  
  // 4. Undo
  const handleUndo = () => {
    if (canUndo) {
      undoToHistory(historyCount - 1);
    }
  };
  
  return (
    <div>
      <ConstraintUIBuilder plan={currentPlan} />
      <PlanVisualizer plan={currentPlan} zoom={1.2} />
      <button onClick={handleGenerate}>Generate</button>
      <button onClick={handleApply} disabled={!currentPlan}>Apply</button>
      <button onClick={handleUndo} disabled={!canUndo}>Undo</button>
    </div>
  );
}
```

### Styling System

**Colors & Theme** (Dark theme):
```css
/* Backgrounds */
--bg-primary: #1a1a2e;
--bg-secondary: #0f0f17;
--bg-tertiary: #16161e;

/* Borders */
--border-light: #2d2d44;
--border-medium: #3d3d54;

/* Text */
--text-primary: #ffffff;
--text-secondary: #e0e0e0;
--text-tertiary: #a0a0b0;
--text-muted: #7a7a8e;

/* Accents */
--accent-blue: #60a5fa;
--accent-pink: #ec4899;
--accent-orange: #f97316;
--accent-green: #10b981;
```

### Development Notes

**Type Safety**:
- All components are fully typed with TypeScript
- Import types from `ai-director.types.ts`
- Use type guards for runtime safety

**Performance**:
- Use `useMemo` for heavy calculations
- Plan visualizer renders efficiently with React keys
- Zustand doesn't re-render unnecessarily

**Accessibility**:
- All buttons have aria-labels
- Keyboard navigation supported
- Color contrast ratios meet WCAG AA

**Browser Support**:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid & Flexbox support required
- ES2020+ features used

### Common Tasks

**Set current plan**:
```typescript
const { setCurrentPlan } = usePlanStore();
setCurrentPlan(newPlan);
```

**Update an action**:
```typescript
const { updatePlanAction } = usePlanStore();
updatePlanAction('action-id', { params: { intensity: 0.8 } });
```

**Validate before applying**:
```typescript
const { valid, errors } = validatePlanForApplication(plan);
if (!valid) {
  console.error('Validation errors:', errors);
}
```

**Export plan**:
```typescript
const { exportPlanAsJSON, exportPlanAsDaVinciXML } = await import('@/services/ai-director-service');
const json = exportPlanAsJSON(plan);
const xml = exportPlanAsDaVinciXML(plan);
```

**Get generation history**:
```typescript
const { useGenerationHistory } = usePlanStore();
const { recentGenerations } = useGenerationHistory();
```

### Troubleshooting

**Component not rendering?**
- Check that plan is not null: `if (!plan) return null;`
- Verify CSS file is imported
- Check console for TypeScript errors

**Type errors?**
- Import types from `ai-director.types.ts`
- Use `satisfies` for inline type checking
- Check EditActionType values

**Performance issues?**
- Memoize expensive components
- Check plan size (number of actions)
- Use React DevTools Profiler

**Styling not applied?**
- Verify CSS file path
- Check CSS specificity conflicts
- Use browser DevTools to inspect

---

**Ready to integrate!** All files are production-ready and can be used immediately in the main editor.
