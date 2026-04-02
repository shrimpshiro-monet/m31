/**
 * VIRAL EDIT MODE - DYNAMIC CONSTRAINTS SYSTEM
 * 
 * This is the real algorithm. Not theoretical—based on what actually
 * makes edits go viral across TikTok/Shorts/Reels.
 * 
 * The 5 pillars:
 * 1. Instant hook (0-2s)
 * 2. Fast pacing (controlled chaos)
 * 3. Beat sync (the cheat code)
 * 4. Micro dopamine hits every 1-2s
 * 5. Payoff / loopability
 * 
 * DYNAMIC: These constraints are templates that adjust based on user intent
 */

// 🎯 CONSTRAINT PRESET PROFILES
export interface ConstraintProfile {
  name: string;
  description: string;
  pacing: {
    maxCutLength: number;
    introCutMax: number;
    maxIdleSegment: number;
    minChangeFrequency: number;
  };
  beatSync: {
    beatInterval: number;
    cutAlignTolerance: number;
    transitionOnBeat: boolean;
    zoomOnKick: boolean;
  };
  effects: {
    maxConcurrent: number;
    priorityOrder: string[];
    minEffectDuration: number;
    maxEffectDuration: number;
    targetEffectDensity: 'low' | 'medium' | 'high';
  };
  text: {
    firstTextBefore: number;
    maxDuration: number;
    minDuration: number;
    mustCreateCuriosityOrHype: boolean;
    totalTextElements: number;
  };
  phases: {
    minPhases: number;
    types: Array<'hook' | 'build' | 'drop' | 'outro'>;
  };
}

