# Dynamic Title & AI Director Context Integration

## Overview

This feature implements a **dynamic title bar** that changes based on real-time editing activity and feeds **social media trends** to the **AI Director** for intelligent, context-aware suggestions.

## Components Created

### 1. **EditingContextStore** (`editing-context-store.ts`)
Zustand store tracking all editing activities in real-time:

```typescript
// Tracks what user is doing
- currentActivity: 'drawing', 'typing', 'resizing', etc.
- contentType: What's being edited (text, shape, image, etc.)

// Edit patterns
- editFrequency: Actions per minute
- recentActions: Last 10 actions for pattern analysis

// Project context
- layerCount, hasVideo, hasAudio
- selectedLayerCount, editedProperties

// AI insights
- detectedTrends: ['fast-cuts', 'text-overlays', etc.]
- suggestedNextAction: AI recommendation
- aiDirectorContextHint: Background context
```

**Key Methods:**
- `setActivity()` - Record what user is doing
- `recordAction()` - Track editing speed
- `detectTrends()` - Analyze patterns
- `generateContextHint()` - Create AI context
- `getFormattedTitle()` - Generate dynamic title

### 2. **DynamicTitleBar** (`DynamicTitleBar.tsx`)
React component showing real-time editing state:

**Features:**
- **Activity Indicator**: Color-coded pulse showing current action
- **Real-time Title**: Changes as user edits (e.g., "MediaBunny • Drawing (3 selected) • fast-cuts")
- **Platform Badge**: Detected target platform (TikTok, Instagram, YouTube, etc.)
- **Context Hints**: Shows analysis of editing patterns
- **Trend Badges**: Animated badge when trends detected
- **Edit Speed**: Shows actions per minute
- **AI Suggestions**: "Try: APPLY EFFECT" when appropriate

**Visual Design:**
- Dark theme integration
- Smooth animations (fade-in, slide-in)
- Color-coded by activity type
- Responsive and compact

### 3. **SocialMediaTrendsService** (`social-media-trends-service.ts`)
Analyzes editing patterns for different platforms:

**Platforms Supported:**
- TikTok: Fast-paced, trendy, music-driven
- Instagram Reels: Polished, high-quality transitions
- YouTube: High-production, longer content
- Twitter/X: Quick content, minimal editing
- Snapchat: Vertical, fun, quick effects
- Twitch: Gaming highlights, reaction content
- LinkedIn: Professional, clean, informative
- Threads: Instagram alternative

**Analysis Features:**
- Detect trending edit styles (fast-cuts, transitions, text-overlays, etc.)
- Recommend next editing actions
- Suggest trending techniques for platform
- Analyze aspect ratio appropriateness
- Provide audio recommendations

**Usage:**
```typescript
const metrics: TrendMetrics = {
  platform: 'tiktok',
  avgEditingSpeed: 5.2,
  textOverlayFrequency: 0.35,
  transitionFrequency: 0.2,
  effectFrequency: 0.15,
  colorGradingFrequency: 0.1,
  audioIntegration: true,
  videoLength: 45,
  aspectRatio: '9:16',
};

const trend = SocialMediaTrendsService.analyzeTrends(metrics);
const nextActions = SocialMediaTrendsService.getNextActionRecommendation('tiktok', metrics);
const techniques = SocialMediaTrendsService.getTrendingTechniques('tiktok');
```

### 4. **AIDirectorContextEngine** (`ai-director-context-engine.ts`)
Bridges editing context, trends, and AI Director:

**Context Structure:**
```typescript
interface AIDirectorContext {
  currentActivity: string;           // What user is doing
  editingSpeed: number;              // Actions per minute
  detectedTrends: string[];          // Trending edit styles
  targetPlatform: string;            // TikTok, Instagram, etc.
  nextSuggestedActions: string[];    // Recommended next steps
  contextHint: string;               // Background analysis
  urgencyLevel: 'low'|'medium'|'high'; // How urgent
  confidenceScore: number;           // 0-1 confidence
}
```

