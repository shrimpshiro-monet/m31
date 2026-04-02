# AI Director - System Architecture & Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Coming Soon)                       │
│         React App - Custom Prompt UI, Prompt Library             │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼──────────────────────────────────────┐
│                   EXPRESS.JS SERVER (Port 3000)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/director/generate          (Style-based)             │
│    └─ Inputs: clips, style                                      │
│    └─ Returns: EditPlan                                         │
│                                                                   │
│  POST /api/director/generate-custom   (Prompt-based) ⭐         │
│    └─ Inputs: clips, customPrompt                               │
│    └─ Returns: EditPlan with custom editing                     │
│                                                                   │
│  POST /api/director/generate          (Refinement)              │
│    └─ Inputs: clips, action:'refine', plan, instruction         │
│    └─ Returns: Refined EditPlan with metrics                    │
│                                                                   │
│  Prompt Builder Module                                          │
│    ├─ buildGenerationPrompt()                                    │
│    ├─ buildRefinementPrompt()                                    │
│    └─ buildCustomPrompt()                                        │
│                                                                   │
│  Prompt Library (30+ templates)                                 │
│    ├─ Music (EDM, HipHop, Acoustic, Pop)                        │
│    ├─ Content (Vlog, Podcast, Highlights, Comedy)               │
│    ├─ Commercial (Luxury, Startup, Nonprofit, RealEstate)       │
│    ├─ Narrative (Documentary, Trailer, Interview, Story)        │
│    ├─ Technical (Tutorial, Explainer, Demo)                     │
│    └─ Variations (SlowBurn, Frenetic, Minimalist, Glitch, etc)  │
│                                                                   │
│  LLM Integration                                                │
│    └─ GitHub Models (gpt-4o via Azure SDK)                      │
│                                                                   │
│  Validation & Repair                                            │
│    └─ Validates EditPlan JSON structure                         │
│    └─ Auto-repairs invalid responses                            │
│                                                                   │
│  Fallback Chain                                                 │
│    1. Try LLM generation                                        │
│    2. If invalid, repair and retry                              │
│    3. If fails, use heuristic fallback                          │
│                                                                   │
└─────────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼──────────────────────────────────────┐
│            GITHUB MODELS API (Azure Endpoint)                     │
│         https://models.inference.ai.azure.com                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Model: gpt-4o                                                  │
│  Authentication: GitHub PAT Token (models:read scope)           │
│  Request: Dynamic prompt + system instructions                  │
│  Response: JSON EditPlan                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Generation Flow (Custom Prompt)

```
┌─────────────────────────────────────────────┐
│  Client Request                             │
│  POST /api/director/generate-custom         │
│  {                                          │
│    "clips": [...]                           │
│    "customPrompt": "Edit a music video..."  │
│  }                                          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Validate Input                             │
│  - Check clips array exists                 │
│  - Check customPrompt is string             │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Build LLM Prompt                           │
│  - Add system prompt (editor role)          │
│  - Add custom prompt                        │
│  - Add clips data                           │
│  - Add formatting instructions              │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Call GitHub Models API                     │
│  - Send to gpt-4o                           │
│  - temperature: 0.7                         │
│  - max_tokens: 2000                         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Parse Response                             │
│  - Extract JSON from response               │
│  - Handle markdown code blocks              │
│  - Validate structure                       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Validation                                 │
│  ✓ Valid JSON?                              │
│  ✓ Has id?                                  │
│  ✓ Has clips array?                         │
│  ✓ Has actions array?                       │
└────────────┬───────────────────┬────────────┘
             │                   │
        ✓ Valid            ❌ Invalid
             │                   │
             ▼                   ▼
      ┌──────────────┐   ┌──────────────────┐
      │ Return Plan  │   │ Attempt Repair   │
      └──────────────┘   └──────┬───────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ Repair Success? │
                        └───┬──────────┬───┘
                       ✓   │          │ ❌
                            ▼         ▼
                      ┌──────────┐  ┌──────────┐
                      │Return    │  │Fallback  │
                      │Repaired  │  │Heuristic │
                      │Plan      │  │Plan      │
                      └──────────┘  └──────────┘
```

### Refinement Flow

