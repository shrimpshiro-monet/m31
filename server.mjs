import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import createClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';

// Load environment variables from .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// GitHub Models configuration
const GITHUB_TOKEN = process.env.GITHUB_MODEL_TOKEN || process.env.GITHUB_TOKEN || '';
const GITHUB_MODEL_ID = process.env.GITHUB_MODEL_NAME || 'gpt-4o';
const GITHUB_API_ENDPOINT = 'https://models.inference.ai.azure.com';

// Initialize Azure OpenAI client
let githubClient = null;
if (GITHUB_TOKEN) {
  try {
    githubClient = createClient(GITHUB_API_ENDPOINT, new AzureKeyCredential(GITHUB_TOKEN));
  } catch (err) {
    console.error('Failed to initialize Azure client:', err.message);
  }
}

// Log configuration on startup
console.log('\n🔑 Configuration:');
console.log(`   GITHUB_TOKEN: ${GITHUB_TOKEN ? '✅ Set (' + GITHUB_TOKEN.substring(0, 10) + '...)' : '❌ Not set'}`);
console.log(`   GITHUB_MODEL_ID: ${GITHUB_MODEL_ID}`);
console.log(`   GITHUB_API_ENDPOINT: ${GITHUB_API_ENDPOINT}`);
console.log(`   Azure Client: ${githubClient ? '✅ Initialized' : '❌ Not initialized'}\n`);

