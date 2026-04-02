import React, { useState, useRef } from 'react';
import { Upload, Play, Zap, RefreshCw, Copy, Check, Trash2, Code, BookOpen } from 'lucide-react';

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

interface Tab {
  id: 'style' | 'custom' | 'library';
  label: string;
  icon: React.ReactNode;
}

const PROMPT_LIBRARY = {
  music: {
    edm: `You are editing a high-energy EDM music video.
Techniques:
- Fast, rhythmic cuts synchronized with beats
- Dramatic zoom transitions on bass drops
- Flash/strobe effects during peaks
- Bold color grading (neon, vibrant saturation)
- Heavy visual effects and transitions
- Build intensity throughout

Create an EditPlan that's visceral, energetic, and synced to intense music.`,
    hiphop: `You are editing a hip-hop music video.
Techniques:
- Syncopated cuts matching rap flow
- Street-style transitions (cuts, wipes)
- Swag and attitude in pacing
- Stylized color grading
- Performance focus with dynamic cuts
- Text overlays for emphasis

Create an EditPlan that captures movement, style, and musical flow.`,
    acoustic: `You are editing an acoustic/folk music video.
Techniques:
- Longer shots to capture performance
- Smooth, subtle transitions (dissolves, fades)
- Natural color grading
- Minimal effects - let the music shine
- Performance-focused cutting
- Intimate pacing

Create an EditPlan that feels warm, authentic, and intimate.`,
  },
  content: {
    vlog: `You are editing a daily vlog for social media.
Techniques:
- Quick, punchy cuts (3-5 second segments)
- Jump cuts for comedic timing
- Meme-style transitions and effects
- B-roll integrations
- Text overlays and graphics
- Trend-appropriate effects
- Fast-paced but not chaotic

Create an EditPlan that's engaging, shareable, and keeps viewers watching.`,
    podcast: `You are editing a podcast with B-roll/video supplement.
Techniques:
- Cut on speaker changes
- B-roll that illustrates points
- Lower thirds for names/topics
- Subtle transitions that don't distract
- Audio-sync on key moments
- Clear visual hierarchy

Create an EditPlan that supports the audio without overwhelming it.`,
  },
  commercial: {
    luxury: `You are editing a luxury brand commercial.
Techniques:
- Smooth, sophisticated transitions
- Premium color grading with high-end LUTs
- Long, confident shots
- Strategic product reveals
- Elegant effects that add prestige
- Building pacing to key moments

Create an EditPlan that exudes quality, exclusivity, and aspiration.`,
    startup: `You are editing a startup/tech product commercial.
Techniques:
- Dynamic, modern transitions
- Fast-paced but clear messaging
- Clean color grading
- Feature-focused cuts
- Motion graphics integration
- Building energy throughout

Create an EditPlan that feels innovative, energetic, and professional.`,
  },
};

