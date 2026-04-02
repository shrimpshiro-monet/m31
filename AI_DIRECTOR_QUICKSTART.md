## 🚀 AI Director Integration - Quick Start Guide

### Getting Started (5 Minutes)

#### Step 1: Import Everything You Need
```typescript
// State management
import { usePlanStore, usePlan, usePlanHistory } from '@/stores/plan-store';

// Generation & conversion
import { generateEditPlan } from '@/services/ai-director-service';
import { applyEditPlan, previewPlanApplication } from '@/services/plan-applier';

// UI Components
import { PlanVisualizer } from '@/components/editor/PlanVisualizer';
import { ConstraintUIBuilder } from '@/components/editor/ConstraintUIBuilder';
import { PlanComparison } from '@/components/editor/PlanComparison';

// Types
import type { EditPlan, VideoClip, ConstraintMode } from '@/types/ai-director.types';
```

---

#### Step 2: Create Your Component
```typescript
function VideoEditorWithAI() {
  const store = usePlanStore();
  const { currentPlan, setCurrentPlan, applyPlan } = store;
  const { canUndo, undoToHistory, historyCount } = usePlanHistory();
  
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate plan
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const plan = await generateEditPlan(clips, 'viral');
      setCurrentPlan(plan);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply to timeline
  const handleApply = () => {
    if (!currentPlan) return;
    
    const result = applyEditPlan(currentPlan);
    if (result.success) {
      // Send to editor's timeline
      applyTimelineOperations(result.operations);
      applyPlan(currentPlan);
    }
  };

  // Undo
  const handleUndo = () => {
    if (canUndo && historyCount > 0) {
      undoToHistory(historyCount - 1);
    }
  };

  return (
    <div className="ai-editor">
      {/* Constraint selector */}
      <ConstraintUIBuilder 
        plan={currentPlan}
        compact={false}
      />

      {/* Main visualization */}
      <PlanVisualizer 
        plan={currentPlan}
        zoom={1.2}
      />

      {/* Control buttons */}
      <div className="controls">
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
        <button onClick={handleApply} disabled={!currentPlan}>
          Apply to Timeline
        </button>
        <button onClick={handleUndo} disabled={!canUndo}>
          Undo
        </button>
      </div>
    </div>
  );
}
```

---

### Common Use Cases

#### 1. Generate & Preview
```typescript
// User clicks "Generate"
async function generateAndPreview(clips: VideoClip[]) {
  const plan = await generateEditPlan(clips, 'viral');
  
  // Store for later
  usePlanStore.getState().setCurrentPlan(plan);
  
  // Preview what will happen
  const preview = previewPlanApplication(plan);
  console.log(`Will affect ${preview.clipsAffected} clips`);
  console.log(`Will apply ${preview.actionsToApply} actions`);
}
```

#### 2. Compare Two Plans
```typescript
// User generated two different plans
const [planA, planB] = await Promise.all([
  generateStylePlan(clips, 'cinematic'),
  generateStylePlan(clips, 'energetic')
]);

return (
  <PlanComparison 
    planA={planA}
    planB={planB}
    onSelectPlan={(plan) => setCurrentPlan(plan)}
  />
);
```

#### 3. Refine a Plan
```typescript
// User isn't happy with the plan
const instruction = "Make it more energetic with faster cuts";
const refinedPlan = await refinePlan(
  currentPlan,
  clips,
  instruction
);

// Update constraint to match
setSelectedConstraints('aggressive');
setCurrentPlan(refinedPlan);
```

#### 4. Apply & Undo
```typescript
// Apply plan
const result = applyEditPlan(currentPlan);

// Store in history
const { applyPlan } = usePlanStore.getState();
applyPlan(currentPlan);

// Later, user wants to undo
const { undoToHistory, planHistory } = usePlanStore.getState();
undoToHistory(planHistory.length - 2); // Go back one step
```

#### 5. Export Plan
```typescript
import { exportPlanAsJSON, exportPlanAsDaVinciXML } from '@/services/ai-director-service';

// As JSON for sharing
const json = exportPlanAsJSON(currentPlan);
downloadFile(json, 'plan.json');

// As DaVinci XML for direct import
const xml = exportPlanAsDaVinciXML(currentPlan);
downloadFile(xml, 'plan.xml');
```

---

### Component Reference

#### PlanVisualizer
```typescript
<PlanVisualizer
  plan={currentPlan}
  onActionSelect={(action) => console.log('Selected:', action)}
  onActionRemove={(actionId) => removeAction(actionId)}
  readOnly={false}
  zoom={1.2}
/>
```

