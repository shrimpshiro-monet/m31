# 🎬 AI Director - Setup & Usage Guide

## ✅ What's Running

### Servers
- **Backend API** (Port 3000): `node server.mjs` - Handles EditPlan generation
- **UI Server** (Port 5173): `node server-ui.mjs` - Serves React UI + proxies to API
- **Status**: Both running and ready ✅

## 🎨 UI Demo

**Access the UI here:**
```
http://localhost:5173/demo/ai-director-ui
```

### Features
1. **Upload Clips** - Select video files (mock duration: 10s default)
2. **Choose Style** - balanced, cinematic, energetic, minimal, dynamic
3. **Generate Plan** - Creates EditPlan with cuts, transitions, and effects
4. **View Results** - See plan ID, clips, actions in real-time
5. **Refine Plan** - Natural language refinement instructions (e.g., "Add more transitions")
6. **Copy JSON** - Export EditPlan as JSON

## 🔧 How It Works

### Request Flow
```
Browser (React UI)
    ↓
UI Server (5173) - serves HTML + proxies API
    ↓
Backend API (3000) - generates EditPlan
    ↓
Returns EditPlan JSON
```

### EditPlan Structure
```json
{
  "id": "plan-uuid",
  "clips": [
    {"id": "clip1", "filename": "video.mp4", "duration": 15, "start": 0}
  ],
  "actions": [
    {
      "id": "act-uuid",
      "type": "cut|transition|effect",
      "params": {...},
      "start": 0,
      "end": 5
    }
  ],
  "metadata": {
    "generated_by": "heuristic-fallback",
    "created_at": "2026-04-01T...",
    "refined_by": "llm-gpt-4o"
  }
}
```

## 📡 API Endpoints

### Generate EditPlan
```bash
POST http://localhost:3000/api/director/generate
Content-Type: application/json

{
  "clips": [
    {"id": "clip1", "filename": "video.mp4", "duration": 15, "start": 0}
  ],
  "style": "energetic"
}
```

### Refine Existing Plan
```bash
POST http://localhost:3000/api/director/generate
Content-Type: application/json

{
  "clips": [...],
  "style": "energetic",
  "action": "refine",
  "plan": {...existing plan...},
  "instruction": "Add more transitions between clips"
}
```

## 🤖 LLM Integration

**Current Status**: Ready but token needs validation

**To enable real LLM:**
1. Get GitHub Models API token
2. Update `.env.local`:
   ```
   GITHUB_MODEL_ENDPOINT="https://models.github.ai/models/openai/gpt-4o/chat/completions"
   GITHUB_MODEL_TOKEN="your_token_here"
   GITHUB_MODEL_NAME="gpt-4o"
   ```
3. Restart backend server
4. LLM will be called automatically for plan generation

**Fallback**: Heuristic generator (always works, generates decent plans)

## 🚀 Starting the Services

### Start Everything
```bash
cd /Users/hamza/Desktop/m31

# Load env and start backend
export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
node server.mjs &
sleep 3

# Start UI server
node server-ui.mjs &
sleep 3

echo "Open: http://localhost:5173/demo/ai-director-ui"
```

### Kill Everything
```bash
pkill -f "node server"; pkill -f "python3"
```

## 📊 Test Examples

### Simple Generation
```bash
curl -X POST http://localhost:3000/api/director/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [{"id":"c1","filename":"test.mp4","duration":10}],
    "style":"cinematic"
  }'
```

### Multi-Clip With Refinement
```bash
# Generate
PLAN=$(curl -s -X POST http://localhost:3000/api/director/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clips": [
      {"id":"clip1","filename":"a.mp4","duration":15},
      {"id":"clip2","filename":"b.mp4","duration":8}
    ],
    "style":"energetic"
  }' | jq '.plan')

# Refine
curl -X POST http://localhost:3000/api/director/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"clips\": [{\"id\":\"clip1\",\"filename\":\"a.mp4\",\"duration\":15}],
    \"style\": \"energetic\",
    \"action\": \"refine\",
    \"plan\": $PLAN,
    \"instruction\": \"Add smooth fade transitions between every cut\"
  }"
```

## 🎯 Next Steps

1. ✅ **UI Working** - Upload clips and generate plans visually
2. ⏳ **Real LLM** - Validate GitHub token and integrate
3. ⏳ **Export** - Save EditPlans, integrate with editor
4. ⏳ **Advanced** - Batch processing, templates, presets

## 📁 Key Files

- `server.mjs` - Backend API (EditPlan generation)
- `server-ui.mjs` - UI server (React app + proxy)
- `apps/web/src/pages/AIDirectorDemo.tsx` - React UI component
- `.env.local` - Environment configuration
- `packages/core/src/monetAgentConfig.ts` - EditPlan schema

Enjoy! 🎬✨
