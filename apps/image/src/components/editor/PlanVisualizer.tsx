/**
 * Plan Visualizer Component
 * Displays EditPlan as interactive timeline preview
 */

import React, { useMemo } from 'react';
import type { EditPlan, EditAction } from '../../types/ai-director.types';
import '../../styles/plan-visualizer.css';

interface PlanVisualizerProps {
  plan: EditPlan | null;
  onActionSelect?: (action: EditAction) => void;
  onActionRemove?: (actionId: string) => void;
  readOnly?: boolean;
  zoom?: number;
}

/**
 * Color mapping for different action types
 */
const ACTION_COLORS: Record<string, string> = {
  cut: '#3b82f6',
  transition: '#8b5cf6',
  effect: '#ec4899',
  text: '#f59e0b',
  audio: '#10b981',
  color: '#06b6d4',
  speed: '#f97316',
  layer: '#6366f1',
};

/**
 * Timeline visualization of edit plan
 */
export const PlanVisualizer: React.FC<PlanVisualizerProps> = ({
  plan,
  onActionSelect,
  onActionRemove,
  readOnly = false,
  zoom = 1,
}) => {
  if (!plan) {
    return (
      <div className="plan-visualizer plan-visualizer--empty">
        <p>No plan loaded. Generate or load a plan to visualize.</p>
      </div>
    );
  }

  const totalDuration = useMemo(() => {
    if (!plan.clips || plan.clips.length === 0) return 0;
    return Math.max(...plan.clips.map((clip) => (clip.end || clip.duration) ?? 0));
  }, [plan.clips]);

  const pixelsPerSecond = useMemo(() => {
    return 50 * zoom; // Base 50px per second, scaled by zoom
  }, [zoom]);

  const timelineWidth = totalDuration * pixelsPerSecond;

  // Group actions by type
  const actionsByType = useMemo(() => {
    const groups: Record<string, EditAction[]> = {};
    for (const action of plan.actions || []) {
      if (!groups[action.type]) {
        groups[action.type] = [];
      }
      groups[action.type].push(action);
    }
    return groups;
  }, [plan.actions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const actions = plan.actions || [];
    return {
      totalActions: actions.length,
      averageActionDuration:
        actions.length > 0
          ? actions.reduce((sum: number, a: EditAction) => sum + (a.end - a.start), 0) / actions.length
          : 0,
      actionDensity: (actions.length / totalDuration) * 60, // actions per minute
    };
  }, [plan.actions, totalDuration]);

  return (
    <div className="plan-visualizer">
      {/* Header with stats */}
      <div className="plan-visualizer__header">
        <div className="plan-visualizer__title">
          <h3>Edit Plan Timeline</h3>
          <span className="plan-visualizer__duration">
            {totalDuration.toFixed(1)}s
          </span>
        </div>
        <div className="plan-visualizer__stats">
          <div className="stat">
            <span className="stat__label">Actions</span>
            <span className="stat__value">{stats.totalActions}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Avg Duration</span>
            <span className="stat__value">{stats.averageActionDuration.toFixed(2)}s</span>
          </div>
          <div className="stat">
            <span className="stat__label">Density</span>
            <span className="stat__value">{stats.actionDensity.toFixed(1)}/min</span>
          </div>
        </div>
      </div>

      {/* Timeline tracks */}
      <div className="plan-visualizer__tracks">
        {/* Ruler */}
        <div className="plan-visualizer__ruler">
          <div className="ruler__track" style={{ width: `${timelineWidth}px` }}>
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="ruler__tick"
                style={{
                  left: `${i * pixelsPerSecond}px`,
                }}
              >
                <span className="ruler__label">{i}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action tracks */}
        {Object.entries(actionsByType).map(([actionType, actions]) => (
          <ActionTrack
            key={actionType}
            actionType={actionType}
            actions={actions}
            pixelsPerSecond={pixelsPerSecond}
            totalDuration={totalDuration}
            onActionSelect={onActionSelect}
            onActionRemove={onActionRemove}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="plan-visualizer__summary">
        <div className="action-legend">
          {Object.entries(ACTION_COLORS).map(([type, color]) => {
            const count = actionsByType[type]?.length || 0;
            if (count === 0) return null;
            return (
              <div key={type} className="legend-item">
                <div
                  className="legend-item__color"
                  style={{ backgroundColor: color }}
                />
                <span className="legend-item__label">
                  {type} ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Individual action track
 */
interface ActionTrackProps {
  actionType: string;
  actions: EditAction[];
  pixelsPerSecond: number;
  totalDuration: number;
  onActionSelect?: (action: EditAction) => void;
  onActionRemove?: (actionId: string) => void;
  readOnly?: boolean;
}

const ActionTrack: React.FC<ActionTrackProps> = ({
  actionType,
  actions,
  pixelsPerSecond,
  totalDuration,
  onActionSelect,
  onActionRemove,
  readOnly,
}) => {
  const color = ACTION_COLORS[actionType] || '#9ca3af';

  return (
    <div className="plan-visualizer__track">
      <div className="track__label">{actionType}</div>
      <div className="track__content" style={{ width: `${totalDuration * pixelsPerSecond}px` }}>
        {actions.map((action) => (
          <ActionBlock
            key={action.id}
            action={action}
            color={color}
            pixelsPerSecond={pixelsPerSecond}
            onSelect={() => onActionSelect?.(action)}
            onRemove={() => onActionRemove?.(action.id)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual action block
 */
interface ActionBlockProps {
  action: EditAction;
  color: string;
  pixelsPerSecond: number;
  onSelect?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
}

const ActionBlock: React.FC<ActionBlockProps> = ({
  action,
  color,
  pixelsPerSecond,
  onSelect,
  onRemove,
  readOnly,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const left = action.start * pixelsPerSecond;
  const width = (action.end - action.start) * pixelsPerSecond;

  return (
    <div
      className="action-block"
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`,
        backgroundColor: color,
      }}
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(!showMenu);
      }}
    >
      <div className="action-block__content">
        <span className="action-block__label">{action.type}</span>
      </div>

      {showMenu && !readOnly && (
        <div className="action-block__menu">
          <button className="menu-item" onClick={onRemove}>
            Remove
          </button>
          <button className="menu-item" onClick={() => onSelect?.()}>
            Edit
          </button>
        </div>
      )}

      {action.metadata?.intensity && (
        <div className="action-block__intensity">{action.metadata.intensity}</div>
      )}
    </div>
  );
};

export default PlanVisualizer;
