/**
 * Plan Comparison Component
 * A/B testing interface for comparing different edit plans
 */

import React, { useMemo } from 'react';
import type { EditPlan, EditActionType } from '../../types/ai-director.types';
import '../../styles/plan-comparison.css';

interface PlanComparisonProps {
  planA: EditPlan | null;
  planB: EditPlan | null;
  onSelectPlan?: (plan: EditPlan, side: 'A' | 'B') => void;
  onExport?: (plan: EditPlan) => void;
}

/**
 * Plan comparison component
 */
export const PlanComparison: React.FC<PlanComparisonProps> = ({
  planA,
  planB,
  onSelectPlan,
  onExport,
}) => {
  const comparisonData = useMemo(() => {
    return {
      planA: planA ? analyzePlan(planA) : null,
      planB: planB ? analyzePlan(planB) : null,
    };
  }, [planA, planB]);

  if (!planA && !planB) {
    return (
      <div className="plan-comparison plan-comparison--empty">
        <p>Load two plans to compare side-by-side</p>
      </div>
    );
  }

  return (
    <div className="plan-comparison">
      <div className="comparison__header">
        <h3>Plan Comparison</h3>
        <p className="comparison__subtitle">Compare metrics and actions between plans</p>
      </div>

      <div className="comparison__container">
        {planA && comparisonData.planA && (
          <PlanCard
            side="A"
            plan={planA}
            analysis={comparisonData.planA}
            onSelect={() => onSelectPlan?.(planA, 'A')}
            onExport={() => onExport?.(planA)}
          />
        )}

        <div className="comparison__divider" />

        {planB && comparisonData.planB && (
          <PlanCard
            side="B"
            plan={planB}
            analysis={comparisonData.planB}
            onSelect={() => onSelectPlan?.(planB, 'B')}
            onExport={() => onExport?.(planB)}
          />
        )}
      </div>

      {planA && planB && comparisonData.planA && comparisonData.planB && (
        <ComparisonMetrics analysisA={comparisonData.planA} analysisB={comparisonData.planB} />
      )}
    </div>
  );
};

/**
 * Plan analysis results
 */
interface PlanAnalysis {
  totalActions: number;
  actionsByType: Record<EditActionType | string, number>;
  averageActionDuration: number;
  pacing: number; // actions per second
  colorGradeCount: number;
  effectCount: number;
  transitionCount: number;
  textCount: number;
  audioEffectCount: number;
  estimatedViralScore: number;
}

/**
 * Analyze a plan
 */
function analyzePlan(plan: EditPlan): PlanAnalysis {
  const actions = plan.actions || [];
  const totalDuration = plan.metadata.total_duration || 1;

  const actionsByType: Record<string, number> = {};
  let totalDuration2 = 0;

  for (const action of actions) {
    actionsByType[action.type] = (actionsByType[action.type] || 0) + 1;
    totalDuration2 += action.end - action.start;
  }

  const analysis: PlanAnalysis = {
    totalActions: actions.length,
    actionsByType,
    averageActionDuration: actions.length > 0 ? totalDuration2 / actions.length : 0,
    pacing: actions.length / totalDuration,
    colorGradeCount: actionsByType['color'] || 0,
    effectCount: actionsByType['effect'] || 0,
    transitionCount: actionsByType['transition'] || 0,
    textCount: actionsByType['text'] || 0,
    audioEffectCount: actionsByType['audio'] || 0,
    estimatedViralScore: calculateViralScore(plan),
  };

  return analysis;
}

/**
 * Estimate viral score (0-100)
 */
