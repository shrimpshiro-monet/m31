import { useEditingContextStore } from '../stores/editing-context-store';
import { SocialMediaTrendsService, TrendMetrics } from './social-media-trends-service';

/**
 * AI Director Context Engine
 * Bridges editing context, trends, and AI suggestions
 * Provides real-time context for AI Director system
 */

export interface AIDirectorContext {
  currentActivity: string;
  editingSpeed: number;
  detectedTrends: string[];
  targetPlatform: string;
  nextSuggestedActions: string[];
  contextHint: string;
  urgencyLevel: 'low' | 'medium' | 'high'; // How urgent is the next suggestion
  confidenceScore: number; // 0-1, how confident are we in suggestions
}

export class AIDirectorContextEngine {
  /**
   * Generate comprehensive AI Director context from editing state
   */
  static generateContext(): AIDirectorContext {
    const store = useEditingContextStore.getState();

    // Build trend metrics from current state
    const trendMetrics: TrendMetrics = {
      platform: store.detectedPlatform,
      avgEditingSpeed: store.editFrequency,
      textOverlayFrequency: store.editedProperties.includes('text') ? 0.4 : 0,
      transitionFrequency: store.recentActions.filter(a => 
        a === 'applying-effect' || a === 'applying-filter'
      ).length / Math.max(store.recentActions.length, 1),
      effectFrequency: store.recentActions.filter(a => a === 'applying-effect').length / 10,
      colorGradingFrequency: store.editedProperties.includes('color') ? 0.3 : 0,
      audioIntegration: store.hasAudio,
      videoLength: 0, // Would need to get from project
      aspectRatio: 'unknown',
    };

    // Analyze trends (will be used for future enhancements)
    SocialMediaTrendsService.analyzeTrends(trendMetrics);
    const nextActions = SocialMediaTrendsService.getNextActionRecommendation(
      store.detectedPlatform,
      trendMetrics
    );

    // Generate context hint
    const contextHint = store.generateContextHint();

    // Calculate urgency based on action count and editing speed
    let urgencyLevel: 'low' | 'medium' | 'high' = 'low';
    if (store.editFrequency > 8) urgencyLevel = 'high';
    else if (store.editFrequency > 4) urgencyLevel = 'medium';

    // Confidence based on trend confidence and action history
    const confidenceScore = Math.min(
      store.trendConfidence + (store.actionCount / 100),
      1
    );

    return {
      currentActivity: store.currentActivity,
      editingSpeed: store.editFrequency,
      detectedTrends: store.detectedTrends,
      targetPlatform: store.detectedPlatform,
      nextSuggestedActions: nextActions,
      contextHint,
      urgencyLevel,
      confidenceScore,
    };
  }

  /**
   * Generate prompt for AI Director based on context
   */
  static generateAIDirectorPrompt(context: AIDirectorContext): string {
    const parts = [
      `User is currently ${context.currentActivity}`,
      `Editing speed: ${context.editingSpeed.toFixed(1)} actions per minute`,
      `Target platform: ${context.targetPlatform}`,
    ];

    if (context.detectedTrends.length > 0) {
      parts.push(`Detected trends: ${context.detectedTrends.join(', ')}`);
    }

    if (context.nextSuggestedActions.length > 0) {
      parts.push(`Recommended next steps: ${context.nextSuggestedActions.join(', ')}`);
    }

    if (context.urgencyLevel === 'high') {
      parts.push('Fast-paced editing - suggest quick, impactful edits');
    } else if (context.urgencyLevel === 'low') {
      parts.push('Deliberate editing - focus on quality and precision');
    }

    return parts.join('\n');
  }

  /**
   * Get background context for AI Director plan generation
   * This will be sent alongside user requests to inform AI suggestions
   */
  static getBackgroundContext(): string {
    const context = this.generateContext();
    const store = useEditingContextStore.getState();

    const sections = [
      `## Editing Context`,
      `- Current Activity: ${context.currentActivity}`,
      `- Editing Speed: ${context.editingSpeed.toFixed(1)} actions/min`,
      `- Target Platform: ${context.targetPlatform}`,
      `- Project Scale: ${store.projectScale}`,
      `- Total Actions: ${store.actionCount}`,
      '',
      `## Trend Analysis`,
      `- Detected Styles: ${context.detectedTrends.join(', ') || 'None yet'}`,
      `- Confidence: ${(context.confidenceScore * 100).toFixed(0)}%`,
      '',
      `## Project Info`,
      `- Layers: ${store.layerCount}`,
      `- Has Video: ${store.hasVideo ? 'Yes' : 'No'}`,
      `- Has Audio: ${store.hasAudio ? 'Yes' : 'No'}`,
      `- Selected: ${store.selectedLayerCount} items`,
      '',
      `## AI Director Hints`,
      `- Urgency: ${context.urgencyLevel}`,
      `- Next Suggested Actions: ${context.nextSuggestedActions.join(', ') || 'None'}`,
      `- Context: ${context.contextHint}`,
    ];

    return sections.join('\n');
  }

  /**
   * Update AI Director system with current context
   * Call this when integrating with AI Director for real-time updates
   */
  static updateAIDirectorSystem(): void {
    const context = this.generateContext();
    const backgroundContext = this.getBackgroundContext();

    // Store context in session storage for access across components
    sessionStorage.setItem('aiDirectorContext', JSON.stringify(context));
    sessionStorage.setItem('aiDirectorBackgroundContext', backgroundContext);

    // Dispatch custom event for real-time updates
    const event = new CustomEvent('aiDirectorContextUpdate', {
      detail: { context, backgroundContext }
    });
    window.dispatchEvent(event);
  }

  /**
   * Listen to context changes and update AI Director
   */
  static subscribeToContextChanges(callback: (context: AIDirectorContext) => void): () => void {
    // Subscribe to store changes
    const unsubscribe = useEditingContextStore.subscribe(
      (state) => [
        state.currentActivity,
        state.editFrequency,
        state.detectedTrends,
        state.actionCount,
      ],
      () => {
        const context = this.generateContext();
        callback(context);
        this.updateAIDirectorSystem();
      }
    );

    return unsubscribe;
  }
}

/**
 * Hook to use AI Director context in components
 */
export function useAIDirectorContext() {
  const context = AIDirectorContextEngine.generateContext();
  return {
    context,
    backgroundContext: AIDirectorContextEngine.getBackgroundContext(),
    prompt: AIDirectorContextEngine.generateAIDirectorPrompt(context),
  };
}