// ⚙️ BUILT-IN CONSTRAINT PROFILES
export const CONSTRAINT_PROFILES: Record<string, ConstraintProfile> = {
  // Maximum retention - TikTok style
  aggressive: {
    name: 'Aggressive (TikTok)',
    description: 'Maximum dopamine hits, fastest pacing possible',
    pacing: {
      maxCutLength: 2,        // Super fast
      introCutMax: 1,         // Hook cuts ≤ 1s
      maxIdleSegment: 1.5,    // Almost no dead air
      minChangeFrequency: 1,  // Something every 1s
    },
    beatSync: {
      beatInterval: 0.5,      // Assume faster beat
      cutAlignTolerance: 0.15,
      transitionOnBeat: true,
      zoomOnKick: true,
    },
    effects: {
      maxConcurrent: 2,
      priorityOrder: ['zoom', 'punch', 'beat-sync', 'glow', 'motion-blur'],
      minEffectDuration: 0.2,
      maxEffectDuration: 1.5,
      targetEffectDensity: 'high',
    },
    text: {
      firstTextBefore: 1.5,
      maxDuration: 2,
      minDuration: 0.6,
      mustCreateCuriosityOrHype: true,
      totalTextElements: 8,
    },
    phases: {
      minPhases: 4,
      types: ['hook', 'build', 'drop', 'outro'],
    },
  },

  // Balanced - works for most content
  balanced: {
    name: 'Balanced',
    description: 'Good pacing with intentional moments',
    pacing: {
      maxCutLength: 2.5,
      introCutMax: 1.5,
      maxIdleSegment: 2,
      minChangeFrequency: 1.5,
    },
    beatSync: {
      beatInterval: 0.75,
      cutAlignTolerance: 0.2,
      transitionOnBeat: true,
      zoomOnKick: true,
    },
    effects: {
      maxConcurrent: 2,
      priorityOrder: ['zoom', 'motion-blur', 'glow', 'bloom', 'punch'],
      minEffectDuration: 0.3,
      maxEffectDuration: 2,
      targetEffectDensity: 'medium',
    },
    text: {
      firstTextBefore: 2,
      maxDuration: 2.5,
      minDuration: 0.8,
      mustCreateCuriosityOrHype: true,
      totalTextElements: 6,
    },
    phases: {
      minPhases: 4,
      types: ['hook', 'build', 'drop', 'outro'],
    },
  },

  // Cinematic - slow, intentional, story-driven
  cinematic: {
    name: 'Cinematic',
    description: 'Longer shots, smooth transitions, story focus',
    pacing: {
      maxCutLength: 4,
      introCutMax: 2,
      maxIdleSegment: 3,
      minChangeFrequency: 2.5,
    },
    beatSync: {
      beatInterval: 1,
      cutAlignTolerance: 0.3,
      transitionOnBeat: false,  // Not strict about beats
      zoomOnKick: false,
    },
    effects: {
      maxConcurrent: 1,
      priorityOrder: ['dissolve', 'fade', 'vignette', 'lens-flare'],
      minEffectDuration: 0.5,
      maxEffectDuration: 3,
      targetEffectDensity: 'low',
    },
    text: {
      firstTextBefore: 3,
      maxDuration: 3,
      minDuration: 1,
      mustCreateCuriosityOrHype: false,
      totalTextElements: 3,
    },
    phases: {
      minPhases: 3,
      types: ['hook', 'build', 'outro'],
    },
  },

  // Minimal - just the essentials
  minimal: {
    name: 'Minimal',
    description: 'Clean, essential cuts only, focus on content',
    pacing: {
      maxCutLength: 3.5,
      introCutMax: 2.5,
      maxIdleSegment: 2.5,
      minChangeFrequency: 2,
    },
    beatSync: {
      beatInterval: 1,
      cutAlignTolerance: 0.4,
      transitionOnBeat: false,
      zoomOnKick: false,
    },
    effects: {
      maxConcurrent: 1,
      priorityOrder: ['fade', 'dissolve'],
      minEffectDuration: 0.4,
      maxEffectDuration: 2,
      targetEffectDensity: 'low',
    },
    text: {
      firstTextBefore: 2.5,
      maxDuration: 2,
      minDuration: 1,
      mustCreateCuriosityOrHype: false,
      totalTextElements: 2,
    },
    phases: {
      minPhases: 2,
      types: ['hook', 'outro'],
    },
  },

  // Music-focused - beat synced everything
  music_driven: {
    name: 'Music Driven',
    description: 'Synced to beat, dance/music videos',
    pacing: {
      maxCutLength: 2,
      introCutMax: 1.5,
      maxIdleSegment: 1,
      minChangeFrequency: 1.2,
    },
    beatSync: {
      beatInterval: 0.5,      // Strict beat alignment
      cutAlignTolerance: 0.1,
      transitionOnBeat: true, // EVERYTHING hits beat
      zoomOnKick: true,
    },
    effects: {
      maxConcurrent: 2,
      priorityOrder: ['beat-sync', 'zoom', 'punch', 'glow', 'flash'],
      minEffectDuration: 0.25,
      maxEffectDuration: 1,
      targetEffectDensity: 'high',
    },
    text: {
      firstTextBefore: 1,
      maxDuration: 1.5,
      minDuration: 0.5,
      mustCreateCuriosityOrHype: true,
      totalTextElements: 5,
    },
    phases: {
      minPhases: 3,
      types: ['hook', 'build', 'drop'],
    },
  },
};

// 🧠 INFER CONSTRAINTS FROM CUSTOM PROMPT
export function inferConstraintsFromPrompt(customPrompt: string): ConstraintProfile {
  const prompt = customPrompt.toLowerCase();

  // Keywords that suggest different approaches
  if (
    prompt.includes('fast') ||
    prompt.includes('rapid') ||
    prompt.includes('quick') ||
    prompt.includes('aggressive') ||
    prompt.includes('hype')
  ) {
    return CONSTRAINT_PROFILES.aggressive;
  }

  if (
    prompt.includes('cinematic') ||
    prompt.includes('slow') ||
    prompt.includes('smooth') ||
    prompt.includes('story')
  ) {
    return CONSTRAINT_PROFILES.cinematic;
  }

  if (
    prompt.includes('minimal') ||
    prompt.includes('clean') ||
    prompt.includes('simple') ||
    prompt.includes('essential')
  ) {
    return CONSTRAINT_PROFILES.minimal;
  }

  if (
    prompt.includes('music') ||
    prompt.includes('beat') ||
    prompt.includes('sync') ||
    prompt.includes('dance') ||
    prompt.includes('rhythm')
  ) {
    return CONSTRAINT_PROFILES.music_driven;
  }

  // Default to balanced if unclear
  return CONSTRAINT_PROFILES.balanced;
}