**Props**:
- `plan`: The EditPlan to display
- `onActionSelect`: Called when user clicks an action
- `onActionRemove`: Called when user removes an action
- `readOnly`: If true, no delete buttons shown
- `zoom`: Zoom level (0.5 to 3)

#### ConstraintUIBuilder
```typescript
<ConstraintUIBuilder
  plan={currentPlan}
  onConstraintsChange={(mode) => {
    setSelectedConstraints(mode);
    // Optionally regenerate with new constraints
  }}
  compact={false}
/>
```

**Props**:
- `plan`: Current plan (optional, used for adaptation info)
- `onConstraintsChange`: Called when user selects a profile
- `compact`: If true, shows horizontal icon buttons

#### PlanComparison
```typescript
<PlanComparison
  planA={plan1}
  planB={plan2}
  onSelectPlan={(plan, side) => {
    console.log(`Selected ${side}: ${plan.id}`);
    setCurrentPlan(plan);
  }}
  onExport={(plan) => exportAndDownload(plan)}
/>
```

**Props**:
- `planA`: First plan (left side)
- `planB`: Second plan (right side)
- `onSelectPlan`: Called when user clicks "Load Plan"
- `onExport`: Called when user clicks "Export"

---

### Store API

#### Reading State
```typescript
// Get current plan
const currentPlan = usePlanStore((s) => s.currentPlan);

// Get constraint mode
const mode = usePlanStore((s) => s.selectedConstraints);

// Get history
const history = usePlanStore((s) => s.planHistory);

// Or use the hook
const { currentPlan, planHistory } = usePlan();
```

#### Modifying State
```typescript
const { setCurrentPlan, addPlanAction, updatePlanAction } = usePlanStore();

// Set plan
setCurrentPlan(newPlan);

// Add action
addPlanAction({
  id: 'action-1',
  type: 'transition',
  start: 5,
  end: 5.3,
  params: { duration: 0.3 }
});

// Update action
updatePlanAction('action-1', {
  params: { duration: 0.5 }
});

// Remove action
removePlanAction('action-1');
```

---

### Error Handling

#### Validation Before Apply
```typescript
const { valid, errors, warnings } = validatePlanForApplication(plan);

if (!valid) {
  showError('Cannot apply plan:');
  errors.forEach(err => console.error('- ', err));
}

if (warnings.length > 0) {
  showWarning('Warnings:');
  warnings.forEach(warn => console.warn('- ', warn));
}
```

#### Generation with Error Handling
```typescript
try {
  const plan = await generateEditPlan(clips, 'viral');
  setCurrentPlan(plan);
} catch (error) {
  if (error.message.includes('API')) {
    showError('API error. Check connection.');
  } else if (error.message.includes('Invalid')) {
    showError('Invalid clips provided.');
  } else {
    showError('Generation failed: ' + error.message);
  }
}
```

#### Application Error Recovery
```typescript
const result = applyEditPlan(plan);

if (!result.success) {
  showError('Apply failed');
  
  result.errors.forEach(err => {
    console.error('Error:', err);
  });
  
  result.warnings.forEach(warn => {
    console.warn('Warning:', warn);
  });
  
  // Try to rollback
  createUndoOperations(result);
}
```

---

### Performance Tips

#### 1. Memoize Components
```typescript
const MemoVisualizer = React.memo(PlanVisualizer);
```

#### 2. Limit Re-renders
```typescript
// Instead of reading whole store
const plan = usePlanStore();

// Only read what you need
const plan = usePlanStore((s) => s.currentPlan);
```

#### 3. Large Plans
```typescript
// For plans with 100+ actions, use zoom
<PlanVisualizer plan={plan} zoom={0.5} />

// Or paginate
{actions.slice(0, 50).map(...)}
```

#### 4. Batch Updates
```typescript
// Bad: Multiple state updates
updatePlanAction('a1', {...});
updatePlanAction('a2', {...});
updatePlanAction('a3', {...});

// Good: Do all work, then single update
const newActions = actions.map(updateAction);
setCurrentPlan({ ...currentPlan, actions: newActions });
```

---

### Styling Customization

#### Override Colors
```css
/* Override action colors */
.action-block {
  background: var(--my-color) !important;
}

/* Override profile colors */
.profile-card--active {
  border-color: var(--my-accent) !important;
}

/* Custom theme */
:root {
  --primary-color: #60a5fa;
  --accent-color: #ec4899;
}
```

#### Responsive Adjustments
```css
@media (max-width: 768px) {
  /* Make visualizer full width */
  .plan-visualizer {
    width: 100%;
  }
  
  /* Stack comparison cards */
  .comparison__container {
    grid-template-columns: 1fr;
  }
}
```

