# AI Director & Frontend Integration - Complete System Documentation Index

## 📚 Documentation Files

### Phase 2 - Frontend UI Integration (LATEST - April 2, 2026) ⭐

#### Quick Start
- **[PHASE2_QUICK_REFERENCE.md](./PHASE2_QUICK_REFERENCE.md)** - ⭐ START HERE! Quick overview of Phase 2 results (5 min)
- **[PHASE2_FINAL_REPORT.md](./PHASE2_FINAL_REPORT.md)** - Executive summary with all metrics (15 min)

#### Detailed Documentation  
- **[FRONTEND_UI_INTEGRATION_PHASE2_COMPLETE.md](./FRONTEND_UI_INTEGRATION_PHASE2_COMPLETE.md)** - Detailed Phase 2 results (20 min)
- **[PHASE3_PLAN.md](./PHASE3_PLAN.md)** - Phase 3 roadmap and implementation plan (15 min)

#### Architecture & Integration
- **[DYNAMIC_TITLE_AI_CONTEXT_GUIDE.md](./DYNAMIC_TITLE_AI_CONTEXT_GUIDE.md)** - Deep-dive architecture (30 min)
- **[DYNAMIC_TITLE_INTEGRATION_CHECKLIST.md](./DYNAMIC_TITLE_INTEGRATION_CHECKLIST.md)** - Implementation guide (20 min)

---

### Original AI Director Documentation

### Quick Start (AI Director)
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick guide with copy-paste examples
- **[PROMPT_SYSTEM_SUMMARY.md](./PROMPT_SYSTEM_SUMMARY.md)** - What changed from hardcoded to dynamic

### Complete Documentation (AI Director)
- **[DYNAMIC_PROMPTS.md](./DYNAMIC_PROMPTS.md)** - Full API documentation and usage examples
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, flows, and diagrams

### Reference (AI Director)
- **[packages/core/src/prompts/director-prompts.ts](./packages/core/src/prompts/director-prompts.ts)** - Prompt builder functions
- **[packages/core/src/prompts/prompt-library.ts](./packages/core/src/prompts/prompt-library.ts)** - 30+ pre-built prompts


---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd /Users/hamza/Desktop/m31
node server.mjs
```

### 2. Generate with Custom Prompt
```bash
curl -X POST http://localhost:3000/api/director/generate-custom \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id": "clip-1", "filename": "video.mp4", "duration": 30}],
    "customPrompt": "Edit a high-energy music video with fast cuts and zoom transitions."
  }'
```

### 3. Refine the Result
```bash
curl -X POST http://localhost:3000/api/director/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [...],
    "action": "refine",
    "plan": { /* plan from step 2 */ },
    "instruction": "Make it even faster and add more effects"
  }'