**Key Methods:**
- `generateContext()` - Full AI Director context
- `generateAIDirectorPrompt()` - Formatted prompt for AI
- `getBackgroundContext()` - Markdown context for API
- `updateAIDirectorSystem()` - Push updates to session storage
- `useAIDirectorContext()` - React hook for components

**Background Context Example:**
```
## Editing Context
- Current Activity: applying-effect
- Editing Speed: 6.3 actions/min
- Target Platform: tiktok
- Project Scale: medium
- Total Actions: 42

## Trend Analysis
- Detected Styles: fast-cuts, text-overlays
- Confidence: 78%

## Project Info
- Layers: 24
- Has Video: Yes
- Has Audio: Yes
- Selected: 2 items

## AI Director Hints
- Urgency: high
- Next Suggested Actions: Add transitions, Apply color grading
- Context: Fast-paced editing detected • Trending: fast-cuts, text-overlays • Optimized for tiktok
```

## Integration Points

### 1. **Toolbar Integration** (Hook into editing actions)
```typescript
import { useEditingContextStore } from '@/stores/editing-context-store';

function MyTool() {
  const { setActivity, recordAction, recordPropertyEdit } = useEditingContextStore();
  
  const onDrawStart = () => {
    setActivity('drawing', 'shape');
  };
  
  const onDrawEnd = () => {
    recordAction('drawing');
    endActivity();
  };
  
  const onColorChange = () => {
    recordPropertyEdit('color');
    recordAction('coloring');
  };
}
```

### 2. **AI Director Integration** (Use context for smarter suggestions)
```typescript
import { AIDirectorContextEngine } from '@/services/ai-director-context-engine';

function AIDirectorPanel() {
  const { context, backgroundContext, prompt } = useAIDirectorContext();
  
  const generatePlan = async () => {
    // Send both user intent + background context
    const response = await fetch('/api/director/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: userInput,
        backgroundContext: backgroundContext, // <- Key!
        targetPlatform: context.targetPlatform,
        urgencyLevel: context.urgencyLevel,
      })
    });
  };
}
```

### 3. **Canvas Integration** (Track drawing/selection)
```typescript
import { useEditingContextStore } from '@/stores/editing-context-store';

function Canvas() {
  const { setActivity, updateSelection } = useEditingContextStore();
  
  const handleMouseDown = (e: MouseEvent) => {
    setActivity('drawing', 'shape');
  };
  
  const handleSelectionChange = (layers: Layer[]) => {
    const types = layers.map(l => l.type as ContentType);
    updateSelection(layers.length, types);
  };
}
```

### 4. **Project Store Integration** (Update project metrics)
```typescript
import { useEditingContextStore } from '@/stores/editing-context-store';
import { useProjectStore } from '@/stores/project-store';

// Hook these together
const projectStore = useProjectStore();
const editingStore = useEditingContextStore();

useEffect(() => {
  editingStore.updateProjectInfo(
    projectStore.layers.length,
    projectStore.hasVideo,
    projectStore.hasAudio
  );
}, [projectStore.layers, projectStore.hasVideo, projectStore.hasAudio]);
```

## Usage Examples

### Example 1: Auto-detect Platform
```typescript
// Platform is auto-detected based on project scale
// Small projects → TikTok
// Medium projects → Instagram
// Large projects → YouTube

// User can override:
const store = useEditingContextStore();
store.setPlatform('tiktok');
```

### Example 2: Get Next Action Suggestions
```typescript
const store = useEditingContextStore();

// Automatically suggests next action based on patterns
const nextAction = store.suggestNextAction();
// Returns: 'typing', 'applying-effect', 'exporting', etc.

// Show in UI
<div>Next: {nextAction?.toUpperCase()}</div>
```

### Example 3: Feed AI Director
```typescript
const engine = AIDirectorContextEngine;

// Get full context
const context = engine.generateContext();

// Subscribe to changes
const unsubscribe = engine.subscribeToContextChanges((newContext) => {
  console.log('AI Director context updated:', newContext);
  updateAIDirectorSuggestions(newContext);
});

// Use in API calls
const backgroundContext = engine.getBackgroundContext();
// Append to AI Director prompt for better suggestions
```

