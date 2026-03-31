// Monet Dev Agent - persisted config and types
// Generated to reflect the project's agent rules and EditPlan contract.

export type ActionType = 'cut' | 'transition' | 'effect' | 'grade' | 'text' | 'speed';

export interface Clip {
  id: string;
  filename: string;
  duration: number;
  start?: number;
  end?: number;
}

export interface Action {
  id: string;
  type: ActionType;
  params: Record<string, any>;
  start: number;
  end?: number;
}

export interface EditPlan {
  id: string;
  clips: Clip[];
  actions: Action[];
  metadata?: Record<string, any>;
}

// AJV-compatible JSON Schema for EditPlan validation
export const editPlanAjvSchema = {
  $id: 'https://example.com/schemas/editplan.json',
  type: 'object',
  required: ['id', 'clips', 'actions'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    clips: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'filename', 'duration'],
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          duration: { type: 'number' },
          start: { type: 'number' },
          end: { type: 'number' },
        },
      },
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'params', 'start'],
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['cut', 'transition', 'effect', 'grade', 'text', 'speed'] },
          params: { type: 'object' },
          start: { type: 'number' },
          end: { type: 'number' },
        },
      },
    },
    metadata: { type: 'object' },
  },
};

export const monetAgentDefaults = {
  promptTimeoutMs: 15_000,
  modelCallTimeoutMs: 20_000,
  repairAttempts: 1,
};

export default {
  editPlanAjvSchema,
  monetAgentDefaults,
};