const AIDirectorEnhanced: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<EditPlan | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'style' | 'custom' | 'library'>('style');
  const [style, setStyle] = useState('balanced');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<keyof typeof PROMPT_LIBRARY>('music');
  const [selectedTemplate, setSelectedTemplate] = useState('edm');
  
  // Refinement
  const [instruction, setInstruction] = useState('');
  const [refining, setRefining] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newClips: Clip[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration * 10) / 10;
          newClips.push({
            id: `clip-${Date.now()}-${i}`,
            filename: file.name,
            duration,
            start: 0,
          });
          URL.revokeObjectURL(url);
          resolve();
        };
        
        video.onerror = () => {
          newClips.push({
            id: `clip-${Date.now()}-${i}`,
            filename: file.name,
            duration: 30, // Default
            start: 0,
          });
          URL.revokeObjectURL(url);
          resolve();
        };
      });
    }

    setClips([...clips, ...newClips]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeClip = (id: string) => {
    setClips(clips.filter(c => c.id !== id));
  };

  const updateClipDuration = (id: string, duration: number) => {
    setClips(clips.map(c => (c.id === id ? { ...c, duration } : c)));
  };

  const generatePlan = async () => {
    if (clips.length === 0) return;

    setLoading(true);
    try {
      let endpoint = 'http://localhost:3000/api/director/generate-custom';
      let body: any = { clips };

      if (activeTab === 'style') {
        // Convert style to a prompt description
        const stylePrompts: Record<string, string> = {
          balanced: 'Create a balanced edit with mixed cuts and transitions that flow naturally. Use a moderate pacing with varied shot lengths.',
          energetic: 'Create a fast-paced, high-energy edit with quick cuts and dynamic transitions. Push the tempo and excitement.',
          cinematic: 'Create a cinematic, slow-paced edit with longer shots and smooth transitions. Focus on storytelling and atmosphere.',
          minimal: 'Create a minimal edit with only essential cuts. Keep it clean and simple without unnecessary effects.',
          dynamic: 'Create a dynamic edit with varied pacing, mixing slow moments with fast sections. Use interesting transitions and effects.',
        };
        body.customPrompt = stylePrompts[style] || stylePrompts.balanced;
      } else if (activeTab === 'custom') {
        if (!customPrompt.trim()) {
          alert('Please enter a custom prompt');
          setLoading(false);
          return;
        }
        body.customPrompt = customPrompt;
      } else if (activeTab === 'library') {
        const templates = PROMPT_LIBRARY[selectedLibrary] as any;
        body.customPrompt = templates[selectedTemplate];
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Generation failed');
      }

      const data = await response.json();
      setPlan(data.plan);
    } catch (error) {
      console.error('Generation failed:', error);
      alert(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const refinePlan = async () => {
    if (!plan || !instruction) return;

    setRefining(true);
    try {
      const response = await fetch('http://localhost:3000/api/director/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips,
          action: 'refine',
          plan,
          instruction,
        }),
      });

      const data = await response.json();
      setPlan(data.plan);
      setInstruction('');
    } catch (error) {
      console.error('Refinement failed:', error);
      alert('Failed to refine plan');
    } finally {
      setRefining(false);
    }
  };

  const copyToClipboard = () => {
    if (plan) {
      navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs: Tab[] = [
    { id: 'style', label: 'Style Presets', icon: <Zap size={18} /> },
    { id: 'custom', label: 'Custom Prompt', icon: <Code size={18} /> },
    { id: 'library', label: 'Template Library', icon: <BookOpen size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">🎬 AI Director</h1>
          <p className="text-xl text-slate-400">Generate professional video editing plans powered by AI</p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Left: Upload & Controls */}
          <div className="col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={20} />
                Upload Video
              </h2>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 hover:bg-slate-700/50 transition"
              >
                <div className="text-slate-400">
                  <p className="font-semibold">Click to upload</p>
                  <p className="text-sm">or drag and drop</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Clips List */}
              {clips.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300">Uploaded Clips ({clips.length})</h3>
                  {clips.map(clip => (
                    <div key={clip.id} className="bg-slate-700/50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-white truncate flex-1">{clip.filename}</p>
                        <button
                          onClick={() => removeClip(clip.id)}
                          className="text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Duration (s):</label>
                        <input
                          type="number"
                          value={clip.duration}
                          onChange={(e) => updateClipDuration(clip.id, parseFloat(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-600 text-white rounded text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle: Tabs & Options */}
          <div className="col-span-1">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-700">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-4">
                {/* Style Presets Tab */}
                {activeTab === 'style' && (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Select Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 hover:border-slate-500 transition"
                    >
                      <option value="balanced">Balanced - Mixed cuts & transitions</option>
                      <option value="energetic">Energetic - Fast-paced & dynamic</option>
                      <option value="cinematic">Cinematic - Slow & storytelling</option>
                      <option value="minimal">Minimal - Essential cuts only</option>
                      <option value="dynamic">Dynamic - Varied pacing</option>
                    </select>
                  </div>
                )}

                {/* Custom Prompt Tab */}
                {activeTab === 'custom' && (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Your Prompt</label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Describe how you want the video edited... e.g., 'Edit a high-energy music video with fast cuts and dramatic zoom transitions'"
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none resize-none h-32"
                    />
                    <p className="text-xs text-slate-400 mt-2">Be specific about genre, pacing, effects, and mood</p>
                  </div>
                )}

                {/* Library Tab */}
                {activeTab === 'library' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Category</label>
                      <select
                        value={selectedLibrary}
                        onChange={(e) => {
                          setSelectedLibrary(e.target.value as keyof typeof PROMPT_LIBRARY);
                          setSelectedTemplate(Object.keys(PROMPT_LIBRARY[e.target.value as keyof typeof PROMPT_LIBRARY])[0]);
                        }}
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                      >
                        {Object.entries(PROMPT_LIBRARY).map(([key]) => (
                          <option key={key} value={key}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Template</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                      >
                        {Object.keys(PROMPT_LIBRARY[selectedLibrary]).map(key => (
                          <option key={key} value={key}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-700/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-xs text-slate-400 whitespace-pre-wrap">
                        {PROMPT_LIBRARY[selectedLibrary][selectedTemplate as keyof typeof PROMPT_LIBRARY[keyof typeof PROMPT_LIBRARY]]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="p-6 border-t border-slate-700">
                <button
                  onClick={generatePlan}
                  disabled={clips.length === 0 || loading || (activeTab === 'custom' && !customPrompt)}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  {loading ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="col-span-1">
            {plan ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4 max-h-[800px] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Generated Plan</h3>
                  <button
                    onClick={copyToClipboard}
                    className="text-slate-400 hover:text-blue-400 transition flex items-center gap-2"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                {/* Plan Stats */}
                <div className="grid grid-cols-2 gap-3 bg-slate-700/50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">Total Actions</p>
                    <p className="text-2xl font-bold text-blue-400">{plan.actions?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Generated By</p>
                    <p className="text-sm font-semibold text-white">{plan.metadata?.generated_by || 'AI'}</p>
                  </div>
                </div>

                {/* Actions List */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Actions</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {plan.actions?.slice(0, 10).map((action, idx) => (
                      <div key={idx} className="bg-slate-700/50 p-2 rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-blue-400 capitalize">{action.type}</span>
                          <span className="text-slate-400">{action.start?.toFixed(1)}s - {action.end?.toFixed(1)}s</span>
                        </div>
                        {action.params && Object.keys(action.params).length > 0 && (
                          <p className="text-slate-400 text-xs mt-1">
                            {Object.entries(action.params)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                    {plan.actions && plan.actions.length > 10 && (
                      <p className="text-xs text-slate-400 text-center py-2">... and {plan.actions.length - 10} more</p>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                {plan.metadata?.before_stats && plan.metadata?.after_stats && (
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-white mb-2">Refinement Metrics</h4>
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-slate-400">Pacing:</span>
                        <span className="text-slate-300 ml-2">{plan.metadata.before_stats.pacing} → {plan.metadata.after_stats.pacing}</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Cuts:</span>
                        <span className="text-slate-300 ml-2">{plan.metadata.before_stats.cutCount} → {plan.metadata.after_stats.cutCount}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Refinement Section */}
                <div className="border-t border-slate-700 pt-4">
                  <label className="block text-sm font-semibold text-white mb-2">Refine Further</label>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g., 'Make it faster' or 'Add more effects'"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none resize-none h-20 text-sm"
                  />
                  <button
                    onClick={refinePlan}
                    disabled={!instruction || refining}
                    className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw size={16} />
                    {refining ? 'Refining...' : 'Refine Plan'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                <div className="text-slate-400">
                  <Play size={32} className="mx-auto mb-4 opacity-50" />
                  <p className="font-semibold mb-2">No plan generated yet</p>
                  <p className="text-sm">Upload clips and click "Generate Plan" to create an AI-powered editing plan</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-3 gap-6">
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-2">📋 Style Presets</h3>
            <p className="text-sm text-slate-400">Use predefined editing styles optimized for different purposes</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-2">✍️ Custom Prompts</h3>
            <p className="text-sm text-slate-400">Write your own prompts for complete creative control</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-2">📚 Template Library</h3>
            <p className="text-sm text-slate-400">Browse professional templates for any content type</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDirectorEnhanced;
