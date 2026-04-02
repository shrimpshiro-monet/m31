/**
 * Plan Applier
 * Converts EditPlan actions into canvas/timeline operations
 */

import type { EditPlan, EditAction, EditActionType } from '../types/ai-director.types';

/**
 * Represents a timeline operation to be applied
 */
export interface TimelineOperation {
  clipId: string;
  type: EditActionType | string;
  startTime: number;
  duration: number;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Result of applying a plan
 */
export interface PlanApplicationResult {
  success: boolean;
  operationsCount: number;
  operations: TimelineOperation[];
  errors: string[];
  warnings: string[];
  appliedAt: Date;
}

/**
 * Apply an EditPlan to the timeline
 */
export function applyEditPlan(plan: EditPlan): PlanApplicationResult {
  const result: PlanApplicationResult = {
    success: true,
    operationsCount: 0,
    operations: [],
    errors: [],
    warnings: [],
    appliedAt: new Date(),
  };

  try {
    // Validate plan structure
    if (!plan.actions || plan.actions.length === 0) {
      result.warnings.push('Plan contains no actions');
      return result;
    }

    if (!plan.clips || plan.clips.length === 0) {
      result.errors.push('Plan contains no clips');
      result.success = false;
      return result;
    }

    // Convert actions to operations
    for (const action of plan.actions) {
      try {
        const operations = convertActionToOperations(action, plan);
        result.operations.push(...operations);
      } catch (error) {
        result.errors.push(
          `Failed to convert action ${action.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.operationsCount = result.operations.length;

    if (result.errors.length > 0) {
      result.success = false;
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error applying plan');
  }

  return result;
}

/**
 * Convert individual action to timeline operations
 */
function convertActionToOperations(action: EditAction, plan: EditPlan): TimelineOperation[] {
  const operations: TimelineOperation[] = [];
  const clipId = getTargetClipId(action, plan);

  if (!clipId) {
    throw new Error(`Cannot determine target clip for action ${action.id}`);
  }

  const operation: TimelineOperation = {
    clipId,
    type: action.type,
    startTime: action.start,
    duration: action.end - action.start,
    parameters: action.params || {},
    metadata: action.metadata,
  };

  // Handle action-specific conversion
  switch (action.type) {
    case 'cut':
      operations.push(operation);
      break;

    case 'transition':
      operations.push({
        ...operation,
        type: 'transition',
        parameters: {
          ...operation.parameters,
          duration: operation.parameters.duration || 0.3,
          easing: operation.parameters.easing || 'easeInOut',
        },
      });
      break;

    case 'effect':
      operations.push({
        ...operation,
        type: 'effect',
        parameters: {
          ...operation.parameters,
          effectType: operation.parameters.effectType || 'fade',
          intensity: operation.parameters.intensity ?? 1,
        },
      });
      break;

    case 'text':
      operations.push({
        ...operation,
        type: 'text',
        parameters: {
          ...operation.parameters,
          content: operation.parameters.content || 'Text',
          fontSize: operation.parameters.fontSize ?? 24,
          color: operation.parameters.color || '#ffffff',
          alignment: operation.parameters.alignment || 'center',
        },
      });
      break;

    case 'audio':
      operations.push({
        ...operation,
        type: 'audio',
        parameters: {
          ...operation.parameters,
          volume: operation.parameters.volume ?? 1,
          fade: operation.parameters.fade || false,
        },
      });
      break;

    case 'color':
      operations.push({
        ...operation,
        type: 'color',
        parameters: {
          ...operation.parameters,
          adjustment: operation.parameters.adjustment || 'saturation',
          value: operation.parameters.value ?? 0,
        },
      });
      break;

    case 'layer':
      operations.push({
        ...operation,
        type: 'layer',
        parameters: {
          ...operation.parameters,
          opacity: operation.parameters.opacity ?? 1,
          blendMode: operation.parameters.blendMode || 'normal',
        },
      });
      break;

    case 'speed':
      operations.push({
        ...operation,
        type: 'speed',
        parameters: {
          ...operation.parameters,
          rate: operation.parameters.rate ?? 1,
          easing: operation.parameters.easing || 'linear',
        },
      });
      break;

    default:
      operations.push(operation);
  }

  return operations;
}

/**
 * Get target clip ID for an action
 */
function getTargetClipId(action: EditAction, plan: EditPlan): string | null {
  // If action specifies a clip ID, use it
  if (action.params?.clipId) {
    return action.params.clipId;
  }

  // Otherwise find clip that overlaps with action time
  if (plan.clips && plan.clips.length > 0) {
    const overlappingClip = plan.clips.find(
      (clip) =>
        clip.start !== undefined &&
        clip.end !== undefined &&
        action.start < clip.end &&
        action.end > clip.start
    );
    return overlappingClip?.id || plan.clips[0].id;
  }

  return null;
}

/**
 * Validate plan before applying
 */
export function validatePlanForApplication(plan: EditPlan): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check clips
  if (!plan.clips || plan.clips.length === 0) {
    errors.push('Plan must contain at least one clip');
  }

  // Check actions
  if (!plan.actions || plan.actions.length === 0) {
    warnings.push('Plan contains no actions');
  }

  // Validate action times
  if (plan.clips && plan.actions) {
    const totalDuration = plan.clips.reduce((max, clip) => {
      if (clip.end === undefined) return max;
      return Math.max(max, clip.end);
    }, 0);

    for (const action of plan.actions) {
      if (action.start < 0) {
        errors.push(`Action ${action.id} has negative start time`);
      }
      if (action.end <= action.start) {
        errors.push(`Action ${action.id} has invalid time range`);
      }
      if (action.end > totalDuration * 1.1) {
        // Allow 10% overshoot
        warnings.push(`Action ${action.id} extends beyond clip duration`);
      }
    }
  }

  // Validate action parameters
  for (const action of plan.actions || []) {
    const paramErrors = validateActionParameters(action);
    errors.push(...paramErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate action parameters
 */
function validateActionParameters(action: EditAction): string[] {
  const errors: string[] = [];
  const params = action.params || {};

  switch (action.type) {
    case 'transition':
      if (params.duration !== undefined && (params.duration < 0 || params.duration > 3)) {
        errors.push(`Transition ${action.id}: duration must be between 0 and 3 seconds`);
      }
      break;

    case 'effect':
      if (params.intensity !== undefined && (params.intensity < 0 || params.intensity > 1)) {
        errors.push(`Effect ${action.id}: intensity must be between 0 and 1`);
      }
      break;

    case 'text':
      if (!params.content) {
        errors.push(`Text ${action.id}: must have content`);
      }
      if (params.fontSize && (params.fontSize < 8 || params.fontSize > 256)) {
        errors.push(`Text ${action.id}: fontSize must be between 8 and 256`);
      }
      break;

    case 'audio':
      if (params.volume !== undefined && (params.volume < 0 || params.volume > 1)) {
        errors.push(`Audio ${action.id}: volume must be between 0 and 1`);
      }
      break;

    case 'color':
      if (params.value !== undefined && (params.value < -100 || params.value > 100)) {
        errors.push(`Color ${action.id}: value must be between -100 and 100`);
      }
      break;
  }

  return errors;
}

/**
 * Preview what will happen when applying plan
 */
export function previewPlanApplication(plan: EditPlan): {
  clipsAffected: number;
  actionsToApply: number;
  affectedClipIds: string[];
  timelineChanges: string[];
} {
  const affectedClipIds = new Set<string>();
  const timelineChanges: string[] = [];

  // Collect affected clips
  for (const action of plan.actions || []) {
    const clipId = action.params?.clipId;
    if (clipId) {
      affectedClipIds.add(clipId);
    }
  }

  // If no explicit clip IDs, check overlaps
  if (affectedClipIds.size === 0 && plan.clips && plan.actions) {
    for (const action of plan.actions) {
      for (const clip of plan.clips) {
        if (
          clip.start !== undefined &&
          clip.end !== undefined &&
          action.start < clip.end &&
          action.end > clip.start
        ) {
          affectedClipIds.add(clip.id);
        }
      }
    }
  }

  // Generate timeline change descriptions
  const actionsByType = (plan.actions || []).reduce(
    (acc, action) => {
      if (!acc[action.type]) acc[action.type] = 0;
      acc[action.type]++;
      return acc;
    },
    {} as Record<string, number>
  );

  for (const [type, count] of Object.entries(actionsByType)) {
    timelineChanges.push(`${count} ${type} action${count > 1 ? 's' : ''}`);
  }

  return {
    clipsAffected: affectedClipIds.size,
    actionsToApply: plan.actions?.length || 0,
    affectedClipIds: Array.from(affectedClipIds),
    timelineChanges,
  };
}

/**
 * Batch apply multiple plans
 */
export function applyMultiplePlans(plans: EditPlan[]): PlanApplicationResult {
  const result: PlanApplicationResult = {
    success: true,
    operationsCount: 0,
    operations: [],
    errors: [],
    warnings: [],
    appliedAt: new Date(),
  };

  for (const plan of plans) {
    const planResult = applyEditPlan(plan);
    result.operations.push(...planResult.operations);
    result.errors.push(...planResult.errors);
    result.warnings.push(...planResult.warnings);
    if (!planResult.success) result.success = false;
  }

  result.operationsCount = result.operations.length;
  return result;
}

/**
 * Undo plan application (creates inverse operations)
 */
export function createUndoOperations(result: PlanApplicationResult): TimelineOperation[] {
  return result.operations
    .slice()
    .reverse()
    .map((op) => ({
      ...op,
      type: 'undo-' + op.type,
    }));
}
