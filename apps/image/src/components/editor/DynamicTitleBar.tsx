import { useEffect, useState } from 'react';
import { useEditingContextStore } from '../../stores/editing-context-store';
import { Sparkles } from 'lucide-react';

/**
 * Dynamic Title Bar Component
 * Shows real-time editing activity, trends, and AI suggestions
 */

export function DynamicTitleBar() {
  const {
    currentActivity,
    selectedLayerCount,
    detectedTrends,
    detectedPlatform,
    editFrequency,
    getFormattedTitle,
    generateContextHint,
    suggestNextAction,
  } = useEditingContextStore();

  const [displayTitle, setDisplayTitle] = useState('MediaBunny');
  const [contextHint, setContextHint] = useState('');
  const [nextAction, setNextAction] = useState<string | null>(null);
  const [showTrendBadge, setShowTrendBadge] = useState(false);

  // Update title in real-time
  useEffect(() => {
    setDisplayTitle(getFormattedTitle());
  }, [currentActivity, selectedLayerCount, detectedTrends, getFormattedTitle]);

  // Update browser tab title
  useEffect(() => {
    document.title = displayTitle;
  }, [displayTitle]);

  // Generate context hint periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const hint = generateContextHint();
      setContextHint(hint);
    }, 2000);

    return () => clearInterval(interval);
  }, [generateContextHint]);

  // Suggest next action periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const suggested = suggestNextAction();
      setNextAction(suggested ? suggested.replace(/-/g, ' ').toUpperCase() : null);
    }, 3000);

    return () => clearInterval(interval);
  }, [suggestNextAction]);

  // Show trend badge when trends detected
  useEffect(() => {
    if (detectedTrends.length > 0) {
      setShowTrendBadge(true);
      const timer = setTimeout(() => setShowTrendBadge(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [detectedTrends]);

  const getPlatformIcon = () => {
    const icons: Record<string, string> = {
      tiktok: '🎵',
      instagram: '📷',
      youtube: '▶️',
      twitter: '𝕏',
      threads: '🧵',
      linkedin: '💼',
      twitch: '🎮',
      snapchat: '👻',
    };
    return icons[detectedPlatform] || '📱';
  };

  const getActivityColor = () => {
    const colors: Record<string, string> = {
      idle: 'from-gray-600 to-gray-700',
      drawing: 'from-blue-600 to-cyan-600',
      typing: 'from-green-600 to-emerald-600',
      resizing: 'from-purple-600 to-pink-600',
      rotating: 'from-orange-600 to-red-600',
      moving: 'from-yellow-600 to-orange-600',
      coloring: 'from-pink-600 to-fuchsia-600',
      'adjusting-opacity': 'from-indigo-600 to-purple-600',
      'applying-filter': 'from-violet-600 to-purple-600',
      'applying-effect': 'from-cyan-600 to-blue-600',
      cropping: 'from-amber-600 to-yellow-600',
      selecting: 'from-lime-600 to-green-600',
      erasing: 'from-slate-600 to-gray-600',
      exporting: 'from-emerald-600 to-green-600',
    };
    return colors[currentActivity] || colors.idle;
  };

  return (
    <div className="w-full bg-gradient-to-r from-card to-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Main Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {/* Activity indicator */}
            <div
              className={`h-2 w-2 rounded-full bg-gradient-to-r ${getActivityColor()} animate-pulse`}
            />

            {/* Title */}
            <h1 className="text-lg font-semibold text-foreground truncate">
              {displayTitle}
            </h1>

            {/* Platform badge */}
            <span className="text-sm px-2 py-1 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap flex items-center gap-1">
              {getPlatformIcon()} {detectedPlatform === 'unknown' ? 'Platform' : detectedPlatform}
            </span>
          </div>

          {/* Context hint */}
          {contextHint && (
            <p className="text-xs text-muted-foreground mt-1.5 truncate">
              {contextHint}
            </p>
          )}
        </div>

        {/* Stats & Suggestions */}
        <div className="flex items-center gap-3 whitespace-nowrap">
          {/* Edit frequency */}
          {editFrequency > 0 && (
            <div className="text-right">
              <p className="text-xs font-medium text-foreground">
                {editFrequency.toFixed(1)} actions/min
              </p>
              <p className="text-xs text-muted-foreground">Edit Speed</p>
            </div>
          )}

          {/* Trend badge - animated */}
          {showTrendBadge && detectedTrends.length > 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <Sparkles size={14} className="text-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">
                  {detectedTrends[0]}
                </span>
              </div>
            </div>
          )}

          {/* AI suggestion */}
          {nextAction && (
            <div className="text-right animate-in fade-in slide-in-from-right-4 duration-500">
              <p className="text-xs font-medium text-accent">
                💡 Try: {nextAction}
              </p>
              <p className="text-xs text-muted-foreground">AI Suggestion</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