```
┌────────────────────────────────────────────┐
│  Client Request                            │
│  POST /api/director/generate               │
│  {                                         │
│    "clips": [...],                         │
│    "action": "refine",                     │
│    "plan": { existing plan },              │
│    "instruction": "Make it faster..."      │
│  }                                         │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Analyze Current Plan                      │
│  - Count cuts, transitions, effects        │
│  - Calculate avg cut duration              │
│  - Determine current pacing                │
│  - Detect duration and clip count          │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Interpret Refinement Intent               │
│  - Parse instruction text                  │
│  - Detect: pacing, intensity, effects      │
│  - Detect: tone, rhythm, transitions       │
│  - Classify refinement type                │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Build Refinement Prompt                   │
│  - System prompt (professional editor)     │
│  - Current plan analysis (stats)           │
│  - Current plan (JSON)                     │
│  - Refinement strategy                     │
│  - User instruction                        │
│  - Professional principles                 │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Call GitHub Models API                    │
│  - Send refinement prompt                  │
│  - Request modified plan                   │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Validate & Calculate Metrics              │
│  - Validate refined plan                   │
│  - Calculate before stats                  │
│  - Calculate after stats                   │
│  - Track changes                           │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Return Enhanced Metadata                  │
│  {                                         │
│    "plan": { refined plan },               │
│    "metadata": {                           │
│      "refined_by": "llm-gpt-4o",          │
│      "refinement_instruction": "...",      │
│      "refinement_intent": { ... },         │
│      "before_stats": { ... },              │
│      "after_stats": { ... }                │
│    }                                       │
│  }                                         │
└────────────────────────────────────────────┘
```

## Prompt Hierarchy

```
System Prompt (Root)
├─ Professional role definition
├─ Video editing expertise
└─ Output format requirements

        ↓

Generation/Refinement Prompt
├─ Style guide (for generation)
├─ Refinement strategy (for refinement)
├─ Video context (clips, duration)
└─ Special considerations (edge cases)

        ↓

Custom Prompt (Optional Override)
├─ User-provided instructions
├─ Genre/context specific
├─ Custom techniques/effects
└─ Emotional/visual goals

        ↓

LLM (gpt-4o)
├─ Processes complete prompt
├─ Generates EditPlan JSON
└─ Returns structured response
```

## EditPlan Structure

```json
{
  "id": "plan-uuid",                    // Unique plan identifier
  "clips": [                            // Input video clips
    {
      "id": "clip-1",
      "filename": "video.mp4",
      "duration": 30
    }
  ],
  "actions": [                          // Editing actions
    {
      "id": "act-uuid",
      "type": "cut|transition|effect",
      "params": { /* type-specific */ },
      "start": 0,                        // Timecode start (seconds)
      "end": 5                           // Timecode end (seconds)
    }
  ],
  "metadata": {
    "generated_by": "llm-gpt-4o",
    "created_at": "2026-04-02T...",
    
    // For refinements:
    "refined_by": "llm-gpt-4o",
    "refined_at": "2026-04-02T...",
    "refinement_instruction": "...",
    "refinement_intent": { /* detected intent */ },
    "before_stats": { /* plan metrics before */ },
    "after_stats": { /* plan metrics after */ }
  }
}
```

## Data Flow Visualization

```
Video Clips (Input)
      │
      ▼
┌──────────────┐
│ Clip Parser  │  Extract: duration, count, format
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Prompt Builder       │  Build: system + generation + custom
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ LLM (gpt-4o)         │  Generate: EditPlan JSON
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ JSON Parser          │  Extract: EditPlan from response
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Validator            │  Check: structure, required fields
└──────┬───┬───────────┘
   ✓   │   │ ❌
       │   ▼
       │  ┌──────────────┐
       │  │ Auto Repair  │  Fix: missing fields, invalid refs
       │  └──────┬───────┘
       │         │
       │    ✓ │ ❌
       │    │   ▼
       │    │  ┌──────────────┐
       │    │  │ Heuristic    │  Fallback: generate from rules
       │    │  │ Fallback     │
       │    │  └──────┬───────┘
       │    │         │
       └────┼─────────┘
            │
            ▼
       ┌──────────────┐
       │ Metrics Calc │  Calculate: pacing, action counts, etc
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ Return       │  Response: EditPlan + metadata
       │ Response     │
       └──────────────┘
```

---

**System is production-ready and highly scalable!** 🚀
