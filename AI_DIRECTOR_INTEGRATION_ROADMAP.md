# 🎬 AI Director Integration Roadmap

## Current State

### ✅ What Exists
1. **Backend** (`server.mjs`)
   - `/api/director/generate` - Style-based generation
   - `/api/director/generate-custom` - Custom prompt generation
   - `/api/director/generate-viral` - Viral mode generation
   - Dynamic constraints system
   - Real LLM integration (gpt-4o)

2. **Frontend Demo** (`AIDirectorEnhanced.tsx`)
   - File upload
   - Three generation modes (Style, Custom, Library)
   - Plan visualization
   - Refinement workflow

3. **Main Editor** (`/apps/image/src/`)
   - Full video editing UI (from fork)
   - Timeline, effects, transitions
   - Export capabilities
   - Project management

### ❌ Critical Gaps

1. **Integration Layer**
   - No bridge between AI Director and Main Editor
   - Plans aren't applied to timeline
   - No UI in main editor for AI features

2. **UX/UI**
   - No constraint visualization
   - No A/B testing UI
   - No template browser in main editor
   - No real-time preview of AI changes

3. **Tools & Services**
   - No `ai-director-service.ts`
   - No plan applier/executor
   - No constraint UI builder
   - No plan export/import helpers

4. **Data Models**
   - EditPlan type not in main editor types
   - No plan store/state management
   - No history/versioning for AI edits

---

## 🛠️ Tools to Build

### 1. **ai-director-service.ts** (Priority: CRITICAL)
```typescript
// apps/image/src/services/ai-director-service.ts

Core responsibilities:
- Call backend AI Director API
- Transform EditPlan → timeline actions
- Apply plan to current project
- Handle plan versioning
- Export plan to different formats

Key exports:
- generateEditPlan(clips, mode, prompt)
- applyPlanToTimeline(plan, timeline)
- previewPlan(plan) // Non-destructive preview
- exportPlan(plan, format) // JSON, XML, etc
- importPlan(data)
```

### 2. **plan-applier.ts** (Priority: CRITICAL)
```typescript
// apps/image/src/utils/plan-applier.ts

Converts EditPlan actions → Timeline operations

Actions handled:
- cut → Split clip at trim points
- transition → Add transition element
- effect → Apply effect to clip
- color → Apply color grade
- audio → Apply audio effect
- text → Create text overlay

Key exports:
- applyAction(action, timeline)
- applyAllActions(plan, timeline)
- validatePlan(plan)
- previewActions(plan) // Visual preview
```

### 3. **constraint-ui.ts** (Priority: HIGH)
```typescript
// apps/image/src/components/ai-director/ConstraintUIBuilder.tsx

Dynamic UI for constraint tuning

Features:
- Pacing slider (cinematic → aggressive)
- Effect density slider
- Beat sync strictness
- Text frequency
- Live preview indicator

Exports:
- ConstraintUIBuilder component
- ConstraintPanel component
- PresetSelector component
```

### 4. **plan-store.ts** (Priority: HIGH)
```typescript
// apps/image/src/stores/plan-store.ts

State management for AI plans

State:
- currentPlan: EditPlan
- planHistory: EditPlan[]
- pendingChanges: Action[]
- previewMode: boolean
- selectedConstraints: ConstraintProfile

Actions:
- setPlan(plan)
- applyPlan(plan)
- undoPlanChange()
- redoPlanChange()
- savePlan(name)
- loadPlan(name)
```

### 5. **ai-director-panel.tsx** (Priority: HIGH)
```typescript
// apps/image/src/components/editor/panels/AIDirectorPanel.tsx

Main UI for AI Director in editor

Sections:
1. Mode selector (Style, Custom, Viral)
2. Constraint tuner (sliders)
3. Template browser
4. Generation button
5. Plan visualization
6. Preview/Apply buttons

Replaces/augments current editor UI
```

### 6. **plan-visualizer.tsx** (Priority: MEDIUM)
```typescript
// apps/image/src/components/ai-director/PlanVisualizer.tsx

Shows plan details

Display:
- Timeline visualization
- Action breakdown
- Effect preview
- Text overlay preview
- Before/after metrics

Interactive:
- Click to expand action
- Hover for details
- Drag to reorder (future)
```

