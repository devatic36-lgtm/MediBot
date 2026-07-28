import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2, AlertOctagon, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getOfflineClinicalResponse } from '../data/clinicalEngine';

interface InteractionCheckerProps {
  onAskMediBot: (prompt: string, mode: 'interaction') => void;
}

export const InteractionChecker: React.FC<InteractionCheckerProps> = ({ onAskMediBot }) => {
  const [drugs, setDrugs] = useState<string[]>(['Ibuprofen', 'Lisinopril']);
  const [newDrugInput, setNewDrugInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ text: string; sources?: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddDrug = () => {
    if (!newDrugInput.trim()) return;
    const trimmed = newDrugInput.trim();
    if (!drugs.map(d => d.toLowerCase()).includes(trimmed.toLowerCase())) {
      setDrugs([...drugs, trimmed]);
    }
    setNewDrugInput('');
  };

  const handleRemoveDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const handleQuickAdd = (drugName: string) => {
    if (!drugs.map(d => d.toLowerCase()).includes(drugName.toLowerCase())) {
      setDrugs([...drugs, drugName]);
    }
  };

  const handleCheckInteractions = async () => {
    if (drugs.length < 2) {
      setError('Please enter at least 2 medications to check for interactions.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/check-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs }),
      });

      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          text: getOfflineClinicalResponse(`Check interactions between ${drugs.join(', ')}`, 'en', 'interaction'),
          groundingSources: [],
        };
      }

      if (!response.ok && data?.error) {
        throw new Error(data.error);
      }

      setResult({
        text: data?.text || getOfflineClinicalResponse(`Check interactions between ${drugs.join(', ')}`, 'en', 'interaction'),
        sources: data?.groundingSources || [],
      });
    } catch (err: any) {
      setResult({
        text: getOfflineClinicalResponse(`Check interactions between ${drugs.join(', ')}`, 'en', 'interaction'),
        sources: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="bg-[#080C12] text-slate-100 p-6 rounded-2xl shadow-xl mb-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl shadow-inner font-bold">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Clinical Drug Interaction Checker</h2>
            <p className="text-sm text-slate-400 mt-1">
              Check potential pharmacodynamic & pharmacokinetic interactions between 2 or more prescription or over-the-counter drugs, supplements, and food.
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 mb-6">
        <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-3">
          1. Add Medications to Compare ({drugs.length})
        </h3>

        {/* Drug Pills List */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[48px] p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          {drugs.map((drug, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-2 bg-slate-900 text-cyan-400 border border-cyan-500/30 text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm"
            >
              <span>{drug}</span>
              <button
                onClick={() => handleRemoveDrug(index)}
                className="hover:text-rose-400 text-slate-500 p-0.5 rounded transition"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {drugs.length === 0 && (
            <span className="text-slate-500 text-sm italic flex items-center">
              No medications added yet. Type a drug name below to begin.
            </span>
          )}
        </div>

        {/* Add Input Bar */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newDrugInput}
            onChange={(e) => setNewDrugInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDrug())}
            placeholder="e.g. Metformin, Omeprazole, Grapefruit juice, Aspirin..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm bg-slate-900 text-slate-100 placeholder:text-slate-600"
          />
          <button
            onClick={handleAddDrug}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-semibold rounded-xl text-sm flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Drug</span>
          </button>
        </div>

        {/* Quick Add Suggestions */}
        <div className="text-xs text-slate-400 flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="font-semibold text-slate-300">Popular pairs:</span>
          {['Aspirin', 'Warfarin', 'Acetaminophen', 'Sertraline', 'Grapefruit Juice'].map((item) => (
            <button
              key={item}
              onClick={() => handleQuickAdd(item)}
              className="px-2.5 py-1 bg-slate-800/60 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/50 rounded-md transition text-xs font-medium"
            >
              + {item}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 text-rose-300 text-xs rounded-xl border border-rose-500/30 flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 border-t border-slate-800/80 pt-4 flex justify-end">
          <button
            onClick={handleCheckInteractions}
            disabled={isAnalyzing || drugs.length < 2}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-lg transition ${
              isAnalyzing || drugs.length < 2
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(0,209,255,0.3)]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Evaluating Interactions...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Run Clinical Interaction Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Interaction Report</h3>
            </div>
            <button
              onClick={() =>
                onAskMediBot(
                  `I checked interactions between ${drugs.join(', ')}. Can you elaborate on practical precautions or timing schedules I should follow?`,
                  'interaction'
                )
              }
              className="text-xs font-bold text-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
            >
              <span>Discuss with MediBot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed medibot-markdown">
            <ReactMarkdown>{result.text}</ReactMarkdown>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Evidence Grounding Citations:</span>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((s: any, idx: number) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="citation-tag hover:bg-cyan-500/25 transition"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