// ✏️ MERGE CONSTRAINTS (allows partial overrides)
export function mergeConstraints(
  baseProfile: ConstraintProfile,
  overrides?: Partial<ConstraintProfile>
): ConstraintProfile {
  if (!overrides) return baseProfile;

  return {
    name: overrides.name || baseProfile.name,
    description: overrides.description || baseProfile.description,
    pacing: { ...baseProfile.pacing, ...(overrides.pacing || {}) },
    beatSync: { ...baseProfile.beatSync, ...(overrides.beatSync || {}) },
    effects: { ...baseProfile.effects, ...(overrides.effects || {}) },
    text: { ...baseProfile.text, ...(overrides.text || {}) },
    phases: { ...baseProfile.phases, ...(overrides.phases || {}) },
  };
}

// 🎯 GET ACTIVE CONSTRAINTS (main entry point)
export function getActiveConstraints(
  mode?: 'aggressive' | 'balanced' | 'cinematic' | 'minimal' | 'music_driven',
  customPrompt?: string,
  overrides?: Partial<ConstraintProfile>
): ConstraintProfile {
  let baseProfile: ConstraintProfile;

  // If custom prompt provided, infer from it
  if (customPrompt) {
    baseProfile = inferConstraintsFromPrompt(customPrompt);
  } else if (mode && mode in CONSTRAINT_PROFILES) {
    baseProfile = CONSTRAINT_PROFILES[mode as keyof typeof CONSTRAINT_PROFILES];
  } else {
    baseProfile = CONSTRAINT_PROFILES.balanced;
  }

  // Apply any explicit overrides
  return mergeConstraints(baseProfile, overrides);
}

// Export for convenience
export const VIRAL_CONSTRAINTS = CONSTRAINT_PROFILES.balanced;

// 🎬 PHASE DEFINITIONS (structure = everything)
export interface Phase {
  type: 'hook' | 'build' | 'drop' | 'outro';
  duration: number;
  characteristics: {
    cutSpeed: 'fastest' | 'fast' | 'moderate' | 'slow';
    effectDensity: 'high' | 'medium' | 'low';
    textPriority: 'high' | 'medium' | 'low';
    transitionStyle: string[];
    targetMomentum: 'hook' | 'build' | 'climax' | 'resolve';
  };
}

export const PHASE_SPECS: Record<Phase['type'], Phase['characteristics']> = {
  hook: {
    cutSpeed: 'fastest',
    effectDensity: 'high',
    textPriority: 'high',
    transitionStyle: ['cut', 'zoom', 'wipe'],
    targetMomentum: 'hook',
  },
  build: {
    cutSpeed: 'fast',
    effectDensity: 'medium',
    textPriority: 'medium',
    transitionStyle: ['dissolve', 'zoom', 'slide'],
    targetMomentum: 'build',
  },
  drop: {
    cutSpeed: 'fastest',
    effectDensity: 'high',
    textPriority: 'high',
    transitionStyle: ['cut', 'beat-sync', 'zoom'],
    targetMomentum: 'climax',
  },
  outro: {
    cutSpeed: 'moderate',
    effectDensity: 'low',
    textPriority: 'high',
    transitionStyle: ['fade', 'dissolve'],
    targetMomentum: 'resolve',
  },
};

// 📐 PHASE TIMING TEMPLATES
export const PHASE_TIMING = {
  // 30 second video
  short: [
    { type: 'hook' as const, duration: 2 },
    { type: 'build' as const, duration: 8 },
    { type: 'drop' as const, duration: 15 },
    { type: 'outro' as const, duration: 5 },
  ],
  // 45-60 second video
  medium: [
    { type: 'hook' as const, duration: 3 },
    { type: 'build' as const, duration: 12 },
    { type: 'drop' as const, duration: 25 },
    { type: 'outro' as const, duration: 5 },
  ],
  // 60+ second video
  long: [
    { type: 'hook' as const, duration: 4 },
    { type: 'build' as const, duration: 20 },
    { type: 'drop' as const, duration: 35 },
    { type: 'outro' as const, duration: 8 },
  ],
};