### 7. **plan-comparison.tsx** (Priority: MEDIUM)
```typescript
// apps/image/src/components/ai-director/PlanComparison.tsx

A/B testing interface

Shows:
- Plan A vs Plan B side-by-side
- Different generations with same content
- Metrics comparison
- User preference voting

Enables:
- Testing different constraints
- Learning what users prefer
- Building ML feedback loop
```

### 8. **ai-templates-service.ts** (Priority: MEDIUM)
```typescript
// apps/image/src/services/ai-templates-service.ts

Template management

Features:
- Save current project as template
- Load template
- Customize template constraints
- Share templates (future)
- Community templates (future)

Extends existing templates-service.ts
```

### 9. **plan-export.ts** (Priority: MEDIUM)
```typescript
// apps/image/src/utils/plan-export.ts

Export plans to different formats

Formats:
- JSON (storage)
- XML (Premiere Pro)
- FCPXML (Final Cut Pro)
- DaVinci (coming)

Exports:
- toPremierePro(plan)
- toFinalCutPro(plan)
- toJSON(plan)
- toCSV(plan)
```

### 10. **ai-director.types.ts** (Priority: CRITICAL)
```typescript
// apps/image/src/types/ai-director.types.ts

Type definitions

Types:
- EditPlan
- EditAction
- ConstraintProfile
- GenerationMode
- GenerationRequest
- GenerationResponse
- PlanMetadata
```

---

## 📊 Integration Architecture

```
Frontend Editor (apps/image/)
    ↓
AIDirectorPanel (new component)
    ↓ (dispatch action)
plan-store (new store)
    ↓
ai-director-service (new service)
    ↓ (HTTP request)
Backend API (server.mjs)
    ↓ (EditPlan JSON)
Frontend Editor
    ↓ (dispatch)
plan-applier (new util)
    ↓ (convert actions)
timeline-store (existing)
    ↓ (update)
Visual Editor Update
```

---

## 🎯 Implementation Phases

### Phase 1: Core Integration (Week 1)
Priority: CRITICAL

1. Create `ai-director.types.ts`
2. Create `ai-director-service.ts`
3. Create `plan-store.ts`
4. Create `plan-applier.ts`
5. Add types to existing stores
6. Test basic flow: upload → generate → apply

**Goal**: AI plans apply to timeline and render correctly

### Phase 2: UI & UX (Week 2)
Priority: HIGH

1. Create `AIDirectorPanel.tsx`
2. Create `ConstraintUIBuilder.tsx`
3. Add to editor layout
4. Connect to stores
5. Add basic controls

**Goal**: Users can generate and tweak in UI

### Phase 3: Polish & Features (Week 3)
Priority: HIGH

1. Create `PlanVisualizer.tsx`
2. Create `PlanComparison.tsx`
3. Export/import UI
4. Preview mode
5. Performance optimization

**Goal**: Professional, usable interface

### Phase 4: Advanced (Week 4+)
Priority: MEDIUM

1. Template system
2. A/B testing framework
3. Community features (future)
4. Analytics (future)
5. Batch processing

---

## 📋 File Checklist

### New Services (3 files)
- [ ] `services/ai-director-service.ts`
- [ ] `services/ai-templates-service.ts`
- [ ] (extend `services/export-service.ts`)

### New Utils (3 files)
- [ ] `utils/plan-applier.ts`
- [ ] `utils/plan-export.ts`
- [ ] `utils/constraint-builder.ts`

### New Components (6 files)
- [ ] `components/editor/panels/AIDirectorPanel.tsx`
- [ ] `components/ai-director/ConstraintUIBuilder.tsx`
- [ ] `components/ai-director/PlanVisualizer.tsx`
- [ ] `components/ai-director/PlanComparison.tsx`
- [ ] `components/ai-director/TemplateSelector.tsx`
- [ ] `components/ai-director/GenerationStatus.tsx`

