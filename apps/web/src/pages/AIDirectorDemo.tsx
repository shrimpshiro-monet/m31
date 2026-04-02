import React, { useState, useRef } from 'react';
import { Upload, Play, Zap, RefreshCw, Copy, Check } from 'lucide-react';

interface Clip {
  id: string;
  filename: string;
  duration: number;
  start?: number;
}

interface EditPlan {
  id: string;
  clips: Clip[];
  actions: any[];
  metadata: any;
}

const AIDirectorDemo: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [style, setStyle] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<EditPlan | null>(null);
  const [instruction, setInstruction] = useState('');
  const [refining, setRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newClips: Clip[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Try to extract duration from video metadata
      let duration = 0;
      try {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          duration = video.duration;
          URL.revokeObjectURL(video.src);
        };
      } catch (err) {
        // Fallback if metadata extraction fails
        duration = 0;
      }

      const clip: Clip = {
        id: `clip-${Date.now()}-${i}`,
        filename: file.name,
        duration: duration > 0 ? duration : 30, // Default 30s if can't extract
        start: 0,
      };
      newClips.push(clip);
    }

    setClips([...clips, ...newClips]);
  };

  const generatePlan = async () => {
    if (clips.length === 0) {
      alert('Please upload at least one clip');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/director/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clips, style }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');
      const data = await response.json();
      setPlan(data.plan);
    } catch (error) {
      alert('Error generating plan: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const refinePlan = async () => {
    if (!plan || !instruction.trim()) {
      alert('Please enter a refinement instruction');
      return;
    }

    setRefining(true);
    try {
      const response = await fetch('http://localhost:3000/api/director/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips,
          style,
          action: 'refine',
          plan,
          instruction,
        }),
      });

      if (!response.ok) throw new Error('Failed to refine plan');
      const data = await response.json();
      setPlan(data.plan);
      setInstruction('');
    } catch (error) {
      alert('Error refining plan: ' + error);
    } finally {
      setRefining(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeClip = (id: string) => {
    setClips(clips.filter(c => c.id !== id));
  };

  const styles = ['balanced', 'cinematic', 'energetic', 'minimal', 'dynamic'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">AI Director</h1>
          </div>
          <p className="text-purple-200 text-lg">Generate professional video editing plans with AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Upload Clips
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors mb-4"
              >
                Select Videos
              </button>

              {clips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-purple-300 font-semibold">{clips.length} clips selected</p>
                  {clips.map(clip => (
                    <div
                      key={clip.id}
                      className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{clip.filename}</p>
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={clip.duration}
                        onChange={(e) => {
                          const newClips = clips.map(c =>
                            c.id === clip.id ? { ...c, duration: parseFloat(e.target.value) || 1 } : c
                          );
                          setClips(newClips);
                        }}
                        className="w-16 px-2 py-1 bg-slate-600 border border-purple-500/30 rounded text-white text-xs text-center focus:outline-none focus:border-purple-500"
                        placeholder="duration"
                      />
                      <span className="text-xs text-purple-300">s</span>
                      <button
                        onClick={() => removeClip(clip.id)}
                        className="text-red-400 hover:text-red-300 text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Style Selection */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Editing Style</h2>
              <div className="grid grid-cols-2 gap-2">
                {styles.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`py-2 px-3 rounded-lg transition-all text-sm font-medium capitalize ${
                      style === s
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePlan}
              disabled={clips.length === 0 || loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Plan
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Plan Display */}
          <div className="lg:col-span-2 space-y-6">
            {plan && (
              <>
                {/* Plan Overview */}
                <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Generated Plan</h2>
                      <p className="text-sm text-purple-300 mt-1">ID: {plan.id}</p>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy JSON
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-purple-400 font-semibold">Generated By</p>
                      <p className="text-sm text-white capitalize">{plan.metadata.generated_by}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-purple-400 font-semibold">Clips</p>
                      <p className="text-sm text-white">{plan.clips.length}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-purple-400 font-semibold">Actions</p>
                      <p className="text-sm text-white">{plan.actions.length}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-purple-400 font-semibold">Created</p>
                      <p className="text-sm text-white text-opacity-70">
                        {new Date(plan.metadata.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Preview */}
                <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Actions ({plan.actions.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {plan.actions.map((action, idx) => (
                      <div key={action.id} className="bg-slate-700/50 p-3 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block w-6 h-6 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-purple-300 capitalize">{action.type}</span>
                          <span className="text-purple-400 ml-auto">
                            {action.start}s - {action.end || 'end'}s
                          </span>
                        </div>
                        {Object.keys(action.params).length > 0 && (
                          <div className="text-xs text-purple-200 ml-8">
                            {Object.entries(action.params).map(([k, v]) => (
                              <div key={k}>
                                {k}: {String(v)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refinement Section */}
                <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-400" />
                    Refine Plan
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={instruction}
                      onChange={e => setInstruction(e.target.value)}
                      placeholder="e.g., 'Add more transitions' or 'Make it faster'"
                      className="flex-1 px-4 py-2 bg-slate-700 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                      onKeyPress={e => e.key === 'Enter' && refinePlan()}
                    />
                    <button
                      onClick={refinePlan}
                      disabled={!instruction.trim() || refining}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      {refining ? 'Refining...' : 'Refine'}
                    </button>
                  </div>
                </div>

                {/* Raw JSON */}
                <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Raw JSON</h3>
                  <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-purple-300 font-mono max-h-64 overflow-y-auto">
                    {JSON.stringify(plan, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {!plan && clips.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-12 text-center">
                <Play className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
                <p className="text-purple-300">Click "Generate Plan" to create an EditPlan</p>
              </div>
            )}

            {!plan && clips.length === 0 && (
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-xl p-12 text-center">
                <Upload className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
                <p className="text-purple-300">Upload clips to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDirectorDemo;
