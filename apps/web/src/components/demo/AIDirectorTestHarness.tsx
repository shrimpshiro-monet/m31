import React, { useState, useRef } from 'react';
import { type EditPlan } from '@openreel/core';

interface ClipMetadata {
  id: string;
  filename: string;
  duration: number;
  start: number;
  width?: number;
  height?: number;
}

interface GenerateResponse {
  plan?: EditPlan;
  error?: string;
  details?: string;
}

export const AIDirectorTestHarness: React.FC = () => {
  const [clipMetadatas, setClipMetadatas] = useState<ClipMetadata[]>([]);
  const [style, setStyle] = useState('hype');
  const [useModel, setUseModel] = useState(false);
  const [testModel, setTestModel] = useState(true);
  const [instruction, setInstruction] = useState('');
  const [isRefinement, setIsRefinement] = useState(false);

  const [generatedPlan, setGeneratedPlan] = useState<EditPlan | null>(null);
  const [previousPlan, setPreviousPlan] = useState<EditPlan | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Extract metadata for each file
    const newMetadatas = await Promise.all(
      files.map(async (file) => {
        const metadata = await extractClipMetadata(file);
        return metadata;
      })
    );
    setClipMetadatas((prev) => [...prev, ...newMetadatas]);
  };

  const extractClipMetadata = async (file: File): Promise<ClipMetadata> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      const onLoadedMetadata = () => {
        const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
        const width = video.videoWidth || undefined;
        const height = video.videoHeight || undefined;
        cleanup();
        resolve({
          id: `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          filename: file.name,
          duration: Math.round(duration * 100) / 100,
          start: 0,
          width,
          height,
        });
      };

      const onError = () => {
        cleanup();
        resolve({
          id: `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          filename: file.name,
          duration: 1,
          start: 0,
        });
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      video.addEventListener('error', onError, { once: true });
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setRawResponse(null);

    try {
      const url = new URL('/api/director/generate', window.location.origin);
      if (testModel) url.searchParams.set('testModel', 'true');

      const body: any = {
        clips: clipMetadatas,
        style,
        useModel: useModel ? 'github-marketplace' : null,
      };

      if (isRefinement && generatedPlan) {
        body.action = 'refine';
        body.plan = generatedPlan;
        body.instruction = instruction || 'Improve the plan and fix any validation errors.';
      }

      const resp = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = (await resp.json()) as GenerateResponse;

      if (json.error) {
        setError(`${json.error}: ${json.details || ''}`);
      } else if (json.plan) {
        setPreviousPlan(generatedPlan);
        setGeneratedPlan(json.plan);
      }

      // Log the raw response for debugging (in practice, this comes from server console)
      setRawResponse(JSON.stringify(json, null, 2));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClip = (index: number) => {
    setClipMetadatas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setClipMetadatas([]);
    setGeneratedPlan(null);
    setPreviousPlan(null);
    setRawResponse(null);
    setError(null);
    setInstruction('');
    setIsRefinement(false);
  };

  const canGenerate = clipMetadatas.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Director Test Harness</h1>
          <p className="text-slate-300">
            Upload video clips, inspect generated EditPlans, and test refinements in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Upload & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">📤 Upload Clips</h2>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,audio/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              <p className="text-xs text-slate-400 mt-2">
                Supported: MP4, WebM, MOV, WAV, MP3, etc.
              </p>
            </div>

            {/* Uploaded Clips Summary */}
            {clipMetadatas.length > 0 && (
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-lg font-semibold text-white mb-3">📋 Clips ({clipMetadatas.length})</h2>
                <div className="space-y-2">
                  {clipMetadatas.map((clip, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-slate-600 p-3 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-white truncate">{clip.filename}</p>
                        <p className="text-xs text-slate-300">
                          {clip.duration.toFixed(2)}s
                          {clip.width && clip.height && ` • ${clip.width}x${clip.height}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveClip(idx)}
                        className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Options */}
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">⚙️ Options</h2>

              <label className="block mb-3">
                <span className="text-sm text-slate-300 block mb-1">Style</span>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="e.g., hype, cinematic, minimal"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>

              <label className="block mb-3">
                <input
                  type="checkbox"
                  checked={useModel}
                  onChange={(e) => setUseModel(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-300">Use Real Model (GitHub Marketplace)</span>
              </label>

              <label className="block mb-4">
                <input
                  type="checkbox"
                  checked={testModel}
                  onChange={(e) => setTestModel(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-300">Test Mode (?testModel=true)</span>
              </label>

              {/* Refinement Mode */}
              <div className="border-t border-slate-600 pt-4">
                <label className="block mb-3">
                  <input
                    type="checkbox"
                    checked={isRefinement}
                    onChange={(e) => setIsRefinement(e.target.checked)}
                    disabled={!generatedPlan}
                    className="mr-2"
                  />
                  <span className={`text-sm ${generatedPlan ? 'text-slate-300' : 'text-slate-500'}`}>
                    Refine Existing Plan
                  </span>
                </label>

                {isRefinement && (
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g., Make cuts shorter, add more transitions, increase pacing"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
                    rows={3}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded transition"
              >
                {loading ? '⏳ Generating...' : isRefinement ? '✨ Refine Plan' : '🚀 Generate EditPlan'}
              </button>
              {clipMetadatas.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Right: Results (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <p className="text-red-100 text-sm font-mono break-words">{error}</p>
              </div>
            )}

            {/* Generated Plan */}
            {generatedPlan && (
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-lg font-semibold text-white mb-4">✅ Generated EditPlan</h2>
                <div className="bg-slate-800 rounded p-4 overflow-auto max-h-96 border border-slate-600">
                  <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(generatedPlan, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Previous Plan (for refinement comparison) */}
            {previousPlan && isRefinement && (
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-lg font-semibold text-white mb-4">📊 Previous Plan (Before Refinement)</h2>
                <div className="bg-slate-800 rounded p-4 overflow-auto max-h-64 border border-slate-600">
                  <pre className="text-xs text-yellow-300 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(previousPlan, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Raw Response */}
            {rawResponse && (
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-lg font-semibold text-white mb-4">🔍 Raw API Response</h2>
                <div className="bg-slate-800 rounded p-4 overflow-auto max-h-64 border border-slate-600">
                  <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap break-words">
                    {rawResponse}
                  </pre>
                </div>
              </div>
            )}

            {/* Metadata JSON */}
            {clipMetadatas.length > 0 && (
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-lg font-semibold text-white mb-4">📦 Clip Metadata</h2>
                <div className="bg-slate-800 rounded p-4 overflow-auto max-h-48 border border-slate-600">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(clipMetadatas, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDirectorTestHarness;