### New Stores (1 file)
- [ ] `stores/plan-store.ts`

### New Types (1 file)
- [ ] `types/ai-director.types.ts`

### Modifications (3 files)
- [ ] `types/index.ts` - add AI Director types
- [ ] `stores/index.ts` - export plan store
- [ ] `App.tsx` - add AI Director panel to layout

**Total: 14 new files, 3 modified files**

---

## 🚀 Quick Start Implementation

### Step 1: Types First
```typescript
// types/ai-director.types.ts

export interface EditPlan {
  id: string;
  clips: Clip[];
  actions: EditAction[];
  metadata: {
    generated_by: string;
    created_at: string;
    mode: string;
    viral_factor?: number;
  };
}

export interface EditAction {
  id: string;
  type: 'cut' | 'transition' | 'effect' | 'color' | 'audio' | 'text';
  start: number;
  end: number;
  params: Record<string, any>;
}

// ... etc
```

### Step 2: Service
```typescript
// services/ai-director-service.ts

export async function generateEditPlan(
  clips: Clip[],
  mode: 'style' | 'custom' | 'viral',
  prompt?: string
): Promise<EditPlan> {
  const endpoint = mode === 'viral' 
    ? '/api/director/generate-viral'
    : '/api/director/generate-custom';

  const response = await fetch(`http://localhost:3000${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clips, customPrompt: prompt })
  });

  return response.json();
}
```

### Step 3: Store
```typescript
// stores/plan-store.ts

import { create } from 'zustand';

export const usePlanStore = create((set) => ({
  currentPlan: null,
  planHistory: [],
  
  setPlan: (plan) => set({ currentPlan: plan }),
  applyPlan: (plan) => set((state) => ({
    currentPlan: plan,
    planHistory: [...state.planHistory, plan]
  })),
  undoPlan: () => set((state) => ({
    planHistory: state.planHistory.slice(0, -1)
  }))
}));
```

### Step 4: Component
```typescript
// components/editor/panels/AIDirectorPanel.tsx

export function AIDirectorPanel() {
  const { currentPlan, setPlan, applyPlan } = usePlanStore();
  
  const handleGenerate = async () => {
    const plan = await generateEditPlan(clips, mode, prompt);
    setPlan(plan);
  };

  return (
    <div className="ai-director-panel">
      {/* Mode selector */}
      {/* Constraint UI */}
      {/* Generate button */}
      {/* Preview */}
      {/* Apply button */}
    </div>
  );
}
```

---

## 💡 Why This Order

1. **Types first** - Everything else builds on types
2. **Service** - API communication, then rest flows from it
3. **Store** - State management, then components use it
4. **Component** - UI connects everything

This is the fastest path to integration.

---

## 🎯 Success Metrics

After integration, you should have:
1. ✅ Upload video in editor
2. ✅ Click "Generate Edit"
3. ✅ AI creates plan
4. ✅ Preview in real-time
5. ✅ Tweak constraints
6. ✅ Apply to timeline
7. ✅ Export final video

Everything works without leaving the main editor.

---

## 📱 UI Layout (Rough Sketch)

```
┌─────────────────────────────────────────┐
│         Editor Toolbar                   │
├──────────────┬──────────────────────────┤
│              │                          │
│  Timeline    │   AI Director Panel      │
│              │  ┌────────────────────┐  │
│              │  │ Mode: [Style/Cust] │  │
│  (existing)  │  │ Pacing: ▲──●──▼    │  │
│              │  │ Effects: ▲─●─▼     │  │
│              │  │ [Generate] [Preview]│  │
│              │  │ [Apply]   [Save]    │  │
│              │  └────────────────────┘  │
│              │                          │
│              │  Plan Details            │
│              │  ┌────────────────────┐  │
│              │  │ 42 actions         │  │
│              │  │ 8 effects          │  │
│              │  │ 15 transitions     │  │
│              │  └────────────────────┘  │
├──────────────┴──────────────────────────┤
│         Properties Panel                  │
└─────────────────────────────────────────┘
```

---

This is the full roadmap. Want me to start building these tools now?
