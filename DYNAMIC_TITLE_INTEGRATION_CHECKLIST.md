# Quick Integration Checklist

## What Was Created

✅ **EditingContextStore** - Real-time editing activity tracking
✅ **DynamicTitleBar** - Beautiful, animated title showing current activity  
✅ **SocialMediaTrendsService** - Platform-specific trend analysis
✅ **AIDirectorContextEngine** - Bridge between editing and AI suggestions

## Files to Hook Up

### 1. Toolbar (`apps/image/src/components/editor/toolbar/Toolbar.tsx`)
Add activity tracking to each tool:

```typescript
import { useEditingContextStore } from '@/stores/editing-context-store';

// In your tool click handlers:
const handleDrawTool = () => {
  const { setActivity, recordAction } = useEditingContextStore();
  setActivity('drawing', 'shape');
  // ... existing code
  // Then on mouse up:
  recordAction('drawing');
};

const handleTypeTool = () => {
  const { setActivity, recordAction } = useEditingContextStore();
  setActivity('typing', 'text');
  // ... existing code
  recordAction('typing');
};

// Similarly for: coloring, resizing, rotating, moving, etc.
```

### 2. Canvas (`apps/image/src/components/editor/canvas/Canvas.tsx`)
Track selection and drawing:

```typescript
import { useEditingContextStore } from '@/stores/editing-context-store';

const Canvas = () => {
  const { updateSelection, setActivity, recordAction, recordPropertyEdit } 
    = useEditingContextStore();

  // Track selection changes
  const handleSelectionChange = (selectedLayers: Layer[]) => {
    const types = selectedLayers.map(l => l.type);
    updateSelection(selectedLayers.length, types);
  };

  // Track drawing
  const handleMouseDown = () => {
    setActivity('drawing', 'shape');
  };

  const handleMouseUp = () => {
    recordAction('drawing');
  };

  // Track property changes
  const handleLayerPropertyChange = (property: string) => {
    recordPropertyEdit(property); // 'position', 'color', 'opacity', etc.
  };
};
```

### 3. Inspector (`apps/image/src/components/editor/inspector/Inspector.tsx`)
Track property edits:

```typescript
import { useEditingContextStore } from '@/stores/editing-context-store';

const Inspector = () => {
  const { recordPropertyEdit, recordAction } = useEditingContextStore();

  const handleOpacityChange = () => {
    recordPropertyEdit('opacity');
    recordAction('adjusting-opacity');
  };

  const handleColorChange = () => {
    recordPropertyEdit('color');
    recordAction('coloring');
  };

  const handleTransformChange = () => {
    recordPropertyEdit('transform');
    recordAction('resizing'); // or 'rotating' or 'moving'
  };
};
```

### 4. Project Store Integration (`apps/image/src/stores/project-store.ts`)
Update project metrics:

```typescript
import { useEditingContextStore } from './editing-context-store';

// In your project store, when layers change:
export const useProjectStore = create((set, get) => ({
  // ... existing code

  // Add this whenever layers/video/audio change:
  updateEditingContext: () => {
    const state = get();
    const editingStore = useEditingContextStore.getState();
    editingStore.updateProjectInfo(
      state.layers.length,
      state.hasVideo,
      state.hasAudio
    );
  },
}));

// Call this in useEffect when layers/video/audio update
```

### 5. Filter/Effect Application
Track effect application:

```typescript
import { useEditingContextStore } from '@/stores/editing-context-store';

const applyFilter = (filterType: string) => {
  const { setActivity, recordAction } = useEditingContextStore();
  
  if (filterType === 'blur' || filterType === 'sharpen') {
    setActivity('applying-filter', 'image');
  } else {
    setActivity('applying-effect', 'image');
  }
  
  // ... apply the effect
  
  recordAction('applying-effect');
};
```

## Testing Integration Points

### Test 1: Dynamic Title Updates
```typescript
// Open editor and watch title bar
// Title should change as you:
// - Select different tools (e.g., "Drawing", "Typing")
// - Select/deselect layers (e.g., "Drawing (3 selected)")
// - Edit properties (should detect trends)
```

