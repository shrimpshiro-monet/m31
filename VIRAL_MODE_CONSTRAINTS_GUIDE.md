# 🔥 VIRAL MODE - DYNAMIC CONSTRAINTS GUIDE

## Overview

The Viral Mode system now uses **dynamic constraints** that automatically adapt based on:
1. **User's custom prompt** (auto-detected keywords)
2. **Selected mode** (aggressive, balanced, cinematic, minimal, music_driven)
3. **Custom overrides** (if you want to fine-tune)

## How It Works

### 1. **Constraint Inference from Prompt**

When a custom prompt is provided, the system analyzes keywords:

```
"fast" / "rapid" / "aggressive" / "hype"
  ↓ Triggers: AGGRESSIVE profile

"cinematic" / "slow" / "smooth" / "story"
  ↓ Triggers: CINEMATIC profile

"minimal" / "clean" / "simple"
  ↓ Triggers: MINIMAL profile

"music" / "beat" / "sync" / "dance" / "rhythm"
  ↓ Triggers: MUSIC_DRIVEN profile

(else) → BALANCED profile (default)
```

### 2. **Built-in Profiles**

#### 🚀 AGGRESSIVE (TikTok)
- Max cut length: **2s**
- Hook cuts: **≤1s**
- Max idle: **1.5s**
- Change frequency: **every 1s**
- Beat interval: **0.5s** (strict sync)
- Effect density: **HIGH**
- Best for: Maximum retention, viral potential

#### ⚖️ BALANCED (Default)
- Max cut length: **2.5s**
- Hook cuts: **≤1.5s**
- Max idle: **2s**
- Change frequency: **every 1.5s**
- Beat interval: **0.75s**
- Effect density: **MEDIUM**
- Best for: Most content, good balance

#### 🎬 CINEMATIC
- Max cut length: **4s**
- Hook cuts: **≤2s**
- Max idle: **3s**
- Change frequency: **every 2.5s**
- Beat interval: **1s** (loose)
- Effect density: **LOW**
- Best for: Story-driven, brand videos

#### ✨ MINIMAL
- Max cut length: **3.5s**
- Hook cuts: **≤2.5s**
- Max idle: **2.5s**
- Change frequency: **every 2s**
- Beat interval: **1s** (no strict sync)
- Effect density: **LOW**
- Best for: Documentary, interview content

#### 🎵 MUSIC_DRIVEN
- Max cut length: **2s**
- Hook cuts: **≤1.5s**
- Max idle: **1s**
- Change frequency: **every 1.2s**
- Beat interval: **0.5s** (strict sync)
- Effect density: **HIGH**
- Best for: Music videos, dance content

### 3. **Dynamic Merging**

The system automatically merges constraints in this order:

1. **Start** with inferred/selected base profile
2. **Merge** with user's custom overrides
3. **Result** = custom constraints that respect user intent

Example:

```javascript
// User: "I want a fast music video but with cinematic color grading"
// Base profile: MUSIC_DRIVEN (detected from "music" + "fast")
// Override: { effects: { colorGrades: ['cinematic'] } }
// Result: Music-driven pacing + cinematic aesthetics
```

### 4. **Using in API Calls**

#### Option A: Auto-detect from custom prompt
```bash
curl -X POST http://localhost:3000/api/director/generate-viral \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [...],
    "customPrompt": "fast music video with beat sync and zooms"
  }'
```
→ Detects "fast", "music", "beat sync" → Uses MUSIC_DRIVEN profile

#### Option B: Explicit mode selection
```bash
curl -X POST http://localhost:3000/api/director/generate-viral \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [...],
    "mode": "aggressive"
  }'
```
→ Forces AGGRESSIVE profile

#### Option C: Custom overrides
```bash
curl -X POST http://localhost:3000/api/director/generate-viral \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [...],
    "mode": "balanced",
    "constraintOverrides": {
      "pacing": {
        "maxCutLength": 1.5,
        "minChangeFrequency": 1
      },
      "effects": {
        "targetEffectDensity": "high"
      }
    }
  }'
```
→ Takes BALANCED + applies overrides

## Constraint Parameters

Each profile can be customized with:

### Pacing
- `maxCutLength` - How long a single cut can be (seconds)
- `introCutMax` - Max length for hook cuts (seconds)
- `maxIdleSegment` - Maximum dead air (seconds)
- `minChangeFrequency` - How often something must change (seconds)

### Beat Sync
- `beatInterval` - Assumed beat frequency (0.5 = hip hop, 1 = slow)
- `cutAlignTolerance` - How strict beat alignment is (±tolerance)
- `transitionOnBeat` - Must transitions hit beats?
- `zoomOnKick` - Must zooms hit bass hits?

### Effects
- `maxConcurrent` - Max effects stacked (1-3)
- `priorityOrder` - Which effects to prefer
- `targetEffectDensity` - Overall effect volume (low/medium/high)
- `minEffectDuration` - Shortest effect (seconds)
- `maxEffectDuration` - Longest effect (seconds)

### Text
- `firstTextBefore` - When text must first appear (seconds)
- `maxDuration` - Max text on-screen time (seconds)
- `minDuration` - Min text on-screen time (seconds)
- `totalTextElements` - How many text elements total
- `mustCreateCuriosityOrHype` - Force hook text?

### Phases
- `minPhases` - Minimum phase count (2-4)
- `types` - Which phases to include

## Examples

### Example 1: "Give me TikTok content that's INSANE"

**Detected constraint profile:** AGGRESSIVE
- Very fast cuts (≤1.5s in hook, 1.5-2s elsewhere)
- Maximum effects (zoom, punch, beat-sync)
- Text every 1-2s
- Beat synced at 0.5s intervals
- Result: Aggressive, attention-grabbing edit

### Example 2: "Cinematic film trailer, slow burn"

**Detected constraint profile:** CINEMATIC
- Long cuts (up to 4s)
- Smooth transitions only
- Minimal text (title/end card)
- Loose beat adherence (1s intervals)
- Result: Premium, story-focused edit

### Example 3: "EDM music video, beat drops everywhere"

**Detected constraint profile:** MUSIC_DRIVEN
- Strict beat sync (every 0.5s)
- Fast cuts synchronized to kicks
- High effect density
- Zooms hit bass hits
- Result: Hypnotic, synchronized to music

### Example 4: "Documentary, minimal cuts, interview style"

**Detected constraint profile:** MINIMAL
- Longer cuts (2.5-3.5s)
- Essential transitions only (fade/dissolve)
- Almost no effects
- Loose beat adherence
- Result: Clean, content-focused edit

## Advanced: Custom Constraint Profiles

Want a completely custom profile? The system supports dynamic constraint generation:

```typescript
// In server code
const customConstraints = {
  pacing: {
    maxCutLength: 1.8,
    introCutMax: 1.2,
    maxIdleSegment: 1.5,
    minChangeFrequency: 0.9
  },
  beatSync: {
    beatInterval: 0.6,
    cutAlignTolerance: 0.1,
    transitionOnBeat: true,
    zoomOnKick: true
  },
  // ... etc
};
```

## Key Insight

The breakthrough here is that **constraints aren't fixed rules—they're parameters the AI understands and can work with**.

This means:
- User writes custom prompt → System auto-detects intent → Constraints adapt
- Same AI prompt, different constraints = wildly different outputs
- Users can fine-tune without touching code

This is what makes the system actually smart.
