/**
 * AI Director Service
 * Handles communication with AI Director backend API
 * Manages plan generation, refinement, and validation
 */

import type {
  EditPlan,
  GenerationResponse,
  RefinementResponse,
  VideoClip,
  StyleMode,
} from '../types/ai-director.types';

const API_BASE = import.meta.env.VITE_AI_DIRECTOR_API || 'http://localhost:3000';
const API_ENDPOINT = `${API_BASE}/api/director`;

/**
 * Generate an edit plan from clips using specified mode
 */
export async function generateEditPlan(
  clips: VideoClip[],
  mode: 'style' | 'custom' | 'viral' = 'custom',
  options?: {
    customPrompt?: string;
    pattern?: string;
    constraints?: any;
  }
): Promise<EditPlan> {
  if (!clips || clips.length === 0) {
    throw new Error('At least one clip is required');
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/generate-custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clips,
        customPrompt: options?.customPrompt || `Generate a ${mode} style edit`,
        constraintOverrides: options?.constraints,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || `Generation failed with status ${response.status}`);
    }

    const data: GenerationResponse = await response.json();
    return data.plan;
  } catch (error) {
    console.error('AI Director generation error:', error);
    throw error;
  }
}

/**
 * Generate an edit plan using viral mode
 */
export async function generateViralPlan(
  clips: VideoClip[],
  pattern: 'tiktok_hype' | 'clean_aesthetic' | 'beat_driven' | 'story_driven' = 'tiktok_hype',
  intent?: Partial<any>
): Promise<EditPlan> {
  if (!clips || clips.length === 0) {
    throw new Error('At least one clip is required');
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/generate-viral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clips,
        pattern,
        intent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || `Viral generation failed with status ${response.status}`);
    }

    const data: GenerationResponse = await response.json();
    return data.plan;
  } catch (error) {
    console.error('AI Director viral generation error:', error);
    throw error;
  }
}

/**
 * Generate an edit plan using style presets
 */
export async function generateStylePlan(
  clips: VideoClip[],
  style: StyleMode = 'balanced'
): Promise<EditPlan> {
  const stylePrompts: Record<StyleMode, string> = {
    balanced: 'Create a balanced edit with mixed cuts and transitions that flow naturally.',
    energetic: 'Create a fast-paced, high-energy edit with quick cuts and dynamic transitions.',
    cinematic: 'Create a cinematic, slow-paced edit with longer shots and smooth transitions.',
    minimal: 'Create a minimal edit with only essential cuts.',
    dynamic: 'Create a dynamic edit with varied pacing and interesting transitions.',
  };

  return generateEditPlan(clips, 'custom', {
    customPrompt: stylePrompts[style],
  });
}

/**
 * Refine an existing plan with instructions
 */
export async function refinePlan(
  plan: EditPlan,
  clips: VideoClip[],
  instruction: string
): Promise<EditPlan> {
  try {
    const response = await fetch(`${API_ENDPOINT}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clips,
        action: 'refine',
        plan,
        instruction,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || `Refinement failed with status ${response.status}`);
    }

    const data: RefinementResponse = await response.json();
    return data.plan;
  } catch (error) {
    console.error('AI Director refinement error:', error);
    throw error;
  }
}

/**
 * Validate a plan structure
 */
export function validatePlan(plan: EditPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!plan.id) errors.push('Plan must have an id');
  if (!Array.isArray(plan.clips)) errors.push('Plan must have clips array');
  if (!Array.isArray(plan.actions)) errors.push('Plan must have actions array');
  if (!plan.metadata) errors.push('Plan must have metadata');

  if (plan.clips.length === 0) errors.push('Plan must have at least one clip');
  if (plan.actions.length === 0) errors.push('Plan must have at least one action');

  // Validate each action
  plan.actions.forEach((action, idx) => {
    if (!action.id) errors.push(`Action ${idx} missing id`);
    if (!action.type) errors.push(`Action ${idx} missing type`);
    if (typeof action.start !== 'number') errors.push(`Action ${idx} missing valid start time`);
    if (typeof action.end !== 'number') errors.push(`Action ${idx} missing valid end time`);
    if (action.start >= action.end) errors.push(`Action ${idx} has invalid timing (start >= end)`);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export plan to JSON
 */
export function exportPlanAsJSON(plan: EditPlan): string {
  return JSON.stringify(plan, null, 2);
}

/**
 * Export plan to DaVinci XML (basic)
 */
export function exportPlanAsDaVinciXML(plan: EditPlan): string {
  // Basic XML export for DaVinci
  // This would be expanded with full timeline XML structure
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const project = `<Project>\n`;
  const metadata = `  <Metadata>\n    <Duration>${plan.metadata.total_duration}</Duration>\n    <ActionCount>${plan.actions.length}</ActionCount>\n  </Metadata>\n`;

  let timeline = '  <Timeline>\n';
  plan.actions.forEach((action) => {
    timeline += `    <Action type="${action.type}" start="${action.start}" end="${action.end}" />\n`;
  });
  timeline += '  </Timeline>\n';

  const close = '</Project>';

  return xmlHeader + project + metadata + timeline + close;
}

/**
 * Import plan from JSON
 */
export function importPlanFromJSON(jsonString: string): EditPlan {
  try {
    const plan = JSON.parse(jsonString);
    const validation = validatePlan(plan);
    if (!validation.valid) {
      throw new Error(`Invalid plan: ${validation.errors.join(', ')}`);
    }
    return plan;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

/**
 * Get estimated generation time
 */
export function getEstimatedGenerationTime(clipCount: number): number {
  // 2-3 seconds base + 1 second per clip for LLM processing
  return 2000 + clipCount * 1000;
}

/**
 * Health check
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get supported generation modes
 */
export function getSupportedModes() {
  return {
    styles: ['balanced', 'energetic', 'cinematic', 'minimal', 'dynamic'] as const,
    viralPatterns: [
      'tiktok_hype',
      'clean_aesthetic',
      'beat_driven',
      'story_driven',
    ] as const,
    constraintProfiles: [
      'aggressive',
      'balanced',
      'cinematic',
      'minimal',
      'music_driven',
    ] as const,
  };
}
