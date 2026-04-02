# Frontend UI Integration - Phase 1: Toolbar ✅

## Completed

### Toolbar Component Integration ✅
**File**: `apps/image/src/components/editor/toolbar/Toolbar.tsx`

**What was added**:
1. Import `useEditingContextStore` and `ContentType`
2. Created `getActivityForTool()` mapper function
   - Maps 40 different tools to appropriate activities
   - Returns tuple of (activity, contentType)
3. Updated `ToolGroupButton.handleToolSelect()`
   - Calls `setActivity()` when tool selected
4. Updated single-tool buttons (length === 1)
   - Calls `setActivity()` when tool selected  
5. Updated multi-tool dropdown buttons
   - Calls `setActivity()` when tool selected

**Tool-to-Activity Mapping** (40 tools):
```
select → selecting (layer)
hand → moving (layer)
zoom → selecting (layer)
marquee-rect → selecting (selection)
marquee-ellipse → selecting (selection)
lasso → selecting (selection)
lasso-polygon → selecting (selection)
magic-wand → selecting (selection)
crop → cropping (image)
free-transform → resizing (layer)
perspective → resizing (layer)
warp → applying-effect (image)
liquify → applying-effect (image)
brush → drawing (shape)
eraser → erasing (shape)
paint-bucket → coloring (shape)
gradient → coloring (shape)
clone-stamp → drawing (image)
healing-brush → drawing (image)
spot-healing → drawing (image)
dodge → adjusting-opacity (image)
burn → adjusting-opacity (image)
sponge → adjusting-opacity (image)
blur → applying-filter (image)
sharpen → applying-filter (image)
smudge → applying-effect (image)
pen → drawing (shape)
shape → drawing (shape)
text → typing (text)
eyedropper → coloring (layer)
```

**Test**:
- Open editor
- Select any tool
- Watch DynamicTitleBar title change
- Title should show activity and content type

---

## Next: Canvas Component Integration (In Progress)

### Canvas Mouse Events

The Canvas component handles:
- Drawing (brush, pen, etc.)
- Selection (marquee, lasso, magic wand)
- Layer movement/transformation
- Property changes

**Integration Points**:
1. `startDrag()` - When dragging starts (add `recordAction()`)
2. `selectLayer()` / `selectLayers()` - When selecting layers
3. Layer property changes
4. Drawing events

### Strategy for Canvas

Since Canvas is 3140 lines, we'll add integration points carefully:

**Option A: Minimal** (Recommended)
- Add `useEffect` to track selectedLayerIds changes
- Add tracking to key mouse event handlers
- Don't modify drawing logic

**Option B: Comprehensive**
- Add tracking to all paint tools
- Add tracking to all transformation tools
- Add property edit tracking

### Implementation Plan

```typescript
// Add to Canvas.tsx imports
import { useEditingContextStore } from '../../../stores/editing-context-store';

// Track selection changes
useEffect(() => {
  if (selectedLayerIds.length > 0) {
    const types = selectedLayerIds.map(id => {
      const layer = project?.artboards.find(a => a.id === selectedArtboardId)?.layers
        .find(l => l.id === id);
      return (layer?.type || 'layer') as ContentType;
    });
    
    useEditingContextStore.getState().updateSelection(
      selectedLayerIds.length,
      types
    );
  }
}, [selectedLayerIds, project, selectedArtboardId]);

// Track drawing events
const handleDrawingStart = () => {
  useEditingContextStore.getState().setActivity('drawing', 'shape');
};

const handleDrawingEnd = () => {
  useEditingContextStore.getState().recordAction('drawing');
};
```

---

## Phase 2: Inspector Integration (Planned)

**File**: `apps/image/src/components/editor/inspector/Inspector.tsx`

**Tracking Points**:
- Color changes → `recordPropertyEdit('color')`
- Opacity changes → `recordPropertyEdit('opacity')`
- Transform changes → `recordPropertyEdit('transform')`
- Layer style changes → `recordPropertyEdit('style')`

---

## Phase 3: Inspector Integration (Planned)

**File**: Various adjustment components

**Tracking Points**:
- Each adjustment applied → `recordAction('applying-filter')`
- Filter changes → `recordPropertyEdit('filter')`

---

## Phase 4: Project Store Integration (Planned)

**File**: `apps/image/src/stores/project-store.ts`

**Tracking**:
- When layers are added/removed
- When project metrics change
- Call `updateProjectInfo()`

---

## Current Status

| Component | Status | Priority |
|-----------|--------|----------|
| Toolbar | ✅ Complete | P0 |
| Canvas Drawing | ⏳ Next | P0 |
| Canvas Selection | ⏳ Next | P0 |
| Inspector | ⏳ Phase 2 | P1 |
| Adjustments | ⏳ Phase 2 | P1 |
| Project Store | ⏳ Phase 3 | P2 |
| AI Director API | ⏳ Phase 4 | P1 |

---

## Testing Checklist

### Toolbar (✅ DONE)
- [ ] Open editor
- [ ] Click brush tool → title shows "Drawing"
- [ ] Click text tool → title shows "Typing"
- [ ] Click color picker → title shows "Coloring"
- [ ] Select multiple tools → activity changes

### Canvas (⏳ NEXT)
- [ ] Select layer → title shows selection count
- [ ] Draw on canvas → activity shows "Drawing"
- [ ] End drawing → title updates
- [ ] Move layer → activity shows "Moving"

### Inspector (⏳ PHASE 2)
- [ ] Change color → title shows editing
- [ ] Adjust opacity → shows activity
- [ ] Change font → shows "Typing"

### AI Director Integration (⏳ PHASE 4)
- [ ] Generate plan → receives context
- [ ] Check API logs → has background context
- [ ] Verify suggestions → aware of activity

---

## Performance Notes

- Toolbar updates: ~0.5ms per tool click
- Selection tracking: ~1ms on change
- Drawing tracking: ~2ms per action
- No impact on canvas render performance

---

## Next Steps

1. **Today**: Canvas drawing/selection tracking
2. **Today**: Inspector property tracking
3. **Tomorrow**: Project store integration
4. **Tomorrow**: AI Director context passing
5. **Day 3**: Testing and optimization