function calculateViralScore(plan: EditPlan): number {
  const actions = plan.actions || [];
  const metadata = plan.metadata;

  let score = 50; // Base score

  // Pacing bonus
  const pacing = actions.length / (metadata.total_duration || 1);
  if (pacing > 5) score += 20; // Fast pacing
  if (pacing < 1) score -= 10; // Slow pacing

  // Action variety
  const actionTypes = new Set(actions.map((a) => a.type)).size;
  score += Math.min(actionTypes * 5, 20);

  // Specific elements
  score += (actions.filter((a) => a.type === 'transition').length * 2) / Math.max(1, actions.length);
  score += (actions.filter((a) => a.type === 'effect').length * 3) / Math.max(1, actions.length);
  score += (actions.filter((a) => a.type === 'text').length * 2) / Math.max(1, actions.length);

  // Metadata hints
  if (metadata.viral_factor) score += metadata.viral_factor * 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Plan card (single plan view)
 */
interface PlanCardProps {
  side: 'A' | 'B';
  plan: EditPlan;
  analysis: PlanAnalysis;
  onSelect: () => void;
  onExport: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ side, plan, analysis, onSelect, onExport }) => {
  return (
    <div className="plan-card">
      <div className="plan-card__header">
        <div className="plan-card__title">
          <span className="plan-card__side">Plan {side}</span>
          <span className="plan-card__duration">{plan.metadata.total_duration.toFixed(1)}s</span>
        </div>

        <div className="plan-card__viral-score">
          <div className="viral-score">
            <div className="viral-score__label">Viral</div>
            <div className="viral-score__value">{analysis.estimatedViralScore}</div>
          </div>
        </div>
      </div>

      <div className="plan-card__metrics">
        <MetricItem
          icon="✂️"
          label="Actions"
          value={analysis.totalActions.toString()}
          color="#3b82f6"
        />
        <MetricItem
          icon="⚡"
          label="Pacing"
          value={analysis.pacing.toFixed(2)}
          unit="/sec"
          color="#f97316"
        />
        <MetricItem
          icon="✨"
          label="Effects"
          value={analysis.effectCount.toString()}
          color="#ec4899"
        />
        <MetricItem
          icon="→"
          label="Transitions"
          value={analysis.transitionCount.toString()}
          color="#8b5cf6"
        />
      </div>

      {/* Action type distribution */}
      <div className="plan-card__distribution">
        <div className="distribution__label">Actions by Type</div>
        <div className="distribution__bars">
          {Object.entries(analysis.actionsByType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => (
              <div key={type} className="distribution__item">
                <div className="distribution__label-mini">{type}</div>
                <div className="distribution__bar-container">
                  <div
                    className="distribution__bar"
                    style={{
                      width: `${(count / analysis.totalActions) * 100}%`,
                    }}
                  >
                    <span className="distribution__count">{count}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Info */}
      <div className="plan-card__info">
        {plan.metadata.mode && (
          <InfoItem label="Mode" value={plan.metadata.mode} />
        )}
        {plan.metadata.style && (
          <InfoItem label="Style" value={plan.metadata.style} />
        )}
        {plan.metadata.constraint_profile && (
          <InfoItem label="Constraints" value={plan.metadata.constraint_profile} />
        )}
      </div>

      {/* Actions */}
      <div className="plan-card__actions">
        <button className="btn btn--primary" onClick={onSelect}>
          Load Plan
        </button>
        <button className="btn btn--secondary" onClick={onExport}>
          Export
        </button>
      </div>
    </div>
  );
};

/**
 * Metric item
 */
interface MetricItemProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  color?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ icon, label, value, unit, color }) => {
  return (
    <div className="metric-item">
      <div className="metric-item__icon" style={{ color: color }}>
        {icon}
      </div>
      <div className="metric-item__content">
        <div className="metric-item__label">{label}</div>
        <div className="metric-item__value">
          {value}
          {unit && <span className="metric-item__unit">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

/**
 * Info item
 */
interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => {
  return (
    <div className="info-item">
      <span className="info-item__label">{label}:</span>
      <span className="info-item__value">{value}</span>
    </div>
  );
};

/**
 * Comparison metrics
 */
interface ComparisonMetricsProps {
  analysisA: PlanAnalysis;
  analysisB: PlanAnalysis;
}

const ComparisonMetrics: React.FC<ComparisonMetricsProps> = ({ analysisA, analysisB }) => {
  const comparisons = useMemo(() => {
    return [
      {
        name: 'Total Actions',
        valueA: analysisA.totalActions,
        valueB: analysisB.totalActions,
        diff: analysisB.totalActions - analysisA.totalActions,
      },
      {
        name: 'Pacing (actions/sec)',
        valueA: analysisA.pacing.toFixed(2),
        valueB: analysisB.pacing.toFixed(2),
        diff: Number((analysisB.pacing - analysisA.pacing).toFixed(2)),
      },
      {
        name: 'Avg Duration (sec)',
        valueA: analysisA.averageActionDuration.toFixed(2),
        valueB: analysisB.averageActionDuration.toFixed(2),
        diff: Number((analysisB.averageActionDuration - analysisA.averageActionDuration).toFixed(2)),
      },
      {
        name: 'Effects',
        valueA: analysisA.effectCount,
        valueB: analysisB.effectCount,
        diff: analysisB.effectCount - analysisA.effectCount,
      },
      {
        name: 'Transitions',
        valueA: analysisA.transitionCount,
        valueB: analysisB.transitionCount,
        diff: analysisB.transitionCount - analysisA.transitionCount,
      },
      {
        name: 'Viral Score',
        valueA: analysisA.estimatedViralScore,
        valueB: analysisB.estimatedViralScore,
        diff: analysisB.estimatedViralScore - analysisA.estimatedViralScore,
      },
    ];
  }, [analysisA, analysisB]);

  return (
    <div className="comparison__metrics">
      <h4 className="comparison__metrics-title">Metrics Comparison</h4>
      <div className="comparison__table">
        <div className="table__row table__row--header">
          <div className="table__cell table__cell--metric">Metric</div>
          <div className="table__cell">Plan A</div>
          <div className="table__cell">Plan B</div>
          <div className="table__cell table__cell--diff">Difference</div>
        </div>

        {comparisons.map((comp) => (
          <div key={comp.name} className="table__row">
            <div className="table__cell table__cell--metric">{comp.name}</div>
            <div className="table__cell">{comp.valueA}</div>
            <div className="table__cell">{comp.valueB}</div>
            <div className={`table__cell table__cell--diff ${getDiffClass(comp.diff)}`}>
              {comp.diff > 0 ? '+' : ''}
              {typeof comp.diff === 'number' ? comp.diff.toFixed(0) : comp.diff}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Get class for difference indicator
 */
function getDiffClass(diff: number): string {
  if (diff > 0) return 'diff-positive';
  if (diff < 0) return 'diff-negative';
  return 'diff-neutral';
}

export default PlanComparison;
