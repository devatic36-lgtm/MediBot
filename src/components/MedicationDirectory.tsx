import React, { useState } from 'react';
import { COMMON_MEDICATIONS } from '../data/medications';
import { Search, Sparkles, AlertTriangle, ArrowRight, Tag } from 'lucide-react';

interface MedicationDirectoryProps {
  onAskAboutMedication: (medName: string, prompt?: string) => void;
  onSaveToCabinet?: (medName: string, dosage: string) => void;
}

export const MedicationDirectory: React.FC<MedicationDirectoryProps> = ({
  onAskAboutMedication,
  onSaveToCabinet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Unique medication classes
  const classes = ['all', ...Array.from(new Set(COMMON_MEDICATIONS.map((m) => m.class)))];

  const filteredMeds = COMMON_MEDICATIONS.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.brandNames.some((b) => b.toLowerCase().includes(searchTerm.toLowerCase())) ||
      med.primaryUse.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || med.class === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Directory Banner */}
      <div className="bg-[#080C12] text-slate-100 p-6 rounded-2xl shadow-xl mb-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Essential Rx Reference Directory</h2>
          <p className="text-sm text-slate-400 mt-1">
            Browse evidence-based clinical profiles for widely prescribed medications and OTC treatments.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search generic, brand, condition..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Class Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center space-x-1">
          <Tag className="w-3.5 h-3.5 text-cyan-400" />
          <span>Category:</span>
        </span>
        {classes.map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedClass === cls
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,209,255,0.3)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cls === 'all' ? 'All Classes' : cls}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMeds.map((med) => (
          <div
            key={med.id}
            className="glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-cyan-500/40 transition shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-white">{med.name}</h3>
                    <span className="text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      {med.class}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Brand Names: {med.brandNames.join(', ')}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <span className="font-bold text-cyan-400 block mb-0.5">Primary Clinical Indication:</span>
                  <span className="text-slate-300">{med.primaryUse}</span>
                </div>

                <div>
                  <span className="font-bold text-slate-200">Typical Adult Dosage: </span>
                  <span className="text-slate-300">{med.typicalDosage}</span>
                </div>

                <div>
                  <span className="font-bold text-slate-200">Common Side Effects: </span>
                  <span className="text-slate-300">{med.commonSideEffects.join(', ')}</span>
                </div>

                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-200 text-[11px] flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong className="text-amber-300">Clinical Caution:</strong> {med.keyWarnings}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between space-x-2">
              {onSaveToCabinet && (
                <button
                  onClick={() => onSaveToCabinet(med.name, med.typicalDosage)}
                  className="text-xs font-semibold text-slate-400 hover:text-cyan-400 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
                >
                  + Add to Cabinet
                </button>
              )}

              <button
                onClick={() =>
                  onAskAboutMedication(
                    med.name,
                    `Please provide a comprehensive clinical briefing on ${med.name} (${med.brandNames.join(', ')}), including detailed pharmacokinetics, exact dosage schedules, side effect management, and key drug interactions.`
                  )
                }
                className="text-xs font-bold text-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ask MediBot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