### Test 2: Edit Speed Tracking
```typescript
// Make rapid edits
// Title bar should show: "6.3 actions/min" updating in real-time
```

### Test 3: Trend Detection
```typescript
// Make many text edits
// After 3+ text actions, title should show "text-overlays" trend
// Watch for animated trend badge
```

### Test 4: Platform Detection
```typescript
// Platform badge should show based on project size:
// - Small: 🎵 tiktok
// - Medium: 📷 instagram  
// - Large: ▶️ youtube
```

### Test 5: AI Suggestions
```typescript
// After 30+ actions, should show "💡 Try: EXPORT"
// After many of same action type, should suggest next logical action
```

## Verification Steps

1. **Check Editor loads without errors**
   ```bash
   npm run dev
   ```
   Look for no console errors

2. **Verify Title Bar renders**
   - Should see "MediaBunny • Ready • 📱 instagram" at top
   - Platform badge should be visible

3. **Test Activity tracking**
   - Open DevTools console:
   ```javascript
   // Check store state
   let store = Object.values(window).__zustand_store__;
   // Look for currentActivity, editFrequency, etc.
   ```

4. **Test context generation**
   ```javascript
   // In console, import engine
   const context = sessionStorage.getItem('aiDirectorContext');
   console.log(JSON.parse(context));
   ```

5. **Test trend detection**
   ```javascript
   // Trigger edit actions in UI
   // Check for trend badges appearing
   // Verify trends in stored context
   ```

## Integration Order (Recommended)

1. **Day 1**: Basic hookup to toolbar
   - Track main tools (draw, type, color, select)
   - Verify title updates

2. **Day 2**: Canvas & selection tracking
   - Track drawing mode
   - Track selection changes

3. **Day 3**: Property tracking
   - All inspector changes
   - Effects and filters

4. **Day 4**: AI Director integration
   - Pass background context to API
   - Test with live API calls

5. **Day 5**: Polish & optimize
   - Adjust intervals
   - Fine-tune suggestions
   - Performance testing

## Common Issues & Fixes

### Issue: Title not updating
**Fix**: Ensure `recordAction()` is called, not just `setActivity()`

### Issue: Edit frequency shows 0
**Fix**: Make sure multiple actions occur within tracking window

### Issue: Trends not detecting
**Fix**: Verify `detectTrends()` is called after recording actions

### Issue: Platform badge wrong
**Fix**: Ensure `updateProjectInfo()` is called when project metrics change

### Issue: AI suggestions not appearing
**Fix**: Check `suggestNextAction()` and ensure action count > 30

## Performance Optimization

If editor feels slower after integration:

1. Reduce update frequency:
   ```typescript
   // In stores/editing-context-store.ts
   // Change interval from 2000ms to 5000ms
   ```

2. Debounce property tracking:
   ```typescript
   // Only record every 5th property change
   if (actionCount % 5 === 0) {
     recordPropertyEdit(property);
   }
   ```

3. Disable trend detection for large projects:
   ```typescript
   if (layerCount < 100) {
     detectTrends();
   }
   ```

## Rollback Plan

If integration causes issues:

1. **Remove DynamicTitleBar from EditorInterface**:
   ```typescript
   // Comment out:
   // <DynamicTitleBar />
   ```

2. **Disable context tracking**:
   ```typescript
   // In tools, just comment out store calls
   // setActivity(...) → // setActivity(...)
   ```

3. **All data stays local** - No database changes

## Next Phase Integration

Once working, this powers:

1. **AI Director**: Receives background context for better suggestions
2. **Export Optimizer**: Chooses format based on platform trends
3. **Performance Analytics**: Track editing efficiency over time
4. **Recommendation Engine**: Suggest edits based on trending styles
5. **Smart Templates**: Automatically apply trending styles

## Questions?

Refer to:
- `DYNAMIC_TITLE_AI_CONTEXT_GUIDE.md` - Full documentation
- Store files directly - They're well-commented
- Component files - All marked with usage examples
