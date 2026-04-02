/**
 * Social Media Trends Service
 * Analyzes editing patterns to detect and suggest trending edits
 * for different platforms
 */

export interface TrendMetrics {
  platform: string;
  avgEditingSpeed: number;
  textOverlayFrequency: number;
  transitionFrequency: number;
  effectFrequency: number;
  colorGradingFrequency: number;
  audioIntegration: boolean;
  videoLength: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | 'unknown';
}

export interface PlatformTrend {
  name: string;
  platform: string;
  popularity: number; // 0-100
  commonStyles: string[];
  recommendedDuration: string;
  recommendedSpeed: 'slow' | 'medium' | 'fast';
  audioTrends: string[];
  visualTrends: string[];
}

// Trending patterns by platform (updated based on real social media trends)
const PLATFORM_TRENDS: Record<string, PlatformTrend> = {
  // TikTok: Fast-paced, music-driven, trendy effects
  tiktok: {
    name: 'TikTok Trends',
    platform: 'tiktok',
    popularity: 95,
    commonStyles: ['fast-cuts', 'text-overlays', 'trending-audio', 'zoom-effects'],
    recommendedDuration: '15-60 seconds',
    recommendedSpeed: 'fast',
    audioTrends: ['trending-sounds', 'remixes', 'voiceovers', 'ambient-music'],
    visualTrends: ['jump-cuts', 'match-cuts', 'quick-transitions', 'text-pop-ins'],
  },

  // Instagram Reels: Polished, shorter, high-quality transitions
  instagram: {
    name: 'Instagram Reels',
    platform: 'instagram',
    popularity: 85,
    commonStyles: ['transitions', 'color-grading', 'motion-graphics', 'text-overlays'],
    recommendedDuration: '15-30 seconds',
    recommendedSpeed: 'medium',
    audioTrends: ['trending-music', 'covers', 'original-audio', 'licensed-music'],
    visualTrends: ['smooth-transitions', 'color-grade', 'cinematic', 'aspect-ratio-switches'],
  },

  // YouTube: Longer form, high-production value
  youtube: {
    name: 'YouTube Trends',
    platform: 'youtube',
    popularity: 80,
    commonStyles: ['motion-graphics', 'color-grading', 'sound-design', 'transitions'],
    recommendedDuration: '60-600 seconds',
    recommendedSpeed: 'medium',
    audioTrends: ['original-soundtrack', 'voiceover', 'ambient-sound', 'licensed-music'],
    visualTrends: ['title-sequences', 'motion-graphics', 'color-grading', 'b-roll-integration'],
  },

  // Twitter/X: Quick content, minimal editing
  twitter: {
    name: 'Twitter/X Trends',
    platform: 'twitter',
    popularity: 60,
    commonStyles: ['text-overlays', 'fast-cuts', 'meme-format'],
    recommendedDuration: '5-30 seconds',
    recommendedSpeed: 'fast',
    audioTrends: ['trending-clips', 'voice-clips', 'background-music'],
    visualTrends: ['subtitles', 'captions', 'emoji-overlays', 'quick-cuts'],
  },

  // Snapchat: Vertical, fun, quick effects
  snapchat: {
    name: 'Snapchat Stories',
    platform: 'snapchat',
    popularity: 70,
    commonStyles: ['fast-cuts', 'zoom-effects', 'text-overlays', 'vertical-video'],
    recommendedDuration: '5-20 seconds',
    recommendedSpeed: 'fast',
    audioTrends: ['trending-sounds', 'voice-clips', 'ambient-music'],
    visualTrends: ['vertical-format', 'snapchat-filters', 'quick-cuts', 'text-overlays'],
  },

  // Twitch: Gaming/streaming content
  twitch: {
    name: 'Twitch Highlights',
    platform: 'twitch',
    popularity: 75,
    commonStyles: ['fast-cuts', 'sound-design', 'motion-graphics', 'meme-format'],
    recommendedDuration: '30-300 seconds',
    recommendedSpeed: 'fast',
    audioTrends: ['game-audio', 'voice-clips', 'meme-sound-effects'],
    visualTrends: ['gameplay-highlight', 'reaction-shots', 'jump-cuts', 'meme-edits'],
  },

  // LinkedIn: Professional, clean, informative
  linkedin: {
    name: 'LinkedIn Content',
    platform: 'linkedin',
    popularity: 50,
    commonStyles: ['motion-graphics', 'text-overlays', 'professional-transitions'],
    recommendedDuration: '15-60 seconds',
    recommendedSpeed: 'slow',
    audioTrends: ['background-music', 'voiceover', 'corporate-music'],
    visualTrends: ['title-cards', 'data-visualization', 'smooth-transitions', 'professional-text'],
  },

  // Threads: Instagram alternative, clean design
  threads: {
    name: 'Threads Content',
    platform: 'threads',
    popularity: 40,
    commonStyles: ['transitions', 'text-overlays', 'color-grading'],
    recommendedDuration: '15-45 seconds',
    recommendedSpeed: 'medium',
    audioTrends: ['ambient-music', 'voiceover', 'trending-audio'],
    visualTrends: ['smooth-transitions', 'text-design', 'minimal-effects', 'aspect-ratio-switches'],
  },
};