// 🧩 PATTERN TEMPLATES (winning formulas)
export interface EditPattern {
  name: string;
  description: string;
  hooks: string[];
  ratios: {
    hook: number;
    build: number;
    drop: number;
    outro: number;
  };
  guidelines: string[];
}

export const PATTERN_TEMPLATES: Record<string, EditPattern> = {
  // TikTok / YouTube Shorts style
  tiktok_hype: {
    name: 'TikTok Hype',
    description: 'Rapid hooks + rhythmic cuts = maximum retention',
    hooks: [
      'Text hook in first 1.5s',
      'Fastest cuts 0-5s',
      'Build with effects 5-12s',
      'Drop spam 12-20s',
      'Loop-friendly outro',
    ],
    ratios: {
      hook: 0.08,
      build: 0.25,
      drop: 0.50,
      outro: 0.17,
    },
    guidelines: [
      'Max cut length: 1.5s in hook',
      'Every beat gets a cut or zoom',
      'Text changes every 2s',
      'End must loop back to start',
    ],
  },

  // Instagram Reels / clean aesthetic
  clean_aesthetic: {
    name: 'Clean Aesthetic',
    description: 'Slower, intentional cuts + smooth transitions',
    hooks: [
      'Subtle hook with title 0-2s',
      'Controlled cuts 2-10s',
      'Smooth build 10-20s',
      'Dramatic moment 20-25s',
      'Clean resolve',
    ],
    ratios: {
      hook: 0.10,
      build: 0.35,
      drop: 0.35,
      outro: 0.20,
    },
    guidelines: [
      'Max cut length: 2.5s throughout',
      'Dissolve transitions preferred',
      'Color grade consistency',
      'Minimal text',
    ],
  },

  // Beat-driven (music/dance)
  beat_driven: {
    name: 'Beat Driven',
    description: 'Everything synced to beat = hypnotic',
    hooks: [
      'Hook sync to first beat',
      'Cuts follow beat progression',
      'Build on drop preview',
      'Final drop = visual climax',
      'Loop resolution',
    ],
    ratios: {
      hook: 0.05,
      build: 0.20,
      drop: 0.60,
      outro: 0.15,
    },
    guidelines: [
      'Align all cuts to beat grid',
      'Zoom on kick drum',
      'Snare hits = transitions',
      'No off-beat cuts',
    ],
  },

  // Story / narrative
  story_driven: {
    name: 'Story Driven',
    description: 'Setup → conflict → resolution',
    hooks: [
      'Hook establishes premise',
      'Build adds context',
      'Drop reveals twist/climax',
      'Outro resolves satisfyingly',
    ],
    ratios: {
      hook: 0.10,
      build: 0.40,
      drop: 0.35,
      outro: 0.15,
    },
    guidelines: [
      'Pacing reflects emotional arc',
      'Cut length increases with intensity',
      'Text tells micro-story',
      'Ending is memorable',
    ],
  },
};

// 🧠 CREATIVE INTENT (reasoning layer)
export interface CreativeIntent {
  goal:
    | 'maximize_retention'
    | 'maximize_shares'
    | 'tell_story'
    | 'showcase_skill'
    | 'emotional_impact';
  strategy: string;
  highlight_moments: Array<{
    time: number;
    type: 'hook' | 'climax' | 'twist' | 'resolution';
    action: string;
  }>;
  expectedViralFactor: number; // 1-10
  reasoning: string;
}

// 📊 BEAT SYNC CALCULATION
export function calculateBeatAlignedTime(
  baseTime: number,
  beatInterval: number = 0.75
): number {
  const beatNumber = Math.round(baseTime / beatInterval);
  return beatNumber * beatInterval;
}

// 🎬 GENERATE PHASE TIMING
export function generatePhaseTimings(totalDuration: number): Array<{
  type: Phase['type'];
  duration: number;
  startTime: number;
  endTime: number;
}> {
  let timing: typeof PHASE_TIMING.short;

  if (totalDuration < 35) {
    timing = PHASE_TIMING.short;
  } else if (totalDuration < 55) {
    timing = PHASE_TIMING.medium;
  } else {
    timing = PHASE_TIMING.long;
  }

  let currentTime = 0;
  return timing.map((phase) => {
    const scaled = (phase.duration / timing.reduce((sum, p) => sum + p.duration, 0)) * totalDuration;
    const result = {
      ...phase,
      duration: scaled,
      startTime: currentTime,
      endTime: currentTime + scaled,
    };
    currentTime += scaled;
    return result;
  });
}

