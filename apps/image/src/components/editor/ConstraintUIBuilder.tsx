/**
 * Constraint UI Builder Component
 * Dynamic constraint adjustment interface
 */

import React, { useMemo } from 'react';
import type { ConstraintMode, EditPlan } from '../../types/ai-director.types';
import { usePlanStore } from '../../stores/plan-store';
import '../../styles/constraint-ui-builder.css';

interface ConstraintUIBuilderProps {
  onConstraintsChange?: (constraints: ConstraintMode) => void;
  plan?: EditPlan | null;
  compact?: boolean;
}

/**
 * Constraint profiles with descriptions
 */
const CONSTRAINT_PROFILES: Record<
  ConstraintMode,
  {
    label: string;
    description: string;
    icon: string;
    metrics: {
      pacing: string;
      beatSync: string;
      effects: string;
      textDensity: string;
    };
  }
> = {
  aggressive: {
    label: 'Aggressive',
    description: 'Fast cuts, many effects, high energy',
    icon: '⚡',
    metrics: {
      pacing: 'Fast',
      beatSync: 'Strong',
      effects: 'High',
      textDensity: 'High',
    },
  },
  balanced: {
    label: 'Balanced',
    description: 'Moderate pacing with good variety',
    icon: '⚖️',
    metrics: {
      pacing: 'Moderate',
      beatSync: 'Medium',
      effects: 'Moderate',
      textDensity: 'Moderate',
    },
  },
  cinematic: {
    label: 'Cinematic',
    description: 'Slow, dramatic, storytelling focus',
    icon: '🎬',
    metrics: {
      pacing: 'Slow',
      beatSync: 'Soft',
      effects: 'Subtle',
      textDensity: 'Low',
    },
  },
  minimal: {
    label: 'Minimal',
    description: 'Clean, simple, focus on content',
    icon: '✨',
    metrics: {
      pacing: 'Moderate',
      beatSync: 'Minimal',
      effects: 'Minimal',
      textDensity: 'Very Low',
    },
  },
  music_driven: {
    label: 'Music Driven',
    description: 'Synced to music beats and drops',
    icon: '🎵',
    metrics: {
      pacing: 'Variable',
      beatSync: 'Very Strong',
      effects: 'Matched',
      textDensity: 'Variable',
    },
  },
};

/**
 * Main constraint UI builder
 */
