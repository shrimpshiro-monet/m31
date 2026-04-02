import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Editing Context Store
 * Tracks real-time editing activities to inform:
 * 1. Dynamic title display
 * 2. AI Director suggestions
 * 3. Social media trend analysis
 */

export type EditingActivity = 
  | 'idle'
  | 'drawing'
  | 'typing'
  | 'resizing'
  | 'rotating'
  | 'moving'
  | 'coloring'
  | 'adjusting-opacity'
  | 'applying-filter'
  | 'applying-effect'
  | 'cropping'
  | 'selecting'
  | 'erasing'
  | 'exporting';

export type ContentType = 
  | 'text'
  | 'shape'
  | 'image'
  | 'video'
  | 'layer'
  | 'selection'
  | 'brush';

export type SocialMediaPlatform = 
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'threads'
  | 'linkedin'
  | 'twitch'
  | 'snapchat'
  | 'unknown';

export type TrendingEditStyle = 
  | 'fast-cuts'
  | 'transitions'
  | 'text-overlays'
  | 'color-grading'
  | 'motion-graphics'
  | 'sound-design'
  | 'trending-audio'
  | 'slow-motion'
  | 'zoom-effects'
  | 'meme-format'
  | 'vertical-video'
  | 'aspect-ratio-switches'
  | 'none';

export interface EditingContextState {
  // Current editing activity
  currentActivity: EditingActivity;
  contentType: ContentType | null;
  activityStartTime: number;
  activityDuration: number;

  // What's being edited
  selectedLayerCount: number;
  selectedLayerTypes: ContentType[];
  editedProperties: string[]; // e.g., ['position', 'color', 'opacity']

  // Editing speed & intensity
  editFrequency: number; // actions per minute
  lastActionTime: number;
  actionCount: number; // in current session
  recentActions: EditingActivity[]; // last 10 actions

  // Project context
  projectScale: 'small' | 'medium' | 'large'; // based on layer count
  layerCount: number;
  hasVideo: boolean;
  hasAudio: boolean;

  // Trend detection
  detectedPlatform: SocialMediaPlatform;
  detectedTrends: TrendingEditStyle[];
  trendConfidence: number; // 0-1, how confident are we

  // AI Director hints
  suggestedNextAction: EditingActivity | null;
  aiDirectorContextHint: string;
}

interface EditingContextActions {
  // Activity tracking
  setActivity: (activity: EditingActivity, contentType?: ContentType) => void;
  endActivity: () => void;
  recordAction: (activity: EditingActivity) => void;

  // Selection tracking
  updateSelection: (count: number, types: ContentType[]) => void;

  // Property tracking
  recordPropertyEdit: (property: string) => void;
  clearPropertyEdits: () => void;

  // Project info
  updateProjectInfo: (layerCount: number, hasVideo: boolean, hasAudio: boolean) => void;

  // Trend detection
  detectTrends: () => void;
  setPlatform: (platform: SocialMediaPlatform) => void;

  // AI Director
  generateContextHint: () => string;
  suggestNextAction: () => EditingActivity | null;

  // Utilities
  getFormattedTitle: () => string;
  reset: () => void;
}

const defaultState: EditingContextState = {
  currentActivity: 'idle',
  contentType: null,
  activityStartTime: 0,
  activityDuration: 0,

  selectedLayerCount: 0,
  selectedLayerTypes: [],
  editedProperties: [],

  editFrequency: 0,
  lastActionTime: 0,
  actionCount: 0,
  recentActions: [],

  projectScale: 'small',
  layerCount: 0,
  hasVideo: false,
  hasAudio: false,

  detectedPlatform: 'unknown',
  detectedTrends: [],
  trendConfidence: 0,

  suggestedNextAction: null,
  aiDirectorContextHint: '',
};

