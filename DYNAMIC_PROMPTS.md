# AI Director - Dynamic Prompt System 🎬

## Overview

The AI Director now supports **fully dynamic prompts** instead of hardcoded generation logic. This gives you complete control over editing styles and creative direction.

## Endpoints

### 1. Standard Generation (Style-Based)
```
POST /api/director/generate
```

**Request:**
```json
{
  "clips": [
    {"id": "clip-1", "filename": "video.mp4", "duration": 30}
  ],
  "style": "energetic"  // balanced, energetic, cinematic, minimal, dynamic
}
```

**Response:**
```json
{
  "plan": {
    "id": "plan-xxx",
    "clips": [...],
    "actions": [...],
    "metadata": {
      "generated_by": "llm-gpt-4o",
      "created_at": "2026-04-02T..."
    }
  }
}
```

---

### 2. Custom Prompt Generation ⭐ NEW
```
POST /api/director/generate-custom
```

**Request:**
```json
{
  "clips": [
    {"id": "clip-1", "filename": "video.mp4", "duration": 30}
  ],
  "customPrompt": "You are editing a high-energy music video. Use fast rhythmic cuts on beat. Add dramatic zoom transitions. Emphasize musical peaks with visual intensity. Create an EditPlan that feels visceral and energetic."
}
```

**Response:** Same as standard generation

---

## Custom Prompt Templates

### Music Video
```
You are editing a high-energy music video for an EDM track.

Use techniques:
- Fast, rhythmic cuts on beat
- Dramatic zoom transitions
- Fast flashes between scenes
- Color grading that's bold and saturated
- Heavy use of effects to emphasize musical peaks

Create an EditPlan that feels visceral and energetic, synced to intense music.
```

### Documentary
```
You are editing a nature documentary about wildlife.

Use techniques:
- Long, observational cuts to show natural behavior
- Subtle dissolve transitions
- Match cuts between related shots
- Minimal effects to avoid distraction
- Pacing that feels natural and contemplative

Create an EditPlan that's beautiful, clear, and respects the subject matter.
```

### Commercial
```
You are editing a 30-second luxury brand commercial.

Use techniques:
- Smooth, sophisticated transitions
- High-quality color grading with premium LUTs
- Strategic timing to product reveals
- Elegant effects that add value
- Pacing that builds to a climactic product moment

Create an EditPlan that feels premium, aspirational, and memorable.
```

### Comedy/Vlog
```
You are editing a comedy/vlog video for social media.

Use techniques:
- Quick, punchy cuts for comedic timing
- Meme-style transitions and effects
- Jump cuts for emphasis on jokes
- Trend-appropriate visual effects
- Fast pacing with strategic slow-mo moments
- Text overlays and visual humor support

Create an EditPlan that's entertaining, shareable, and maximizes engagement.
```

### Film Trailer
```
You are editing a dramatic film trailer.

Use techniques:
- Dynamic cuts synchronized with music/audio beats
- Tension-building pacing
- Match cuts between thematically related shots
- Dramatic effects (zoom in, flash frames)
- Sound-synchronized cuts for impact
- Building intensity throughout
- Climactic moment punctuation

Create an EditPlan that builds excitement and intrigue.
```

---

## Refinement with Custom Instructions

```
POST /api/director/generate
```

**Request:**
```json
{
  "clips": [...],
  "action": "refine",
  "plan": { /* existing plan */ },
  "instruction": "Make it faster and more energetic like a music video. Add sharp cuts and more transitions."
}
```

The system will:
1. **Analyze** the current plan's pacing and structure
2. **Detect intent** from your instruction (pacing, intensity, effects, etc.)
3. **Call LLM** with professional refinement guidance
4. **Track metrics** showing before/after changes

---

## Usage Examples

### Example 1: Generate Music Video Edit
```bash
curl -X POST http://localhost:3000/api/director/generate-custom \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-1", "filename": "track.mp4", "duration": 45}],
    "customPrompt": "Edit a high-energy EDM music video with fast rhythmic cuts, zoom transitions, and dramatic color grading."
  }'
```

### Example 2: Generate Documentary Edit
```bash
curl -X POST http://localhost:3000/api/director/generate-custom \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-1", "filename": "nature.mp4", "duration": 120}],
    "customPrompt": "Edit a contemplative nature documentary with long observational shots, subtle dissolves, and minimal effects. Respect the subject matter."
  }'
```

### Example 3: Refine for More Impact
```bash
curl -X POST http://localhost:3000/api/director/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [...],
    "action": "refine",
    "plan": { /* existing plan */ },
    "instruction": "Make the transitions sharper and add more visual effects. I want more energy!"
  }'
```

---

## Prompt Engineering Tips

1. **Be Specific** - Describe the exact genre, mood, and techniques
2. **Use Keywords** - Reference specific transition types, effects, pacing
3. **Provide Context** - Mention the content type (music video, commercial, etc.)
4. **Set Expectations** - Describe the desired emotional impact
5. **Mention Timing** - Reference beats, rhythm, or synchronization needs

### Good Prompt ✅
```
Edit a fast-paced product demonstration video. Use quick, snappy cuts (2-3 second segments). 
Include zoom transitions to highlight features. Add color grading to make products look premium. 
Build pacing to crescendo at the call-to-action moment.
```

### Vague Prompt ❌
```
Make it better
```

---

## API Reference

### POST /api/director/generate
Standard generation with predefined styles.

**Styles:**
- `balanced` - Mixed cuts, transitions, effects
- `energetic` - Fast-paced, sharp, dynamic
- `cinematic` - Slow, smooth, narrative-focused
- `minimal` - Intentional, essential cuts only
- `dynamic` - Varied pacing throughout

### POST /api/director/generate-custom
Generation with fully custom prompt.

**Parameters:**
- `clips` (array) - Video clips to edit
- `customPrompt` (string) - Custom editing instructions

### POST /api/director/generate (with refine action)
Refine an existing plan with new instructions.

**Parameters:**
- `clips` (array) - Original clips
- `action` (string) - Set to "refine"
- `plan` (object) - Existing plan to refine
- `instruction` (string) - Refinement instruction

---

## Response Metadata

Every plan includes detailed metadata:

```json
{
  "metadata": {
    "generated_by": "llm-gpt-4o",
    "created_at": "2026-04-02T...",
    
    // For refinements:
    "refined_by": "llm-gpt-4o",
    "refined_at": "2026-04-02T...",
    "refinement_instruction": "Make it faster...",
    "refinement_intent": {
      "pacing": "increase",
      "intensity": "increase",
      ...
    },
    "before_stats": {
      "cutCount": 5,
      "pacing": "slow",
      ...
    },
    "after_stats": {
      "cutCount": 12,
      "pacing": "moderate",
      ...
    }
  }
}
```

---

## Next Steps

1. **Test custom prompts** for your specific use cases
2. **Create prompt templates** for different content types
3. **Collect metrics** on what prompts work best
4. **Integrate into UI** for user-facing custom prompt input
5. **Version your prompts** for A/B testing

---

## Environment Setup

Ensure these are in `.env.local`:

```bash
GITHUB_MODEL_TOKEN=ghp_xxxxx...
GITHUB_MODEL_NAME=gpt-4o
GITHUB_MODEL_ENDPOINT=https://models.inference.ai.azure.com
```

Then start the server:
```bash
cd /Users/hamza/Desktop/m31
node server.mjs
```

Server will be running at `http://localhost:3000`

---

**🎉 You now have a fully dynamic, AI-powered editing system with complete prompt control!**