export const ConstraintUIBuilder: React.FC<ConstraintUIBuilderProps> = ({
  onConstraintsChange,
  plan,
  compact = false,
}) => {
  const selectedConstraints = usePlanStore((state) => state.selectedConstraints);
  const setSelectedConstraints = usePlanStore((state) => state.setSelectedConstraints);

  const handleConstraintSelect = (mode: ConstraintMode) => {
    setSelectedConstraints(mode);
    onConstraintsChange?.(mode);
  };

  if (compact) {
    return (
      <div className="constraint-ui-builder constraint-ui-builder--compact">
        <label className="constraint-label">Edit Style</label>
        <div className="constraint-selector--compact">
          {(Object.keys(CONSTRAINT_PROFILES) as ConstraintMode[]).map((mode) => (
            <button
              key={mode}
              className={`constraint-button--compact ${
                selectedConstraints === mode ? 'active' : ''
              }`}
              onClick={() => handleConstraintSelect(mode)}
              title={CONSTRAINT_PROFILES[mode].description}
            >
              {CONSTRAINT_PROFILES[mode].icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="constraint-ui-builder">
      <div className="builder__header">
        <h3>Edit Style Constraints</h3>
        <p className="builder__subtitle">Choose a profile or customize parameters</p>
      </div>

      {/* Profile selector */}
      <div className="builder__section">
        <label className="section__label">Preset Profiles</label>
        <div className="profile-grid">
          {(Object.keys(CONSTRAINT_PROFILES) as ConstraintMode[]).map((mode) => (
            <ProfileCard
              key={mode}
              mode={mode}
              profile={CONSTRAINT_PROFILES[mode]}
              isSelected={selectedConstraints === mode}
              onClick={() => handleConstraintSelect(mode)}
            />
          ))}
        </div>
      </div>

      {/* Detailed metrics for selected profile */}
      {selectedConstraints && (
        <ConstraintMetricsPanel
          profile={CONSTRAINT_PROFILES[selectedConstraints]}
          constraints={selectedConstraints}
        />
      )}

      {/* Plan adaptation info */}
      {plan && (
        <PlanAdaptationInfo plan={plan} constraints={selectedConstraints} />
      )}
    </div>
  );
};

/**
 * Profile card component
 */
interface ProfileCardProps {
  mode: ConstraintMode;
  profile: (typeof CONSTRAINT_PROFILES)[ConstraintMode];
  isSelected: boolean;
  onClick: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ mode, profile, isSelected, onClick }) => {
  return (
    <button
      className={`profile-card ${isSelected ? 'profile-card--active' : ''}`}
      onClick={onClick}
      data-profile={mode}
    >
      <div className="profile-card__icon">{profile.icon}</div>
      <div className="profile-card__content">
        <h4 className="profile-card__title">{profile.label}</h4>
        <p className="profile-card__description">{profile.description}</p>
      </div>
      {isSelected && <div className="profile-card__checkmark">✓</div>}
    </button>
  );
};

/**
 * Constraint metrics panel
 */
interface ConstraintMetricsPanelProps {
  profile: (typeof CONSTRAINT_PROFILES)[ConstraintMode];
  constraints: ConstraintMode;
}

const ConstraintMetricsPanel: React.FC<ConstraintMetricsPanelProps> = ({
  profile,
  constraints,
}) => {
  return (
    <div className="builder__section">
      <label className="section__label">Profile Metrics</label>
      <div className="metrics-panel">
        {Object.entries(profile.metrics).map(([key, value]) => (
          <div key={key} className="metric-row">
            <span className="metric-label">{formatMetricLabel(key)}</span>
            <div className="metric-bar">
              <div
                className={`metric-fill metric-fill--${constraints}`}
                style={{
                  width: `${getMetricBarWidth(value)}%`,
                }}
              >
                <span className="metric-value">{value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Plan adaptation info
 */
interface PlanAdaptationInfoProps {
  plan: EditPlan;
  constraints: ConstraintMode;
}

const PlanAdaptationInfo: React.FC<PlanAdaptationInfoProps> = ({ plan, constraints }) => {
  const info = useMemo(() => {
    const actionCount = plan.actions?.length || 0;
    const totalDuration = plan.metadata.total_duration || 0;
    const density = totalDuration > 0 ? actionCount / totalDuration : 0;

    let adaptation = '';
    switch (constraints) {
      case 'aggressive':
        adaptation = 'Plan optimized for fast cuts and dynamic transitions';
        break;
      case 'balanced':
        adaptation = 'Plan provides good balance of pacing and clarity';
        break;
      case 'cinematic':
        adaptation = 'Plan emphasizes storytelling and visual impact';
        break;
      case 'minimal':
        adaptation = 'Plan focused on content with minimal distraction';
        break;
      case 'music_driven':
        adaptation = 'Plan synchronized with audio beats';
        break;
    }

    return { adaptation, density, actionCount };
  }, [plan, constraints]);

  return (
    <div className="builder__section">
      <label className="section__label">Plan Adaptation</label>
      <div className="adaptation-info">
        <div className="adaptation-message">{info.adaptation}</div>
        <div className="adaptation-stats">
          <div className="stat-item">
            <span className="stat-item__label">Actions:</span>
            <span className="stat-item__value">{info.actionCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__label">Density:</span>
            <span className="stat-item__value">{info.density.toFixed(1)}/sec</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Utility functions
 */
function formatMetricLabel(key: string): string {
  return key
    .split(/([A-Z])/)
    .join(' ')
    .split(/[_]/)
    .join(' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function getMetricBarWidth(value: string): number {
  const widthMap: Record<string, number> = {
    'Very Low': 10,
    Low: 25,
    Minimal: 25,
    Soft: 33,
    'Very Soft': 20,
    Moderate: 50,
    Medium: 50,
    Strong: 75,
    High: 85,
    Fast: 85,
    Slow: 40,
    Variable: 60,
    'Very Strong': 95,
    Subtle: 30,
    Matched: 70,
  };

  return widthMap[value] || 50;
}

export default ConstraintUIBuilder;