// Edit style recommendations based on current trends
export const TRENDING_EDITS = {
  'fast-cuts': {
    description: 'Quick, snappy cuts with minimal transitions',
    platforms: ['tiktok', 'snapchat', 'twitch'],
    techniques: ['remove-silence', 'match-cuts', 'beat-sync'],
  },
  'transitions': {
    description: 'Smooth transitions between clips',
    platforms: ['instagram', 'youtube', 'linkedin'],
    techniques: ['fade', 'slide', 'zoom-transition', 'whip-pan'],
  },
  'text-overlays': {
    description: 'Strategic text placement for emphasis',
    platforms: ['tiktok', 'instagram', 'twitter', 'snapchat'],
    techniques: ['title-text', 'caption-text', 'pop-text', 'animated-text'],
  },
  'color-grading': {
    description: 'Professional color correction and grading',
    platforms: ['instagram', 'youtube', 'linkedin'],
    techniques: ['color-correction', 'lut-application', 'tone-mapping'],
  },
  'motion-graphics': {
    description: 'Dynamic animated graphics',
    platforms: ['youtube', 'linkedin', 'instagram'],
    techniques: ['animated-titles', 'animated-transitions', 'kinetic-typography'],
  },
  'sound-design': {
    description: 'Strategic audio layering and sound effects',
    platforms: ['youtube', 'twitch', 'tiktok'],
    techniques: ['foley-effects', 'sound-effects', 'audio-layering'],
  },
  'trending-audio': {
    description: 'Current trending sounds and music',
    platforms: ['tiktok', 'instagram', 'snapchat'],
    techniques: ['trending-sounds', 'audio-sync', 'beat-matching'],
  },
  'slow-motion': {
    description: 'Slow motion effects for emphasis',
    platforms: ['instagram', 'youtube', 'tiktok'],
    techniques: ['slow-motion', 'ramping', 'variable-speed'],
  },
  'zoom-effects': {
    description: 'Dynamic zoom and scale effects',
    platforms: ['tiktok', 'snapchat', 'youtube'],
    techniques: ['zoom-in', 'zoom-out', 'ken-burns'],
  },
  'meme-format': {
    description: 'Popular meme and reaction formats',
    platforms: ['twitter', 'twitch', 'reddit'],
    techniques: ['reaction-shot', 'text-format', 'audio-sync'],
  },
};

export class SocialMediaTrendsService {
  /**
   * Analyze current editing metrics and recommend trends
   */
  static analyzeTrends(metrics: TrendMetrics): PlatformTrend | null {
    const platform = PLATFORM_TRENDS[metrics.platform];
    if (!platform) return null;

    // Calculate trend score based on how well edits match platform
    let trendScore = 0;

    // Evaluate editing speed
    if (metrics.platform === 'tiktok' || metrics.platform === 'snapchat') {
      if (metrics.avgEditingSpeed > 3) trendScore += 20;
    } else if (metrics.platform === 'youtube' || metrics.platform === 'linkedin') {
      if (metrics.avgEditingSpeed < 2) trendScore += 20;
    }

    // Evaluate text overlays
    if (metrics.textOverlayFrequency > 0.3) {
      trendScore += (metrics.textOverlayFrequency * 20);
    }

    // Evaluate transitions
    if (metrics.transitionFrequency > 0.2) {
      trendScore += (metrics.transitionFrequency * 15);
    }

    // Evaluate audio
    if (metrics.audioIntegration) {
      trendScore += 15;
    }

    return platform;
  }

