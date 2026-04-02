import React, { useState } from 'react';
import {
  getBeatDetectionEngine,
  getBeatSyncEngine,
  DEFAULT_BEAT_SYNC_CONFIG,
  type BeatAnalysisResult,
} from '@openreel/core';

type Clip = { id: string; filename: string; duration: number };

const FEATURES = [
  'AI Director',
  'Beat Sync',
  'Auto Grade',
  'Transitions',
  'Templates',
  'Style Learning',
];

export const AIDirectorDemo: React.FC = () => {
  const [active, setActive] = useState<string>(FEATURES[0]);

  // AI Director state
  const [clipsText, setClipsText] = useState('[{"id":"c1","filename":"a.mp4","duration":3}]');
  const [style, setStyle] = useState('hype');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [useGithubModel, setUseGithubModel] = useState(false);

  const [uploadedClip, setUploadedClip] = useState<File | null>(null);
  const [autoGenerateOnUpload, setAutoGenerateOnUpload] = useState(true);

  // Beat sync state
  const [beatAnalysis, setBeatAnalysis] = useState<BeatAnalysisResult | null>(null);
  const [beatLoading, setBeatLoading] = useState(false);
  const [syncClipsText, setSyncClipsText] = useState('[{"id":"c1","startTime":0,"duration":3}]');
  const [syncResult, setSyncResult] = useState<any>(null);

  const callGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      let clips = JSON.parse(clipsText) as Clip[];
      // If an uploaded clip exists and auto-generation is enabled, ensure clipsText already reflects the real metadata.
      // Otherwise fall back to clipsText as provided by the user.
      const resp = await fetch('/api/director/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clips, style, useModel: useGithubModel ? 'github-marketplace' : null }),
      });
      const json = await resp.json();
      setResult(json);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">monet. Feature Demo</h2>

      <div className="flex space-x-2 mb-4">
        {FEATURES.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`px-3 py-1 rounded ${active === f ? 'bg-primary text-white' : 'bg-surface text-text-primary'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="border rounded p-4 bg-white">
        {active === 'AI Director' && (
          <div>
            <h3 className="text-xl mb-2">AI Director</h3>
            <label className="block mb-2">Clips JSON</label>
            <textarea className="w-full h-28 p-2 border" value={clipsText} onChange={(e) => setClipsText(e.target.value)} />
            <label className="block mt-3 mb-2">Style</label>
            <input className="border p-2 w-48" value={style} onChange={(e) => setStyle(e.target.value)} />
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input type="checkbox" className="mr-2" checked={useGithubModel} onChange={(e) => setUseGithubModel(e.target.checked)} />
                      Use GitHub models marketplace
                    </label>
                  </div>

                  <div className="mt-3">
                    <label className="block mb-1">Upload clip (optional)</label>
                      <input type="file" accept="video/*,audio/*" onChange={async (e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (!f) { setUploadedClip(null); return; }
                        setUploadedClip(f);
                        // If auto-generate is enabled, extract duration and create a simple EditPlan JSON
                        if (autoGenerateOnUpload) {
                          try {
                            const plan = await generateClientHeuristicPlanFromFile(f);
                            setClipsText(JSON.stringify(plan.clips, null, 2));
                          } catch (err) {
                            // leave clipsText as-is on error
                            console.warn('failed to auto-generate clip metadata', err);
                          }
                        }
                      }} />
                      {uploadedClip && <div className="text-sm mt-1">Uploaded: {uploadedClip.name} ({(uploadedClip.size/1024|0)} KB)</div>}
                      <div className="mt-2 text-sm">
                        <label className="inline-flex items-center">
                          <input type="checkbox" className="mr-2" checked={autoGenerateOnUpload} onChange={(e) => setAutoGenerateOnUpload(e.target.checked)} />
                          Auto-generate clip JSON on upload
                        </label>
                      </div>
                  </div>
            <div className="mt-4">
              <button className="px-4 py-2 bg-primary text-white rounded" onClick={callGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate EditPlan'}
              </button>
            </div>
            <pre className="mt-4 max-h-96 overflow-auto bg-surface p-3">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {active === 'Beat Sync' && (
          <div>
            <h3 className="text-xl mb-2">Beat Sync</h3>
            <p className="text-sm text-text-secondary mb-3">Upload audio, detect beats, and snap clips to beats.</p>

            <div className="mb-3">
              <label className="block mb-1">Audio file</label>
              <input type="file" accept="audio/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBeatAnalysis(null);
                setBeatLoading(true);
                try {
                  const engine = getBeatDetectionEngine();
                  const analysis = await engine.analyzeFromBlob(f);
                  setBeatAnalysis(analysis as BeatAnalysisResult);
                } catch (err) {
                  setBeatAnalysis({ bpm: 0, confidence: 0, beats: [], duration: 0, downbeats: [] } as any);
                } finally {
                  setBeatLoading(false);
                }
              }} />
            </div>

            <div className="mb-3">
              <label className="block mb-1">Clips JSON (for syncing)</label>
              <textarea className="w-full h-24 p-2 border" value={syncClipsText} onChange={(e) => setSyncClipsText(e.target.value)} />
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <button className="px-3 py-2 bg-primary text-white rounded" onClick={async () => {
                // compute synced timings
                let clips: any[] = [];
                try {
                  clips = JSON.parse(syncClipsText) as any[];
                } catch (err) {
                  setSyncResult({ error: 'invalid_clips_json' });
                  return;
                }

                if (!beatAnalysis || !beatAnalysis.beats || beatAnalysis.beats.length === 0) {
                  setSyncResult({ error: 'no_beat_analysis' });
                  return;
                }

                const clipInfos = clips.map((c: any) => ({ id: c.id ?? c.clipId ?? ('clip-' + Math.random().toString(36).slice(2,8)), startTime: typeof c.startTime === 'number' ? c.startTime : (typeof c.start === 'number' ? c.start : 0), duration: typeof c.duration === 'number' ? c.duration : c.length ?? 1, trackId: c.trackId ?? 'v1' }));

                const engine = getBeatSyncEngine();
                try {
                  const timings = engine.calculateSyncedTimings(clipInfos, beatAnalysis, 0, DEFAULT_BEAT_SYNC_CONFIG);
                  setSyncResult({ timings, bpm: beatAnalysis.bpm });
                } catch (err) {
                  setSyncResult({ error: String(err) });
                }
              }}>Compute Sync</button>
              <button className="px-3 py-2 bg-surface text-text-primary rounded" onClick={() => { setSyncResult(null); setSyncClipsText('[{"id":"c1","startTime":0,"duration":3}]'); }}>Reset</button>
            </div>

            <div>
              {beatLoading ? <div>Analyzing audio...</div> : (
                beatAnalysis ? (
                  <div>
                    <div className="mb-2">BPM: {beatAnalysis.bpm} — Beats detected: {beatAnalysis.beats.length} — Confidence: {Math.round((beatAnalysis.confidence||0)*100)}%</div>
                    <div className="mb-2 text-sm text-text-secondary">First 20 beats: {beatAnalysis.beats.slice(0,20).map(b=>b.time.toFixed(3)).join(', ')}</div>
                  </div>
                ) : <div className="text-sm text-text-secondary">No analysis yet</div>
              )}
            </div>

            <pre className="mt-4 max-h-64 overflow-auto bg-surface p-3">{JSON.stringify(syncResult, null, 2)}</pre>
          </div>
        )}

        {active === 'Auto Grade' && (
          <div>
            <h3 className="text-xl mb-2">Auto Grade (placeholder)</h3>
            <p className="text-sm text-text-secondary">Apply one-click color grades and preview LUTs. UI placeholder for now.</p>
          </div>
        )}

        {active === 'Transitions' && (
          <div>
            <h3 className="text-xl mb-2">Transitions (placeholder)</h3>
            <p className="text-sm text-text-secondary">Test transition presets and timing. UI placeholder for now.</p>
          </div>
        )}

        {active === 'Templates' && (
          <div>
            <h3 className="text-xl mb-2">Templates (placeholder)</h3>
            <p className="text-sm text-text-secondary">Save and load template effect chains. UI placeholder for now.</p>
          </div>
        )}

        {active === 'Style Learning' && (
          <div>
            <h3 className="text-xl mb-2">Style Learning (placeholder)</h3>
            <p className="text-sm text-text-secondary">View and export user style profiles. UI placeholder for now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDirectorDemo;

// Helper: create a minimal heuristic plan from an uploaded media File by measuring duration using a transient video element.
async function generateClientHeuristicPlanFromFile(file: File) {
  const url = URL.createObjectURL(file);
  const duration = await new Promise<number>((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    const cleanup = () => { URL.revokeObjectURL(url); video.remove(); };
    video.addEventListener('loadedmetadata', () => {
      const d = isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : 1;
      cleanup();
      resolve(d);
    });
  video.addEventListener('error', () => { cleanup(); reject(new Error('could not read media duration')); });
  });

  const clipId = 'uploaded';
  const clip = { id: clipId, filename: file.name, duration, start: 0 };
  // Create simple cuts every ~1/3 of duration and a trailing transition
  const actions: any[] = [];
  const seg = Math.max(1, Math.round(duration / 3));
  for (let t = 0; t < duration; t += seg) {
    actions.push({ id: `act-${t}`, type: 'cut', params: { clipId }, start: t, end: Math.min(duration, t + seg) });
  }
  actions.push({ id: `trans-1`, type: 'transition', params: { style: 'crossfade', duration: 0.3 }, start: 0 });

  return { id: `plan-${Date.now().toString(36)}`, clips: [clip], actions, metadata: { generated_by: 'client-heuristic' } };
}