export const useEditingContextStore = create<EditingContextState & EditingContextActions>()(
  subscribeWithSelector((set, get) => ({
    ...defaultState,

    // Activity tracking
    setActivity: (activity: EditingActivity, contentType?: ContentType) => {
      set((state) => ({
        currentActivity: activity,
        contentType: contentType || state.contentType,
        activityStartTime: Date.now(),
        activityDuration: 0,
      }));
    },

    endActivity: () => {
      set((state) => ({
        currentActivity: 'idle',
        activityDuration: Date.now() - state.activityStartTime,
      }));
    },

    recordAction: (activity: EditingActivity) => {
      set((state) => {
        const now = Date.now();
        const timeSinceLastAction = now - state.lastActionTime;
        
        // Calculate edit frequency (actions per minute)
        const editFrequency = timeSinceLastAction > 0 
          ? Math.round((60000 / timeSinceLastAction) * 10) / 10 
          : 0;

        // Keep last 10 actions
        const recentActions = [activity, ...state.recentActions.slice(0, 9)];

        return {
          lastActionTime: now,
          actionCount: state.actionCount + 1,
          editFrequency,
          recentActions,
        };
      });
    },

    // Selection tracking
    updateSelection: (count: number, types: ContentType[]) => {
      set({ selectedLayerCount: count, selectedLayerTypes: types });
    },

    // Property tracking
    recordPropertyEdit: (property: string) => {
      set((state) => {
        const updated = new Set(state.editedProperties);
        updated.add(property);
        return { editedProperties: Array.from(updated) };
      });
    },

    clearPropertyEdits: () => {
      set({ editedProperties: [] });
    },

    // Project info
    updateProjectInfo: (layerCount: number, hasVideo: boolean, hasAudio: boolean) => {
      const projectScale = layerCount > 50 ? 'large' : layerCount > 20 ? 'medium' : 'small';
      set({ layerCount, hasVideo, hasAudio, projectScale });
    },

    // Trend detection - analyze editing patterns
    detectTrends: () => {
      set((state) => {
        const trends: TrendingEditStyle[] = [];
        let confidence = 0;

        // Analyze recent actions for trending patterns
        const actionCounts = state.recentActions.reduce((acc, action) => {
          acc[action] = (acc[action] || 0) + 1;
          return acc;
        }, {} as Record<EditingActivity, number>);

        // Pattern detection
        if (actionCounts['applying-effect'] && actionCounts['applying-effect'] > 3) {
          trends.push('motion-graphics');
          confidence += 0.2;
        }

        if (actionCounts['typing'] && actionCounts['typing'] > 2) {
          trends.push('text-overlays');
          confidence += 0.25;
        }

        if (state.editedProperties.includes('opacity')) {
          trends.push('transitions');
          confidence += 0.15;
        }

        if (state.editedProperties.includes('color')) {
          trends.push('color-grading');
          confidence += 0.15;
        }

        if (state.editFrequency > 5) {
          trends.push('fast-cuts');
          confidence += 0.2;
        }

        if (state.hasAudio) {
          trends.push('sound-design');
          confidence += 0.15;
        }

        // Determine platform based on project aspect ratio and activity
        const platform: SocialMediaPlatform = 
          state.projectScale === 'small' ? 'tiktok' :
          state.projectScale === 'medium' ? 'instagram' :
          'youtube';

        return {
          detectedTrends: [...new Set(trends)], // deduplicate
          trendConfidence: Math.min(confidence, 1),
          detectedPlatform: platform,
        };
      });
    },

    setPlatform: (platform: SocialMediaPlatform) => {
      set({ detectedPlatform: platform });
    },

    // Generate AI Director context hint
    generateContextHint: () => {
      const state = get();
      const hints: string[] = [];

      // Based on current activity
      if (state.currentActivity !== 'idle') {
        hints.push(`Currently ${state.currentActivity}`);
      }

      // Based on editing speed
      if (state.editFrequency > 5) {
        hints.push('Fast-paced editing detected');
      } else if (state.editFrequency > 0) {
        hints.push('Deliberate, detail-focused editing');
      }

      // Based on trends
      if (state.detectedTrends.length > 0) {
        hints.push(`Trending: ${state.detectedTrends.join(', ')}`);
      }

      // Based on platform
      if (state.detectedPlatform !== 'unknown') {
        hints.push(`Optimized for ${state.detectedPlatform}`);
      }

      // Based on project complexity
      if (state.projectScale === 'large') {
        hints.push('Complex project with many layers');
      }

      const hint = hints.join(' • ');
      set({ aiDirectorContextHint: hint });
      return hint;
    },

    // Suggest next action based on patterns
    suggestNextAction: () => {
      const state = get();
      const actionCounts = state.recentActions.reduce((acc, action) => {
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {} as Record<EditingActivity, number>);

      // If lots of drawing, suggest adding text or effects
      if (actionCounts['drawing'] && actionCounts['drawing'] > 4) {
        return 'typing';
      }

      // If lots of typing, suggest applying effects
      if (actionCounts['typing'] && actionCounts['typing'] > 3) {
        return 'applying-effect';
      }

      // If editing colors, suggest adjusting opacity for transitions
      if (actionCounts['coloring'] && actionCounts['coloring'] > 2) {
        return 'applying-effect';
      }

      // Default: suggest exporting after 30+ actions
      if (state.actionCount > 30) {
        return 'exporting';
      }

      return null;
    },

    // Generate formatted title
    getFormattedTitle: () => {
      const state = get();
      const projectName = 'MediaBunny';
      const activity = state.currentActivity;
      const selectedInfo = state.selectedLayerCount > 0 
        ? ` (${state.selectedLayerCount} selected)` 
        : '';

      const activityText = activity === 'idle' 
        ? 'Ready'
        : activity.charAt(0).toUpperCase() + activity.slice(1).replace(/-/g, ' ');

      const trendInfo = state.detectedTrends.length > 0 
        ? ` • ${state.detectedTrends[0]}`
        : '';

      return `${projectName} • ${activityText}${selectedInfo}${trendInfo}`;
    },

    reset: () => set(defaultState),
  }))
);