  /**
   * Get recommendations for next editing action
   */
  static getNextActionRecommendation(
    platform: string,
    currentMetrics: TrendMetrics,
  ): string[] {
    const platformTrend = PLATFORM_TRENDS[platform];
    if (!platformTrend) return [];

    const recommendations: string[] = [];

    // If not many text overlays, recommend adding them
    if (currentMetrics.textOverlayFrequency < 0.3) {
      recommendations.push('Add text overlays');
    }

    // If not many transitions, recommend them
    if (currentMetrics.transitionFrequency < 0.2) {
      recommendations.push('Add transitions');
    }

    // If no audio integration, recommend it
    if (!currentMetrics.audioIntegration) {
      recommendations.push('Integrate audio/music');
    }

    // Platform-specific recommendations
    if (platform === 'tiktok' || platform === 'instagram') {
      if (currentMetrics.avgEditingSpeed < 3) {
        recommendations.push('Speed up cuts for more energy');
      }
    }

    if (platform === 'youtube' || platform === 'linkedin') {
      if (currentMetrics.avgEditingSpeed > 3) {
        recommendations.push('Slow down cuts for clarity');
      }
    }

    // Color grading recommendation
    if (currentMetrics.colorGradingFrequency < 0.2) {
      if (platform === 'instagram' || platform === 'youtube') {
        recommendations.push('Apply color grading');
      }
    }

    return recommendations;
  }

  /**
   * Get trending editing techniques for platform
   */
  static getTrendingTechniques(platform: string): string[] {
    const trends = PLATFORM_TRENDS[platform]?.visualTrends || [];
    return trends.slice(0, 3); // Return top 3
  }

  /**
   * Get audio recommendations for platform
   */
  static getAudioRecommendations(platform: string): string[] {
    const trends = PLATFORM_TRENDS[platform]?.audioTrends || [];
    return trends.slice(0, 3); // Return top 3
  }

  /**
   * Analyze aspect ratio appropriateness
   */
  static analyzeAspectRatio(
    aspectRatio: string,
    platform: string,
  ): { score: number; suggestion: string } {
    const aspectRatioScores: Record<string, Record<string, number>> = {
      '16:9': { youtube: 0.9, tiktok: 0.3, instagram: 0.7, snapchat: 0.2 },
      '9:16': { tiktok: 0.95, snapchat: 0.95, instagram: 0.8, youtube: 0.3 },
      '1:1': { instagram: 0.95, threads: 0.85, twitter: 0.7, youtube: 0.5 },
      '4:5': { instagram: 0.85, tiktok: 0.8, snapchat: 0.75 },
    };

    const score = aspectRatioScores[aspectRatio]?.[platform] ?? 0.5;
    let suggestion = 'Good format';

    if (score < 0.5) {
      suggestion = `Consider 9:16 for ${platform}`;
    } else if (score > 0.85) {
      suggestion = `Perfect for ${platform}!`;
    }

    return { score, suggestion };
  }

  /**
   * Generate AI Director context based on platform trends
   */
  static generateAIDirectorContext(
    platform: string,
    _metrics?: TrendMetrics,
  ): string {
    const platformInfo = PLATFORM_TRENDS[platform];
    if (!platformInfo) return '';

    const parts = [
      `Platform: ${platformInfo.name}`,
      `Recommended speed: ${platformInfo.recommendedSpeed}`,
      `Trending styles: ${platformInfo.commonStyles.slice(0, 2).join(', ')}`,
      `Suggested duration: ${platformInfo.recommendedDuration}`,
    ];

    return parts.join(' • ');
  }
}
