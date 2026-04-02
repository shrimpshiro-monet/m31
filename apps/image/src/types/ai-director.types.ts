/**
 * AI Director Type Definitions
 * Core types for EditPlan, Actions, Constraints, and Modes
 */

export type EditActionType = 
  | 'cut'
  | 'transition'
  | 'effect'
  | 'color'
  | 'audio'
  | 'text'
  | 'speed'
  | 'layer';

export type GenerationMode = 'style' | 'custom' | 'viral';

export type StyleMode = 'balanced' | 'energetic' | 'cinematic' | 'minimal' | 'dynamic';

export type ConstraintMode = 
  | 'aggressive' 
  | 'balanced' 
  | 'cinematic' 
  | 'minimal' 
  | 'music_driven';

/**
 * Video Clip
 */
export interface VideoClip {
  id: string;
  filename: string;
  duration: number;
  start?: number;
  end?: number;
  mimeType?: string;
}

/**
 * Single Edit Action
 */
export interface EditAction {
  id: string;
  type: EditActionType;
  start: number;        // Timeline start in seconds
  end: number;          // Timeline end in seconds
  params: Record<string, any>;
  metadata?: {
    intensity?: 'low' | 'medium' | 'high';
    easing?: string;
    [key: string]: any;
  };
}

/**
 * Edit Plan - Complete editing specification
 */
export interface EditPlan {
  id: string;
  clips: VideoClip[];
  actions: EditAction[];
  phases?: Phase[];
  metadata: EditPlanMetadata;
}

export interface Phase {
  type: 'hook' | 'build' | 'drop' | 'outro';
  start: number;
  end: number;
  duration: number;
}

export interface EditPlanMetadata {
  generated_by: string;
  created_at: string;
  mode?: GenerationMode;
  style?: StyleMode;
  pattern?: string;
  total_duration: number;
  action_count?: number;
  viral_factor?: number;
  constraint_profile?: ConstraintMode;
  before_stats?: EditStats;
  after_stats?: EditStats;
  [key: string]: any;
}

/**
 * Edit Statistics
 */
export interface EditStats {
  totalActions: number;
  cutCount: number;
  transitionCount: number;
  effectCount: number;
  avgCutDuration: number;
  pacing: 'slow' | 'moderate' | 'fast' | 'extreme';
  colorGradeCount?: number;
  audioEffectCount?: number;
  textCount?: number;
}

/**
 * Generation Request
 */
export interface GenerationRequest {
  clips: VideoClip[];
  mode?: GenerationMode;
  style?: StyleMode;
  customPrompt?: string;
  pattern?: string;
  constraintOverrides?: Partial<ConstraintProfile>;
}

/**
 * Generation Response
 */
export interface GenerationResponse {
  plan: EditPlan;
  metrics?: {
    generationTime: number;
    estimatedQuality: number;
    confidence: number;
  };
}

/**
 * Constraint Profile
 */
export interface ConstraintProfile {
  name: string;
  description: string;
  pacing: PacingConstraints;
  beatSync: BeatSyncConstraints;
  effects: EffectConstraints;
  text: TextConstraints;
  phases: PhaseConstraints;
}

export interface PacingConstraints {
  maxCutLength: number;
  introCutMax: number;
  maxIdleSegment: number;
  minChangeFrequency: number;
}

export interface BeatSyncConstraints {
  beatInterval: number;
  cutAlignTolerance: number;
  transitionOnBeat: boolean;
  zoomOnKick: boolean;
}

export interface EffectConstraints {
  maxConcurrent: number;
  priorityOrder: string[];
  minEffectDuration: number;
  maxEffectDuration: number;
  targetEffectDensity: 'low' | 'medium' | 'high';
}

export interface TextConstraints {
  firstTextBefore: number;
  maxDuration: number;
  minDuration: number;
  mustCreateCuriosityOrHype: boolean;
  totalTextElements: number;
}

export interface PhaseConstraints {
  minPhases: number;
  types: Array<'hook' | 'build' | 'drop' | 'outro'>;
}

/**
 * Plan Status
 */
export type PlanStatus = 'pending' | 'generating' | 'generated' | 'applying' | 'applied' | 'error';

export interface PlanState {
  currentPlan: EditPlan | null;
  planHistory: EditPlan[];
  status: PlanStatus;
  error?: string;
  previewMode: boolean;
  selectedConstraints?: ConstraintMode;
}

/**
 * Refinement Request
 */
export interface RefinementRequest {
  plan: EditPlan;
  clips: VideoClip[];
  instruction: string;
  intentType?: 'faster' | 'slower' | 'moreEffects' | 'lessEffects' | 'different' | 'custom';
}

/**
 * Refinement Response
 */
export interface RefinementResponse {
  plan: EditPlan;
  changes: EditAction[];
  metrics: {
    before: EditStats;
    after: EditStats;
  };
}

/**
 * Plan Template
 */
export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string;
  constraints: ConstraintProfile;
  previewPlan?: EditPlan;
  tags: string[];
  thumbnail?: string;
  rating?: number;
  uses?: number;
}

/**
 * Generation History Entry
 */
export interface GenerationHistoryEntry {
  id: string;
  timestamp: string;
  request: GenerationRequest;
  response: GenerationResponse;
  userFeedback?: 'liked' | 'disliked' | 'neutral';
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