---

### Testing Patterns

#### Unit Test a Component
```typescript
import { render, screen } from '@testing-library/react';
import { PlanVisualizer } from '@/components/editor/PlanVisualizer';

test('displays action count', () => {
  const plan = { actions: [...], clips: [...] };
  render(<PlanVisualizer plan={plan} />);
  
  expect(screen.getByText(/5/)).toBeInTheDocument();
});
```

#### Test Store
```typescript
import { renderHook, act } from '@testing-library/react';
import { usePlan } from '@/stores/plan-store';

test('adds plan to history', () => {
  const { result } = renderHook(() => usePlan());
  
  act(() => {
    result.current.applyPlan(testPlan);
  });
  
  expect(result.current.planHistory.length).toBe(1);
});
```

#### Test Applier
```typescript
import { applyEditPlan, validatePlanForApplication } from '@/services/plan-applier';

test('validates plan', () => {
  const { valid, errors } = validatePlanForApplication(badPlan);
  expect(valid).toBe(false);
  expect(errors.length).toBeGreaterThan(0);
});
```

---

### Real-World Example: Full Workflow

```typescript
import React, { useState } from 'react';
import { usePlanStore, usePlanHistory } from '@/stores/plan-store';
import { generateEditPlan, generateStylePlan } from '@/services/ai-director-service';
import { applyEditPlan } from '@/services/plan-applier';
import { PlanVisualizer, ConstraintUIBuilder, PlanComparison } from '@/components/editor';
import type { EditPlan, VideoClip } from '@/types/ai-director.types';

export function AIDirectorWorkflow() {
  const store = usePlanStore();
  const history = usePlanHistory();
  
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'generate' | 'compare'>('generate');
  const [planB, setPlanB] = useState<EditPlan | null>(null);

  // Generate with constraint
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const constraint = store.selectedConstraints;
      const plan = await generateEditPlan(clips, 'viral', { constraint });
      store.setCurrentPlan(plan);
    } finally {
      setLoading(false);
    }
  };

  // Generate alternative for A/B testing
  const handleGenerateAlternative = async () => {
    setLoading(true);
    try {
      const plan = await generateStylePlan(clips, 'energetic');
      setPlanB(plan);
      setMode('compare');
    } finally {
      setLoading(false);
    }
  };

  // Apply selected plan
  const handleApply = () => {
    const result = applyEditPlan(store.currentPlan!);
    if (result.success) {
      applyToTimeline(result.operations);
      store.applyPlan(store.currentPlan!);
    }
  };

  return (
    <div className="ai-workflow">
      {/* Constraint selector */}
      <section className="constraints">
        <ConstraintUIBuilder 
          plan={store.currentPlan}
          onConstraintsChange={() => handleGenerate()}
        />
      </section>

      {/* Main view */}
      {mode === 'generate' ? (
        <section className="generate">
          <PlanVisualizer plan={store.currentPlan} zoom={1.2} />
          <div className="buttons">
            <button onClick={handleGenerate} disabled={loading}>
              Generate
            </button>
            <button onClick={handleGenerateAlternative} disabled={loading}>
              Generate Alternative
            </button>
            <button onClick={handleApply} disabled={!store.currentPlan}>
              Apply
            </button>
            <button onClick={() => history.undoToHistory(history.historyCount - 1)}>
              Undo
            </button>
          </div>
        </section>
      ) : (
        <section className="compare">
          <PlanComparison
            planA={store.currentPlan}
            planB={planB}
            onSelectPlan={(plan) => store.setCurrentPlan(plan)}
            onExport={(plan) => exportPlan(plan)}
          />
          <button onClick={() => setMode('generate')}>
            Back to Generate
          </button>
        </section>
      )}
    </div>
  );
}

function applyToTimeline(operations: any[]) {
  // Connect to your timeline implementation
  console.log('Applying operations:', operations);
}

function exportPlan(plan: EditPlan) {
  // Connect to export service
  console.log('Exporting plan:', plan.id);
}
```

---

### Troubleshooting Checklist

- [ ] CSS files are imported
- [ ] Types are imported from ai-director.types
- [ ] Plan store initialized before components
- [ ] Zustand working (test with devtools)
- [ ] API backend running (check health)
- [ ] VideoClip[] has required properties (id, duration)
- [ ] No console errors
- [ ] Components visible (check CSS colors)
- [ ] State updates working (use React DevTools)
- [ ] Operations applied to timeline correctly

---

**You're ready to build! Start with the workflow example and customize to your needs.** 🚀