// ✍️ BUILD VIRAL PROMPT
export function buildViralEditPrompt(
  clips: Array<{ filename: string; duration: number }>,
  pattern: EditPattern,
  intent: Partial<CreativeIntent> = {}
): string {
  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
  const phases = generatePhaseTimings(totalDuration);

  return `You are generating a VIRAL video edit. This MUST follow the algorithm that makes edits blow up.

📊 STRUCTURE (non-negotiable)
${phases
  .map(
    (p) =>
      `${p.type.toUpperCase()} (${p.startTime.toFixed(1)}s - ${p.endTime.toFixed(1)}s, ${p.duration.toFixed(1)}s)`
  )
  .join('\n')}

🎬 PATTERN: ${pattern.name}
${pattern.guidelines.map((g) => `  • ${g}`).join('\n')}

⚙️ HARD CONSTRAINTS (ENFORCE THESE):
${Object.entries(VIRAL_CONSTRAINTS.pacing)
  .map(([k, v]) => `  • ${k}: ${v}`)
  .join('\n')}

🧠 CREATIVE INTENT:
Goal: ${intent.goal || 'maximize_retention'}
Strategy: ${intent.strategy || pattern.description}

🔊 BEAT SYNC ASSUMPTION:
• Assume beat every 0.75s
• Align cuts to beats (±0.2s tolerance)
• Transitions hit beat changes
• Zooms hit impact moments

⚡ PACING RULES PER PHASE:
${phases
  .map((p) => {
    const spec = PHASE_SPECS[p.type];
    return `${p.type}: cuts=${spec.cutSpeed}, effects=${spec.effectDensity}, text=${spec.textPriority}`;
  })
  .join('\n')}

📝 ACTION GENERATION RULES:
1. HOOK (${phases[0].duration.toFixed(1)}s):
   - Fastest cuts (≤1.5s each)
   - Text appears within 1.5s
   - Immediate visual motion
   - Create curiosity OR hype

2. BUILD (${phases[1].duration.toFixed(1)}s):
   - Fast cuts (2-2.5s each)
   - Introduce effects gradually
   - Build momentum
   - Text reinforces hooks

3. DROP (${phases[2].duration.toFixed(1)}s):
   - Fastest cuts again
   - Maximum effect density
   - Beat-synced everything
   - Climactic transitions
   - This is your PAYOFF

4. OUTRO (${phases[3].duration.toFixed(1)}s):
   - Clean resolution or loop setup
   - Slower cuts (2-3s)
   - Minimal effects
   - Final impact text
   - Must feel satisfying

🎨 EFFECT RULES:
• Never stack > 2 effects at once
• Priority: zoom > motion-blur > glow > bloom > punch
• Every effect must serve a purpose
• Align major effects to beat impacts

✍️ TEXT RULES:
• First text within 2s
• Max 2.5s duration each
• Appear at beat boundaries when possible
• Create curiosity: "WAIT FOR THIS", "HOLD UP"
• Or hype: "LET'S GO", "THAT'S CRAZY"

🧪 DOPAMINE HIT RULE:
Something must change every 1.5s maximum:
• Cut
• Effect pop
• Text appears/changes
• Transition
• Zoom
• Color shift

📊 OUTPUT REQUIREMENTS:
Return ONLY valid JSON with:
- id, clips, actions, metadata
- actions MUST be 40+ for 45-60s video
- phases field showing phase breakdown
- creative_intent explaining choices
- All timing must respect phase boundaries
- No action can exceed its phase duration

Start with {, end with }. No markdown. JSON only.`;
}

// 🎯 EXPORT EVERYTHING
export default {
  VIRAL_CONSTRAINTS,
  PHASE_SPECS,
  PHASE_TIMING,
  PATTERN_TEMPLATES,
  calculateBeatAlignedTime,
  generatePhaseTimings,
  buildViralEditPrompt,
};