```

---

## 📖 What Each File Covers

| File | Purpose | Best For |
|------|---------|----------|
| QUICK_REFERENCE.md | Copy-paste ready examples | Getting started, common use cases |
| DYNAMIC_PROMPTS.md | Complete API reference | Understanding all options, API design |
| ARCHITECTURE.md | System design & flows | Deep dive, understanding architecture |
| PROMPT_SYSTEM_SUMMARY.md | Changes from v1 to v2 | Understanding improvements |
| director-prompts.ts | Prompt builder code | Modifying prompt generation logic |
| prompt-library.ts | 30+ pre-built prompts | Adding/editing prompts, browsing options |

---

## 🎯 Common Tasks

### Generate a Music Video Edit
Read: QUICK_REFERENCE.md → "Prompt Templates" → Music Videos
Or use: `prompt-library.ts` → `PROMPT_LIBRARY.musicVideo.edm`

### Create Custom Prompt for New Genre
1. Read QUICK_REFERENCE.md → "Prompt Engineering Tips"
2. Reference ARCHITECTURE.md → "Prompt Hierarchy"
3. Test with `/api/director/generate-custom` endpoint

### Integrate into Frontend
1. Read DYNAMIC_PROMPTS.md → Endpoints section
2. Review ARCHITECTURE.md → Data Flow
3. Use `/api/director/generate-custom` endpoint
4. Handle metadata in response

### Debug Why Plan Looks Wrong
1. Check DYNAMIC_PROMPTS.md → Response Metadata
2. Look at refinement_intent in metadata
3. Check before_stats vs after_stats
4. Try custom prompt with more specific instructions

---

## 🔧 System Components

### Backend (`server.mjs`)
- Express.js API server
- GitHub Models integration (gpt-4o)
- Prompt building and validation
- Fallback chain (LLM → repair → heuristic)

### Prompts (`packages/core/src/prompts/`)
- **director-prompts.ts**: Functions to build dynamic prompts
- **prompt-library.ts**: 30+ pre-built prompt templates

### Testing
- **test-director-api.sh**: Test 7 different scenarios
- **test-custom-prompts-simple.sh**: Test 3 custom prompt examples
- **test-prompts.sh**: Interactive prompt testing suite

---

## 📊 Capabilities

✅ **Supported Actions**
- Cut segments
- Transitions (fade, dissolve, flash, wipe, zoom, etc.)
- Effects (color grading, zoom, punch, etc.)

✅ **Style Support**
- 5 predefined: balanced, energetic, cinematic, minimal, dynamic
- 20+ genre-specific templates
- Unlimited custom prompts

✅ **Input Support**
- Single clips
- Multiple clips
- Short videos (< 10s)
- Long videos (> 60s)
- Any duration

✅ **Refinement Support**
- Pacing changes
- Intensity adjustments
- Effect variations
- Style transformations
- Complete rewrites

---

## 🎬 Prompt Library Overview

### 🎵 Music (4 types)
- EDM: Fast, dramatic, energetic
- Hip-Hop: Syncopated, street style
- Acoustic: Long shots, subtle
- Pop: Catchy, fun, chorus-focused

### 📱 Content (4 types)
- Vlog: Quick cuts, social media
- Podcast: Speaker sync, B-roll
- Stream Highlights: Rapid, hype
- Comedy: Timing-based, meme style

### 🏢 Commercial (4 types)
- Luxury: Premium, elegant, smooth
- Startup: Modern, fast, innovative
- Nonprofit: Authentic, emotional
- Real Estate: Virtual tour, features

### 🎬 Narrative (4 types)
- Documentary: Authentic, patient
- Trailer: Tension, dramatic
- Interview: Clean, info-focused
- Story: Narrative, character-driven

### 💻 Technical (3 types)
- Tutorial: Clear, step-by-step
- Explainer: Concept progression
- Demo: Feature-focused, benefits

### 🎨 Variations (5 types)
- Slow Burn: Gradual intensity
- Frenetic: Hyper-energetic
- Minimalist: Essential only
- Glitch: Modern, trendy
- Vintage: Retro, film-like

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/director/generate` | POST | Generate with predefined style |
| `/api/director/generate-custom` | POST | Generate with custom prompt |
| `/api/director/generate` (refine) | POST | Refine existing plan |
| `/health` | GET | Health check |

---

## 📈 What You Get

Each generation returns:

```json
{
  "plan": {
    "id": "plan-uuid",
    "clips": [/* input clips */],
    "actions": [/* editing actions */],
    "metadata": {
      "generated_by": "llm-gpt-4o",
      "created_at": "ISO timestamp",
      
      // Optional (if refined):
      "refined_by": "llm-gpt-4o",
      "refinement_intent": { /* detected intent */ },
      "before_stats": { /* metrics before */ },
      "after_stats": { /* metrics after */ }
    }
  }
}
```

---

## 🚀 Next Steps

### Immediate
1. ✅ Explore custom prompts with your content
2. ✅ Test different genres and styles
3. ✅ Refine plans to see improvement metrics

### Short Term
4. Integrate API into frontend UI
5. Build prompt library UI for users
6. Collect metrics on prompt effectiveness

### Medium Term
7. Add multi-model support (Claude, Gemini, etc.)
8. Build prompt versioning system
9. Create team collaboration features

### Long Term
10. Production deployment
11. Advanced analytics
12. Custom model fine-tuning

---

## 🆘 Troubleshooting

**Backend won't start?**
- Check `.env.local` has valid `GITHUB_MODEL_TOKEN`
- Ensure port 3000 isn't in use
- Read server logs for error details

**Custom prompt returns invalid JSON?**
- Ensure prompt is clear and specific
- Check prompt doesn't ask for markdown code blocks
- Review examples in QUICK_REFERENCE.md

**Refinement not working as expected?**
- Check metadata.refinement_intent detected correctly
- Look at before_stats vs after_stats
- Try more specific instruction language

**Want to modify behavior?**
- Edit `prompt-library.ts` for pre-built prompts
- Edit `director-prompts.ts` for builder logic
- Adjust system prompts in `server.mjs`

---

## 📞 Reference

- GitHub Models API: https://docs.github.com/en/models/
- Azure AI Inference SDK: https://github.com/Azure/azure-rest-api-specs
- EditPlan Schema: See ARCHITECTURE.md

---

**🎉 System Complete & Ready for Use!**

Start with: **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**

---
