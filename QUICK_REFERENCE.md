# AI Director - Quick Reference Guide 🎬

## What You Just Built

A **fully dynamic AI video editing system** that uses prompts instead of hardcoded logic. You control the editing style with natural language!

## Key Files

```
/Users/hamza/Desktop/m31/
├── server.mjs                              # Backend API
├── packages/core/src/prompts/
│   ├── director-prompts.ts                 # Prompt builders
│   └── prompt-library.ts                   # 30+ pre-built prompts
├── DYNAMIC_PROMPTS.md                      # Full documentation
└── test-custom-prompts-simple.sh           # Test script
```

## API Endpoints

### Generate with Predefined Style
```bash
curl -X POST http://localhost:3000/api/director/generate \
  -H "Content-Type: application/json" \
  -d '{"clips": [...], "style": "energetic"}'
```

**Styles:** `balanced`, `energetic`, `cinematic`, `minimal`, `dynamic`

---

### Generate with Custom Prompt ⭐ NEW
```bash
curl -X POST http://localhost:3000/api/director/generate-custom \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [...],
    "customPrompt": "Edit a high-energy music video with fast cuts and zoom transitions."
  }'
```

---

### Refine with Instructions
```bash
curl -X POST http://localhost:3000/api/director/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [...],
    "action": "refine",
    "plan": { /* existing plan */ },
    "instruction": "Make it faster and add more effects"
  }'
```

---

## Prompt Templates You Can Use

### Music Videos
- **EDM**: Fast beats, zoom transitions, dramatic effects
- **Hip-Hop**: Syncopated rhythm, street style, swag
- **Acoustic**: Long shots, subtle dissolves, intimate feel
- **Pop**: Catchy pacing, fun effects, chorus highlights

### Content
- **Vlog**: Quick cuts, jump cuts, social media style
- **Podcast**: Speaker changes, B-roll support, lower thirds
- **Stream Highlights**: Rapid cuts, slow-mo, hype moments
- **Comedy**: Punchy timing, meme transitions, energy

### Commercial
- **Luxury**: Smooth transitions, premium grading, elegance
- **Startup**: Dynamic, fast-paced, innovative feel
- **Real Estate**: Virtual tours, feature highlights, glide transitions
- **Nonprofit**: Authentic, emotional, impactful

### Narrative
- **Documentary**: Long shots, subtle transitions, authentic
- **Trailer**: Tension building, dramatic effects, music sync
- **Interview**: Clean cuts, B-roll variety, audio-driven
- **Commercial**: Story beats, natural product integration

### Technical
- **Tutorial**: Screen recordings, text overlays, clarity
- **Explainer**: Animation sync, concept progression, clean
- **Software Demo**: Screen focus, feature progression, benefits

---

## Example Prompts

### Copy & Paste Ready

**Music Video**
```
Edit a high-energy electronic music video with:
- Fast rhythmic cuts synchronized to beats
- Dramatic zoom transitions on bass drops
- Bold, saturated color grading
- Flash effects during musical peaks
- Building intensity throughout
```

**Documentary**
```
Edit a contemplative nature documentary with:
- Long observational shots
- Subtle dissolve transitions
- Match cuts between related footage
- Minimal effects
- Natural, patient pacing
```

**Commercial**
```
Edit a luxury brand commercial that:
- Uses smooth, sophisticated transitions
- Features premium color grading
- Builds strategically to product reveal
- Employs elegant effects
- Feels aspirational and exclusive
```

**Social Media**
```
Edit an engaging social media video with:
- Quick, punchy 3-5 second cuts
- Jump cuts for comedic timing
- Trend-appropriate transitions
- Text overlays and graphics
- Fast-paced and shareable
```

---

## Refinement Instructions

Use these to iterate on generated plans:

- "Make it faster and more energetic"
- "Slow down and make it more cinematic"
- "Add more visual effects and transitions"
- "Minimize effects and keep it clean"
- "Add more dramatic zoom transitions"
- "Make it feel more like a music video"
- "Give it a vintage, retro aesthetic"
- "Add modern, trendy transitions"
- "Increase pacing and intensity"
- "Build more slowly and deliberately"

---

## Running Tests

### Start Backend
```bash
cd /Users/hamza/Desktop/m31
node server.mjs
```

### Run Tests
```bash
# Test predefined styles
bash test-director-api.sh

# Test custom prompts
bash test-custom-prompts-simple.sh
```

---

## What the LLM Generates

Each prompt generates an `EditPlan` with:

```json
{
  "id": "plan-xxx",
  "clips": [/* input clips */],
  "actions": [
    { "type": "cut", "start": 0, "end": 5 },
    { "type": "transition", "params": { "style": "fade", "duration": 0.3 }, "start": 5, "end": 5.3 },
    { "type": "effect", "params": { "style": "color_grading" }, "start": 0, "end": 5 }
  ],
  "metadata": {
    "generated_by": "llm-gpt-4o",
    "created_at": "2026-04-02T..."
  }
}
```

---

## Prompt Engineering Tips

✅ **Good Prompts**
- Specific about genre and mood
- Mention exact techniques (cut frequency, transition types)
- Describe desired emotional impact
- Reference timing or rhythm needs
- Include content context

❌ **Bad Prompts**
- "Make it better"
- "Edit this video"
- Too vague without context
- Contradictory instructions
- No reference to editing style

---

## Next Steps

1. **Create prompt variations** for your specific use cases
2. **Test and collect metrics** on what works best
3. **Build a prompt library** specific to your brand/content
4. **Integrate into frontend** when you're satisfied with results
5. **Version and iterate** based on results

---

## Files to Integrate Later

When ready to integrate into the main editor (`apps/image` or `apps/web`):

- `server.mjs` - Backend API (can be hosted separately)
- `packages/core/src/prompts/*` - Prompt builders and library
- Documentation in `DYNAMIC_PROMPTS.md`

---

## Status

✅ **COMPLETE:**
- Backend API with prompt support
- Custom prompt endpoint
- Refinement system
- 30+ pre-built prompts
- Dynamic style detection
- Metadata tracking

⏳ **READY FOR:**
- Frontend integration
- User-facing custom prompt UI
- Prompt versioning/history
- Analytics on prompt effectiveness
- Multi-model support (extend to other LLMs)

---

**🎉 You have a production-ready AI editing engine with full prompt control!**