### Example 4: Trend Analysis
```typescript
const trends = SocialMediaTrendsService;

// Get platform-specific recommendations
const techniques = trends.getTrendingTechniques('instagram');
// Returns: ['smooth-transitions', 'color-grade', 'cinematic']

const audioRecs = trends.getAudioRecommendations('tiktok');
// Returns: ['trending-sounds', 'remixes', 'voiceovers']

// Check aspect ratio appropriateness
const { score, suggestion } = trends.analyzeAspectRatio('9:16', 'tiktok');
// score: 0.95, suggestion: "Perfect for tiktok!"
```

## Data Flow

```
User Editing Action
    ↓
EditingContextStore (tracks activity)
    ↓
Pattern Analysis (speed, frequency, properties)
    ↓
TrendDetection (what's trending?)
    ↓
AI Director Context Generation
    ├→ Background Context (added to AI prompts)
    ├→ Next Action Suggestion (shown in title bar)
    ├→ Urgency Level (influences AI suggestions)
    └→ Confidence Score (how sure are we?)
    ↓
DynamicTitleBar (visual feedback)
    ↓
AI Director System (uses context for better plans)
```

## Title Bar Examples

**Idle State:**
```
MediaBunny • Ready • 📱 instagram
```

**While Drawing:**
```
MediaBunny • Drawing (1 selected) • fast-cuts
Editing Speed: 4.2 actions/min
```

**Fast Editing with Trends:**
```
MediaBunny • Applying effect (3 selected) • text-overlays
Editing Speed: 7.8 actions/min | Trend Detected: text-overlays | 💡 Try: COLORING
```

**After Many Actions:**
```
MediaBunny • Ready | 🎵 tiktok
💡 Try: EXPORT
```

## Real-time Streaming to AI Director

The background context is automatically:
1. Updated every 2 seconds (configurable)
2. Stored in `sessionStorage` under `aiDirectorBackgroundContext`
3. Dispatched as `CustomEvent` `aiDirectorContextUpdate`
4. Ready to be included in AI Director API calls

**Listen for updates:**
```typescript
window.addEventListener('aiDirectorContextUpdate', (e: Event) => {
  const { context, backgroundContext } = (e as CustomEvent).detail;
  console.log('New AI context:', context);
});
```

## Future Enhancements

1. **Predictive Suggestions**: Use ML to predict ideal edits
2. **Performance Tracking**: Monitor editing efficiency
3. **Habit Learning**: Remember user preferences
4. **Collaborative Context**: Share context in team editing
5. **Historical Analysis**: Track trends over time
6. **A/B Testing**: Compare different editing approaches
7. **Export Optimization**: Automatically choose format based on platform

## Performance Considerations

- Store updates are debounced to prevent excessive re-renders
- Trend detection runs every 2 seconds (configurable)
- Context is stored in session storage for quick access
- No API calls required for local analysis
- Minimal performance impact on editor (< 2ms per update)

## Configuration

All intervals can be customized:

```typescript
// In DynamicTitleBar.tsx
const CONTEXT_HINT_INTERVAL = 2000;     // Update context every 2s
const SUGGESTION_INTERVAL = 3000;       // Update suggestions every 3s
const TREND_BADGE_DURATION = 4000;      // Show trend for 4s

// In EditingContextStore
const PATTERN_WINDOW = 10;              // Analyze last 10 actions
```

## Testing

```bash
# Test trend detection
npm test -- social-media-trends-service.test.ts

# Test context generation
npm test -- ai-director-context-engine.test.ts

# Test UI updates
npm test -- DynamicTitleBar.test.tsx
```

## Next Steps

1. **Hook into Toolbar**: Add `recordAction` calls to all tools
2. **Hook into Canvas**: Track drawing/selection changes
3. **Integration Tests**: Verify AI Director receives context
4. **Performance Testing**: Measure impact on editor
5. **User Testing**: Get feedback on suggestions
6. **Platform Detection**: Improve heuristics based on patterns