// Helper to call GitHub marketplace model via Azure SDK
async function callGitHubModel(prompt) {
  if (!githubClient || !GITHUB_TOKEN) {
    console.warn('⚠️  GitHub client not initialized, using heuristic fallback');
    return null;
  }

  try {
    console.log(`🤖 Calling GitHub model: ${GITHUB_MODEL_ID}`);
    console.log(`📝 Prompt preview: ${prompt.substring(0, 100)}...\n`);

    const response = await githubClient.path('/chat/completions').post({
      body: {
        model: GITHUB_MODEL_ID,
        messages: [
          {
            role: 'system',
            content: `You are an expert video editor. Generate a RICH, DETAILED professional EditPlan in valid JSON format.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON, no markdown, no explanations - start with { and end with }
2. Must have: id, clips, actions, metadata
3. id: unique identifier (e.g., "plan-12345")
4. clips: array with {id, filename, duration, start}
5. actions: COMPREHENSIVE array with multiple action types
6. metadata: {generated_by, created_at, total_actions, action_types}

ACTION TYPES TO INCLUDE (be comprehensive):
- cut: main content cuts with {clipId, trim_start, trim_end, intensity}
- transition: between segments {style, duration, easing}
- effect: visual effects {name, intensity, duration} (bloom, glow, motion-blur, zoom, punch, beat-sync, vignette)
- color: color grading {grade, intensity} (cinematic-warm, teal-orange, cool-tones, vibrant, contrast-boost)
- audio: audio processing {effect, duration} (normalize, fade, reverb, compress, eq, punch)
- text: overlays {content, duration, position, style}

RICHNESS REQUIREMENTS:
1. Generate 2-3x more actions than minimal version
2. Include ALL action types where appropriate
3. Add color grades at beginning and end
4. Add audio effects throughout
5. Add effects per segment, not just transitions
6. Vary transitions and effects between clips
7. Include timing for every action
8. Make params detailed with multiple properties

TIMING:
- Calculate total duration from clips
- Distribute actions across full timeline
- Ensure all start/end times are valid

Example action density: 30+ actions for 45-60 second video

Return JSON immediately.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
    });

    console.log('📤 Raw model response received');

    if (!response.body?.choices || !response.body.choices[0]) {
      console.error('❌ Unexpected response format from Azure');
      return null;
    }

    const content = response.body.choices[0].message?.content || '';
    console.log(`\n🔍 Extracted content length: ${content.length} chars`);
    console.log(`📋 First 200 chars: ${content.substring(0, 200)}`);

    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON object found in response');
      console.log('Full response was:', content);
      return null;
    }

    let planJson;
    try {
      planJson = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('❌ Failed to parse JSON:', parseErr.message);
      console.log('Attempted to parse:', jsonMatch[0].substring(0, 300));
      return null;
    }

    console.log('✅ Parsed EditPlan from model:', { 
      id: planJson.id, 
      actions: planJson.actions?.length || 0,
      clips: planJson.clips?.length || 0
    });
    
    // Log full structure for debugging
    console.log('📊 Plan structure:', JSON.stringify(planJson, null, 2).substring(0, 500));
    
    return planJson;
  } catch (err) {
    console.error('❌ LLM call failed:', err.message);
    if (err.response?.status) {
      console.error(`   HTTP ${err.response.status}`);
    }
    return null;
  }
}

// Simple validator (EditPlan is valid if it has id, clips array, and actions array)
function validateEditPlan(plan) {
  if (!plan || typeof plan !== 'object') {
    return { valid: false, error: 'Plan must be an object' };
  }
  if (!plan.id) {
    return { valid: false, error: 'Plan missing id' };
  }
  if (!Array.isArray(plan.clips)) {
    return { valid: false, error: 'Plan missing clips array' };
  }
  if (!Array.isArray(plan.actions)) {
    return { valid: false, error: 'Plan missing actions array' };
  }
  return { valid: true, data: plan };
}

// Helper: create heuristic plan
function makeId(prefix = 'id') {
  try {
    return crypto.randomUUID?.() ?? `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function createHeuristicEditPlan(clips, style = 'balanced') {
  const id = makeId('plan');
  const planClips = (clips || []).map((c, i) => ({
    id: c.id ?? makeId('clip'),
    filename: c.filename ?? `clip-${i}.mp4`,
    duration: typeof c.duration === 'number' ? c.duration : 1,
    start: typeof c.start === 'number' ? c.start : 0,
    end: typeof c.end === 'number' ? c.end : undefined,
  }));

  const actions = [];
  
  // Rich style configurations with more parameters
  const styleConfig = {
    balanced: { 
      cutFreq: 0.33,
      transitionDuration: 0.3,
      transitions: ['fade', 'dissolve', 'cut'],
      effects: ['fade', 'zoom', 'motion-blur'],
      colorGrades: ['neutral', 'warm', 'cool'],
      audioEffects: ['normalize', 'fade'],
    },
    cinematic: { 
      cutFreq: 0.2,
      transitionDuration: 0.6,
      transitions: ['dissolve', 'fade', 'zoom-fade'],
      effects: ['vignette', 'lens-flare', 'chromatic-aberration'],
      colorGrades: ['cinematic-warm', 'teal-orange', 'cool-tones'],
      audioEffects: ['reverb', 'fade', 'compress'],
    },
    energetic: { 
      cutFreq: 0.6,
      transitionDuration: 0.15,
      transitions: ['cut', 'wipe', 'zoom'],
      effects: ['punch', 'beat-sync', 'glow'],
      colorGrades: ['vibrant', 'high-contrast', 'saturated'],
      audioEffects: ['punch', 'normalize', 'compress'],
    },
    minimal: { 
      cutFreq: 0.25,
      transitionDuration: 0.2,
      transitions: ['fade', 'cut'],
      effects: ['subtle-zoom'],
      colorGrades: ['neutral', 'minimal-grade'],
      audioEffects: ['fade', 'normalize'],
    },
    dynamic: { 
      cutFreq: 0.45,
      transitionDuration: 0.3,
      transitions: ['dissolve', 'wipe', 'zoom', 'slide'],
      effects: ['bloom', 'motion-blur', 'zoom', 'glow'],
      colorGrades: ['dynamic', 'pop', 'vibrant'],
      audioEffects: ['normalize', 'compress', 'eq'],
    },
  };

  const config = styleConfig[style] || styleConfig.balanced;
  let globalTime = 0;

  // Add opening color grade
  if (planClips.length > 0) {
    const gradeIndex = Math.floor(Math.random() * config.colorGrades.length);
    actions.push({
      id: makeId('act'),
      type: 'color',
      params: {
        grade: config.colorGrades[gradeIndex],
        intensity: 0.8,
      },
      start: 0,
      end: Math.min(10, planClips.reduce((sum, c) => sum + c.duration, 0)),
    });
  }

  // Process each clip
  for (let clipIdx = 0; clipIdx < planClips.length; clipIdx++) {
    const clip = planClips[clipIdx];
    const targetCutCount = Math.max(2, Math.ceil(clip.duration * config.cutFreq));
    const segmentDuration = clip.duration / targetCutCount;
    const clipStartTime = globalTime;

    for (let cutIdx = 0; cutIdx < targetCutCount; cutIdx++) {
      const segStart = cutIdx * segmentDuration;
      const segEnd = Math.min(clip.duration, (cutIdx + 1) * segmentDuration);
      const segDuration = segEnd - segStart;

      // Main cut/segment
      actions.push({
        id: makeId('act'),
        type: 'cut',
        params: {
          clipId: clip.id,
          intensity: style === 'energetic' ? 'fast' : style === 'cinematic' ? 'slow' : 'normal',
          trim_start: segStart,
          trim_end: segEnd,
        },
        start: globalTime,
        end: globalTime + segDuration,
      });

      // Add effect to segment
      if (Math.random() > 0.3) {
        const effectIndex = Math.floor(Math.random() * config.effects.length);
        actions.push({
          id: makeId('act'),
          type: 'effect',
          params: {
            name: config.effects[effectIndex],
            intensity: style === 'energetic' ? 'high' : 'medium',
            duration: 0.3,
          },
          start: globalTime + 0.1,
          end: globalTime + segDuration - 0.1,
        });
      }

      globalTime += segDuration;

      // Add transitions between segments
      if (cutIdx < targetCutCount - 1 && segmentDuration > 1) {
        const transIndex = Math.floor(Math.random() * config.transitions.length);
        const transDur = config.transitionDuration;
        actions.push({
          id: makeId('act'),
          type: 'transition',
          params: {
            style: config.transitions[transIndex],
            duration: transDur,
            easing: 'ease-in-out',
          },
          start: globalTime - transDur * 0.5,
          end: globalTime + transDur * 0.5,
        });
      }
    }

    // Add audio effect for this clip
    if (config.audioEffects.length > 0) {
      const audioIndex = Math.floor(Math.random() * config.audioEffects.length);
      actions.push({
        id: makeId('act'),
        type: 'audio',
        params: {
          effect: config.audioEffects[audioIndex],
          duration: 0.2,
        },
        start: clipStartTime,
        end: globalTime,
      });
    }

    // Add transition between clips
    if (clipIdx < planClips.length - 1) {
      const transIndex = Math.floor(Math.random() * config.transitions.length);
      const transDur = config.transitionDuration;
      actions.push({
        id: makeId('act'),
        type: 'transition',
        params: {
          style: config.transitions[transIndex],
          duration: transDur,
          easing: 'ease-in-out',
        },
        start: globalTime - transDur * 0.5,
        end: globalTime + transDur * 0.5,
      });

      // Add impact effect for energetic style
      if (style === 'energetic') {
        actions.push({
          id: makeId('act'),
          type: 'effect',
          params: {
            name: 'beat-sync',
            intensity: 'high',
          },
          start: globalTime - 0.2,
          end: globalTime + 0.3,
        });
      }
    }
  }

  // Add closing color grade adjustment
  if (actions.length > 0) {
    const endTime = Math.max(...actions.map(a => a.end || 0));
    actions.push({
      id: makeId('act'),
      type: 'color',
      params: {
        grade: 'contrast-boost',
        intensity: 0.5,
      },
      start: Math.max(0, endTime - 3),
      end: endTime,
    });
  }

  return {
    id,
    clips: planClips,
    actions,
    metadata: {
      generated_by: 'heuristic-rich',
      created_at: new Date().toISOString(),
      style_applied: style,
      total_duration: globalTime,
      action_types: [...new Set(actions.map(a => a.type))],
      total_actions: actions.length,
    },
  };
}

// Professional refinement strategies
function analyzeCurrentPlan(plan) {
  const stats = {
    totalActions: plan.actions?.length || 0,
    totalDuration: Math.max(...(plan.actions?.map(a => a.end) || [0])),
    cutCount: (plan.actions || []).filter(a => a.type === 'cut').length,
    transitionCount: (plan.actions || []).filter(a => a.type === 'transition').length,
    effectCount: (plan.actions || []).filter(a => a.type === 'effect').length,
    avgCutDuration: 0,
    pacing: 'unknown',
  };

  if (stats.cutCount > 0) {
    stats.avgCutDuration = (stats.totalDuration / stats.cutCount).toFixed(2);
  }

  // Determine pacing
  if (stats.cutCount > stats.totalDuration / 3) {
    stats.pacing = 'fast';
  } else if (stats.cutCount < stats.totalDuration / 8) {
    stats.pacing = 'slow';
  } else {
    stats.pacing = 'moderate';
  }

  return stats;
}

function interpretRefinementIntent(instruction) {
  const lowerInstruction = instruction.toLowerCase();
  
  const intents = {
    pacing: false,
    intensity: false,
    transitions: false,
    effects: false,
    tone: false,
    rhythm: false,
  };

  // Detect intent patterns
  if (/faster|speed|quicker|rapid|rush/.test(lowerInstruction)) {
    intents.pacing = 'increase';
  } else if (/slower|slow.*down|calm|relax|breathing/.test(lowerInstruction)) {
    intents.pacing = 'decrease';
  }

  if (/intense|energy|punch|aggressive|dynamic|powerful/.test(lowerInstruction)) {
    intents.intensity = 'increase';
  } else if (/gentle|soft|smooth|subtle|quiet/.test(lowerInstruction)) {
    intents.intensity = 'decrease';
  }

  if (/transition|flash|wipe|dissolve|cross|blend/.test(lowerInstruction)) {
    intents.transitions = true;
  }

  if (/effect|visual|color|grading|filter|distort|blur|zoom/.test(lowerInstruction)) {
    intents.effects = true;
  }

  if (/cinematic|dramatic|moody|uplifting|dark|bright|energetic|chill/.test(lowerInstruction)) {
    intents.tone = true;
  }

  if (/rhythm|beat|sync|music|timing/.test(lowerInstruction)) {
    intents.rhythm = true;
  }

  return intents;
}

// Main endpoint
app.post('/api/director/generate', async (req, res) => {
  const { clips, style, action, plan, instruction } = req.body;

  // Validate input
  if (!clips || !Array.isArray(clips)) {
    return res.status(400).json({ error: 'invalid_input', details: 'missing clips array' });
  }

  console.log('\n📥 Request received:', { clips: clips.length, style, action, hasInstruction: !!instruction });

  // Handle refinement
  if (action === 'refine' && plan) {
    console.log('🔄 Refining existing plan...');
    
    // Analyze current plan and intent
    const planStats = analyzeCurrentPlan(plan);
    const refinementIntent = instruction ? interpretRefinementIntent(instruction) : {};
    
    console.log(`📊 Current plan stats:`, planStats);
    console.log(`🎯 Refinement intent:`, refinementIntent);
    
    // Try to use LLM for professional refinement
    if (instruction) {
      const refinementPrompt = `
You are a professional video editor refining an existing edit based on creative direction.

Current Plan Analysis:
${JSON.stringify(planStats, null, 2)}

Current Plan:
${JSON.stringify(plan, null, 2)}

User Direction:
${instruction}

As a seasoned editor, apply the following professional editing principles:
1. If pacing needs to increase: add more cuts, shorten transitions, reduce effect durations
2. If pacing needs to decrease: reduce cuts, lengthen transitions, add breathing room
3. If intensity needs to increase: use sharp transitions (cut, flash, wipe), add effects, increase zoom/punch
4. If intensity needs to decrease: use soft transitions (fade, dissolve), remove harsh effects
5. If focusing on transitions: vary transition types and durations for visual interest
6. If focusing on effects: add color grading, visual effects, and time-based effects
7. Maintain musical/visual rhythm consistency throughout

User's specific direction: "${instruction}"

Generate a refined EditPlan JSON object with the SAME structure, but with modifications that honor the user's creative direction.
The refined plan should feel more professional and polished.

Return ONLY valid JSON, no explanations or code blocks. Start with { and end with }.
`;
      const llmRefinedPlan = await callGitHubModel(refinementPrompt);
      if (llmRefinedPlan) {
        const validation = validateEditPlan(llmRefinedPlan);
        if (validation.valid) {
          console.log('✅ LLM refinement successful');
          const refinedStats = analyzeCurrentPlan(validation.data);
          console.log(`📊 Refined plan stats:`, refinedStats);
          validation.data.metadata = {
            ...validation.data.metadata,
            refined_by: 'llm-gpt-4o',
            refined_at: new Date().toISOString(),
            refinement_instruction: instruction,
            refinement_intent: refinementIntent,
            before_stats: planStats,
            after_stats: refinedStats,
          };
          return res.json({ plan: validation.data });
        }
      }
    }

    // Fallback: smart heuristic refinement based on intent
    console.log('⚠️  LLM refinement unavailable, applying smart heuristic refinement...');
    let refinedPlan = JSON.parse(JSON.stringify(plan)); // Deep copy
    
    // Apply heuristic refinements based on detected intent
    if (refinementIntent.pacing === 'increase') {
      console.log('📈 Increasing pacing: shortening transitions and adding more cuts');
      refinedPlan.actions = refinedPlan.actions
        .map(a => {
          if (a.type === 'transition') {
            return { ...a, params: { ...a.params, duration: (a.params.duration || 0.3) * 0.5 } };
          }
          return a;
        })
        .filter(a => !(a.type === 'effect' && !['cut', 'transition'].includes(a.type)));
    } else if (refinementIntent.pacing === 'decrease') {
      console.log('📉 Decreasing pacing: lengthening transitions and adding breathing room');
      refinedPlan.actions = refinedPlan.actions.map(a => {
        if (a.type === 'transition') {
          return { ...a, params: { ...a.params, duration: (a.params.duration || 0.3) * 1.5 } };
        }
        return a;
      });
    }

    if (refinementIntent.intensity === 'increase') {
      console.log('⚡ Increasing intensity: adding more effects and sharp transitions');
      refinedPlan.actions = refinedPlan.actions.map(a => {
        if (a.type === 'transition') {
          return { ...a, params: { ...a.params, style: ['cut', 'flash', 'wipe'][Math.floor(Math.random() * 3)] } };
        }
        return a;
      });
    } else if (refinementIntent.intensity === 'decrease') {
      console.log('🌿 Decreasing intensity: using soft transitions');
      refinedPlan.actions = refinedPlan.actions.map(a => {
        if (a.type === 'transition') {
          return { ...a, params: { ...a.params, style: ['fade', 'dissolve'][Math.floor(Math.random() * 2)] } };
        }
        return a;
      });
    }

    refinedPlan.metadata = {
      ...refinedPlan.metadata,
      refined_by: 'smart-heuristic',
      refined_at: new Date().toISOString(),
      refinement_instruction: instruction,
      refinement_intent: refinementIntent,
      before_stats: planStats,
      after_stats: analyzeCurrentPlan(refinedPlan),
    };

    const validation = validateEditPlan(refinedPlan);
    if (validation.valid) {
      console.log('✅ Heuristic refinement successful');
      return res.json({ plan: validation.data });
    }
  }

  // Generate new plan: try LLM first, then heuristic fallback
  console.log('🚀 Generating new plan...');
  
  // Build dynamic prompt using style guide and custom instructions
  const systemPrompt = `You are an expert video editor AI. Generate an EditPlan for video editing based on the clips provided.`;
  
  const styleGuides = {
    balanced: 'Generate a balanced mix of cuts, transitions, and effects. Maintain viewer engagement without overwhelming.',
    energetic: 'Generate high-energy editing with frequent cuts, sharp transitions, and dynamic effects. Keep viewers engaged.',
    cinematic: 'Generate cinematic editing with longer shots, smooth transitions, and meaningful effects. Prioritize storytelling.',
    minimal: 'Generate minimal, intentional editing. Use only necessary cuts, subtle transitions, and no unnecessary effects.',
    dynamic: 'Generate varied pacing throughout. Mix fast cuts with slower moments. Use effects strategically.',
  };

  const generationPrompt = `${systemPrompt}

Clips to edit:
${JSON.stringify(clips, null, 2)}

Style: ${style || 'balanced'}
Style Guide: ${styleGuides[style] || styleGuides.balanced}

Generate a valid EditPlan JSON object with this exact structure:
{
  "id": "plan-<uuid>",
  "clips": [<array of clips from input>],
  "actions": [
    { "id": "act-<uuid>", "type": "cut|transition|effect", "params": {...}, "start": <time>, "end": <time> },
    ...
  ],
  "metadata": { "generated_by": "llm-gpt-4o", "created_at": "<ISO timestamp>" }
}

Return ONLY the JSON object, no explanations or markdown code blocks.
`;

  const llmPlan = await callGitHubModel(generationPrompt);
  if (llmPlan) {
    const validation = validateEditPlan(llmPlan);
    if (validation.valid) {
      console.log('✅ LLM plan generated and validated');
      validation.data.metadata = { ...validation.data.metadata, generated_by: 'llm-gpt-4o' };
      return res.json({ plan: validation.data });
    } else {
      console.log('⚠️  LLM plan failed validation, attempting repair...');
      // Try to repair the plan
      llmPlan.id = llmPlan.id || makeId('plan');
      llmPlan.clips = Array.isArray(llmPlan.clips) ? llmPlan.clips : clips;
      llmPlan.actions = Array.isArray(llmPlan.actions) ? llmPlan.actions : [];
      const repairValidation = validateEditPlan(llmPlan);
      if (repairValidation.valid) {
        console.log('✅ LLM plan repaired and validated');
        repairValidation.data.metadata = { 
          generated_by: 'llm-gpt-4o-repaired', 
          created_at: new Date().toISOString() 
        };
        return res.json({ plan: repairValidation.data });
      }
    }
  }

  // Fallback to heuristic
  console.log('⚠️  LLM generation failed, using heuristic fallback');
  const heuristicPlan = createHeuristicEditPlan(clips, style || 'balanced');
  const validation = validateEditPlan(heuristicPlan);

  if (validation.valid) {
    console.log('✅ Heuristic plan generated and validated');
    return res.json({ plan: validation.data });
  }

  console.log('❌ All generation methods failed');
  return res.status(422).json({ error: 'generation_failed', details: 'Could not generate valid plan' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint to generate using custom prompt
app.post('/api/director/generate-custom', async (req, res) => {
  const { clips, customPrompt } = req.body;

  // Validate input
  if (!clips || !Array.isArray(clips)) {
    return res.status(400).json({ error: 'invalid_input', details: 'missing clips array' });
  }
  if (!customPrompt || typeof customPrompt !== 'string') {
    return res.status(400).json({ error: 'invalid_input', details: 'missing customPrompt string' });
  }

  console.log('\n📥 Custom generation request received');
  console.log(`📝 Prompt preview: ${customPrompt.substring(0, 100)}...`);

  const llmPlan = await callGitHubModel(customPrompt);
  if (llmPlan) {
    const validation = validateEditPlan(llmPlan);
    if (validation.valid) {
      console.log('✅ Custom LLM plan generated and validated');
      validation.data.metadata = { ...validation.data.metadata, generated_by: 'llm-gpt-4o-custom' };
      return res.json({ plan: validation.data });
    } else {
      console.log('⚠️  Custom LLM plan failed validation, attempting repair...');
      console.log(`   Validation error: ${validation.error}`);
      
      // Attempt repair: ensure all required fields exist
      const repairedPlan = {
        id: llmPlan.id || makeId('plan'),
        clips: Array.isArray(llmPlan.clips) ? llmPlan.clips : clips,
        actions: Array.isArray(llmPlan.actions) && llmPlan.actions.length > 0 
          ? llmPlan.actions 
          : createHeuristicEditPlan(clips).actions,
        metadata: llmPlan.metadata || {}
      };
      
      const repairValidation = validateEditPlan(repairedPlan);
      if (repairValidation.valid) {
        console.log('✅ Custom LLM plan repaired and validated');
        console.log(`   Generated ${repairedPlan.actions.length} actions via repair`);
        repairValidation.data.metadata = { 
          generated_by: 'llm-gpt-4o-custom-repaired', 
          created_at: new Date().toISOString() 
        };
        return res.json({ plan: repairValidation.data });
      }
    }
  }

  // Fallback: Use heuristic if LLM fails completely
  console.log('⚠️  LLM generation failed, using heuristic fallback...');
  const heuristicPlan = createHeuristicEditPlan(clips, 'balanced');
  const heuristicValidation = validateEditPlan(heuristicPlan);
  if (heuristicValidation.valid) {
    console.log('✅ Heuristic fallback plan generated');
    heuristicValidation.data.metadata = {
      generated_by: 'heuristic-fallback',
      created_at: new Date().toISOString()
    };
    return res.json({ plan: heuristicValidation.data });
  }

  console.log('❌ All generation methods failed');
  return res.status(422).json({ error: 'generation_failed', details: 'Could not generate valid plan with custom prompt' });
});

// 🔥 VIRAL MODE ENDPOINT - The algorithm that makes edits blow up
app.post('/api/director/generate-viral', async (req, res) => {
  const { clips, pattern = 'tiktok_hype', intent = {} } = req.body;

  // Validate input
  if (!clips || !Array.isArray(clips)) {
    return res.status(400).json({ error: 'invalid_input', details: 'missing clips array' });
  }

  console.log('\n🔥 VIRAL MODE REQUEST');
  console.log(`📊 Pattern: ${pattern}`);
  console.log(`📝 Total clips: ${clips.length}, Total duration: ${clips.reduce((s, c) => s + c.duration, 0)}s`);

  // Viral mode patterns
  const PATTERNS = {
    tiktok_hype: {
      name: 'TikTok Hype',
      description: 'Rapid hooks + rhythmic cuts = maximum retention',
      guidelines: [
        'Text hook in first 1.5s',
        'Fastest cuts 0-5s (≤1.5s each)',
        'Build with effects 5-12s',
        'Drop spam 12+ (beat synced)',
        'Loop-friendly outro',
        'Max cut length: 1.5s in hook',
        'Every beat gets a cut or zoom',
        'Text changes every 2s',
      ],
    },
    clean_aesthetic: {
      name: 'Clean Aesthetic',
      description: 'Slower, intentional cuts + smooth transitions',
      guidelines: [
        'Subtle hook with title 0-2s',
        'Controlled cuts 2-10s (≤2.5s each)',
        'Smooth build 10-20s',
        'Dramatic moment 20-25s',
        'Clean resolve',
        'Dissolve transitions preferred',
        'Color grade consistency',
        'Minimal text (2-3 total)',
      ],
    },
    beat_driven: {
      name: 'Beat Driven',
      description: 'Everything synced to beat = hypnotic',
      guidelines: [
        'Hook sync to first beat',
        'Cuts follow beat progression',
        'Build on drop preview',
        'Final drop = visual climax',
        'Align all cuts to beat grid (0.75s)',
        'Zoom on kick drum',
        'Snare hits = transitions',
        'Loop resolution',
      ],
    },
    story_driven: {
      name: 'Story Driven',
      description: 'Setup → conflict → resolution',
      guidelines: [
        'Hook establishes premise (2-3s)',
        'Build adds context',
        'Drop reveals twist/climax',
        'Outro resolves satisfyingly',
        'Pacing reflects emotional arc',
        'Cut length increases with intensity',
        'Text tells micro-story',
        'Ending is memorable',
      ],
    },
  };

  const selectedPattern = PATTERNS[pattern] || PATTERNS.tiktok_hype;

  // Build aggressive viral prompt
  const totalDuration = clips.reduce((s, c) => s + c.duration, 0);
  
  // Phase timing based on duration
  let phaseConfig;
  if (totalDuration < 35) {
    phaseConfig = [
      { type: 'hook', duration: 2 },
      { type: 'build', duration: 8 },
      { type: 'drop', duration: 15 },
      { type: 'outro', duration: Math.max(3, totalDuration - 25) },
    ];
  } else if (totalDuration < 55) {
    phaseConfig = [
      { type: 'hook', duration: 3 },
      { type: 'build', duration: 12 },
      { type: 'drop', duration: 25 },
      { type: 'outro', duration: Math.max(5, totalDuration - 40) },
    ];
  } else {
    phaseConfig = [
      { type: 'hook', duration: 4 },
      { type: 'build', duration: 20 },
      { type: 'drop', duration: 35 },
      { type: 'outro', duration: Math.max(8, totalDuration - 59) },
    ];
  }

  const viralPrompt = `🔥 YOU ARE GENERATING A VIRAL EDIT 🔥

This MUST follow the algorithm that makes edits blow up on TikTok/Shorts/Reels.

📊 STRUCTURE (this is sacred):
${phaseConfig.map((p, i) => `PHASE ${i + 1} - ${p.type.toUpperCase()} (${p.duration}s)`).join('\n')}

🎬 PATTERN: ${selectedPattern.name}
"${selectedPattern.description}"

Guidelines:
${selectedPattern.guidelines.map((g) => `• ${g}`).join('\n')}

⚙️ HARD CONSTRAINTS (NON-NEGOTIABLE):
• Hook cuts: ≤1.5s each
• Build cuts: 2-2.5s each
• Drop cuts: 1.5-2s each (fast pacing)
• Outro cuts: 2-3s each
• Maximum idle time: 1.5s anywhere
• Something visual changes EVERY 1.5s (cut, effect, zoom, text)

🎧 BEAT SYNC (this is the cheat code):
• Assume beat every 0.75s
• Align major cuts to beats (±0.2s tolerance)
• Transitions hit beat changes
• Zooms hit impact moments
• No off-beat cuts unless intentional

⚡ EFFECT RULES:
• Never stack > 2 effects at once
• Priority: zoom > motion-blur > glow > bloom > punch
• Zoom on drop = maximum impact
• Motion blur on fast transitions
• Every effect must serve a purpose
• Minimum duration: 0.3s
• Maximum duration: 2s

✍️ TEXT OVERLAY RULES:
• First text MUST appear within 1.5s
• Duration: 0.8-2.5s each
• Maximum 6-8 total text elements
• Create curiosity ("WAIT FOR THIS 😳", "HOLD UP")
• Or create hype ("LET'S GO", "THAT'S INSANE")
• Align text to beat boundaries when possible
• Text must be readable and impactful

📊 DOPAMINE HIT FREQUENCY:
Every 1-2 seconds, something must change:
☑ Cut to new clip
☑ Effect appears/changes
☑ Zoom/pan motion
☑ Text appears
☑ Transition style changes
☑ Color shift/grade change
☑ Sound effect hit

No dead air. No boring moments.

🧠 CREATIVE REASONING (include in metadata):
Tell me:
1. Why this pattern suits the clips
2. Where are the key impact moments?
3. What makes this loopable/shareable?
4. Why would people watch until the end?

📝 ACTION GENERATION SPECIFICS:

HOOK PHASE (${phaseConfig[0].duration}s):
- Abrupt start (no intro fade)
- Fastest cuts (≤1.5s)
- Text appears by 1.5s
- Motion already happening
- Curiosity hook OR hype

BUILD PHASE (${phaseConfig[1].duration}s):
- Gradually introduce effects
- Cut length: 2-2.5s
- Build momentum steadily
- Text reinforces story
- Introduce color grades

DROP PHASE (${phaseConfig[2].duration}s):
- THIS IS YOUR CLIMAX
- Fastest cuts again
- Maximum effects density
- Beat-synced everything
- Dramatic transitions
- Text emphasizes impact
- Visual crescendo

OUTRO PHASE (${phaseConfig[3].duration}s):
- Resolve or loop setup
- Slower cuts (2-3s)
- Minimal new effects
- Final impact text
- Must feel satisfying
- Loop-friendly if possible

📊 OUTPUT REQUIREMENTS:
- Return ONLY valid JSON
- id, clips, actions, metadata
- actions MUST be 50+ for 45-60s video
- MUST include phases breakdown
- MUST include creative_intent field
- MUST have creative_reasoning in metadata
- All timings respect phase boundaries
- Every action must serve a purpose
- Include estimated viral_factor (1-10)

START WITH {, END WITH }
NO MARKDOWN, NO EXPLANATIONS
JSON ONLY`;

  console.log('🚀 Calling LLM with viral mode parameters...');
  const llmPlan = await callGitHubModel(viralPrompt);

  if (llmPlan) {
    const validation = validateEditPlan(llmPlan);
    if (validation.valid) {
      console.log('✅ Viral edit plan generated!');
      validation.data.metadata = {
        ...validation.data.metadata,
        generated_by: 'llm-gpt-4o-viral',
        mode: 'viral',
        pattern: pattern,
        viral_factor: llmPlan.metadata?.viral_factor || 7,
      };
      return res.json({ plan: validation.data });
    }
  }

  // Fallback to heuristic with viral characteristics
  console.log('⚠️  LLM failed, using viral heuristic fallback...');
  const viralHeuristicPlan = createViralEditPlan(clips, selectedPattern.name);
  const heuristicValidation = validateEditPlan(viralHeuristicPlan);
  
  if (heuristicValidation.valid) {
    console.log('✅ Viral heuristic plan generated');
    heuristicValidation.data.metadata = {
      generated_by: 'heuristic-viral',
      mode: 'viral',
      pattern: pattern,
      viral_factor: 6,
    };
    return res.json({ plan: heuristicValidation.data });
  }

  console.log('❌ Viral generation failed');
  return res.status(422).json({ error: 'generation_failed', details: 'Could not generate viral plan' });
});

// Helper function to create viral edit plan (heuristic)
function createViralEditPlan(clips, pattern = 'tiktok_hype') {
  const id = makeId('plan');
  const planClips = (clips || []).map((c, i) => ({
    id: c.id ?? makeId('clip'),
    filename: c.filename ?? `clip-${i}.mp4`,
    duration: typeof c.duration === 'number' ? c.duration : 1,
    start: typeof c.start === 'number' ? c.start : 0,
  }));

  const totalDuration = planClips.reduce((s, c) => s + c.duration, 0);
  const actions = [];
  let globalTime = 0;

  // Phase timing
  const phases = totalDuration < 35
    ? [
        { type: 'hook', start: 0, end: 2 },
        { type: 'build', start: 2, end: 10 },
        { type: 'drop', start: 10, end: 25 },
        { type: 'outro', start: 25, end: totalDuration },
      ]
    : totalDuration < 55
    ? [
        { type: 'hook', start: 0, end: 3 },
        { type: 'build', start: 3, end: 15 },
        { type: 'drop', start: 15, end: 40 },
        { type: 'outro', start: 40, end: totalDuration },
      ]
    : [
        { type: 'hook', start: 0, end: 4 },
        { type: 'build', start: 4, end: 24 },
        { type: 'drop', start: 24, end: 59 },
        { type: 'outro', start: 59, end: totalDuration },
      ];

  // Generate cuts with beat-sync assumption
  const beatInterval = 0.75;
  for (let clipIdx = 0; clipIdx < planClips.length; clipIdx++) {
    const clip = planClips[clipIdx];
    const currentPhase = phases.find(p => globalTime >= p.start && globalTime < p.end);
    const phaseType = currentPhase?.type || 'build';

    // Determine cut count based on phase
    let cutCount;
    if (phaseType === 'hook') {
      cutCount = Math.max(2, Math.ceil(clip.duration / 1.5));
    } else if (phaseType === 'drop') {
      cutCount = Math.max(3, Math.ceil(clip.duration / 2));
    } else {
      cutCount = Math.max(2, Math.ceil(clip.duration / 2.5));
    }

    const segmentDuration = clip.duration / cutCount;

    for (let i = 0; i < cutCount; i++) {
      const segStart = i * segmentDuration;
      const segEnd = Math.min(clip.duration, (i + 1) * segmentDuration);
      const segDuration = segEnd - segStart;

      // Align to beat
      const alignedStart = Math.round(globalTime / beatInterval) * beatInterval;
      const alignedEnd = alignedStart + segDuration;

      // Cut action
      actions.push({
        id: makeId('act'),
        type: 'cut',
        params: {
          clipId: clip.id,
          trim_start: segStart,
          trim_end: segEnd,
          intensity: phaseType === 'hook' ? 'fast' : phaseType === 'drop' ? 'fastest' : 'normal',
        },
        start: alignedStart,
        end: alignedEnd,
      });

      // Add zoom on beat
      if (Math.random() > 0.4 && phaseType === 'drop') {
        actions.push({
          id: makeId('act'),
          type: 'effect',
          params: { name: 'zoom', intensity: 'high', duration: 0.4 },
          start: alignedStart + 0.1,
          end: alignedStart + 0.5,
        });
      }

      // Text near start of phase
      if (i === 0 && phaseType === 'hook') {
        const texts = ['WAIT FOR THIS', 'HOLD UP', 'YOU WONT BELIEVE', 'LETS GO', 'THIS IS INSANE'];
        actions.push({
          id: makeId('act'),
          type: 'text',
          params: {
            content: texts[Math.floor(Math.random() * texts.length)],
            duration: 1.5,
            position: 'center',
            style: 'bold-white',
          },
          start: alignedStart + 0.2,
          end: alignedStart + 1.7,
        });
      }

      globalTime = alignedEnd;
    }

    // Transition between clips
    if (clipIdx < planClips.length - 1) {
      const transitionStart = globalTime - beatInterval * 0.5;
      const transitionEnd = globalTime + beatInterval * 0.5;
      
      actions.push({
        id: makeId('act'),
        type: 'transition',
        params: {
          style: phaseType === 'drop' ? 'cut' : 'dissolve',
          duration: beatInterval,
        },
        start: transitionStart,
        end: transitionEnd,
      });
    }
  }

  // Add color grades
  actions.unshift({
    id: makeId('act'),
    type: 'color',
    params: { grade: 'vibrant', intensity: 0.8 },
    start: 0,
    end: Math.min(15, totalDuration),
  });

  return {
    id,
    clips: planClips,
    actions,
    phases,
    metadata: {
      generated_by: 'heuristic-viral',
      created_at: new Date().toISOString(),
      pattern,
      total_duration: totalDuration,
      action_count: actions.length,
      estimated_viral_factor: 6,
    },
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎬 AI Director Server running on http://localhost:${PORT}\n`);
  console.log('Endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/director/generate`);
  console.log(`  POST http://localhost:${PORT}/api/director/generate-custom`);
  console.log(`  POST http://localhost:${PORT}/api/director/generate-viral`);
  console.log(`  GET  http://localhost:${PORT}/health\n`);
});
