import React, { useState } from 'react';
import { SavedMedication } from '../types';
import { Bookmark, Plus, Trash2, Clock, FileText, Sparkles } from 'lucide-react';

interface SavedCabinetProps {
  savedList: SavedMedication[];
  onAddMedication: (med: Omit<SavedMedication, 'id' | 'dateAdded'>) => void;
  onRemoveMedication: (id: string) => void;
  onAskAboutMedication: (medName: string) => void;
}

export const SavedCabinet: React.FC<SavedCabinetProps> = ({
  savedList,
  onAddMedication,
  onRemoveMedication,
  onAskAboutMedication,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddMedication({
      name: name.trim(),
      dosage: dosage.trim() || 'Unspecified dosage',
      frequency: frequency.trim() || 'As directed',
      prescribingReason: reason.trim(),
      notes: notes.trim(),
    });

    setName('');
    setDosage('');
    setFrequency('');
    setReason('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="bg-[#080C12] text-slate-100 p-6 rounded-2xl shadow-xl mb-6 border border-slate-800 relative overflow-hidden flex items-center justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl shadow-inner font-bold">
            <Bookmark className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">My Rx Cabinet & Tracker</h2>
            <p className="text-sm text-slate-400 mt-1">
              Keep a clean, private inventory of your active medications, dosages, schedules, and clinical notes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition shadow-[0_0_12px_rgba(0,209,255,0.3)] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Add Medication Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 border border-cyan-500/30 shadow-2xl mb-6 animate-fadeIn">
          <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add New Medication to My Cabinet</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lisinopril, Metformin, Vitamin D3"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm bg-slate-900 text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                Strength / Dosage
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 10mg, 500mg, 1000 IU"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm bg-slate-900 text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                Frequency / Schedule
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Once daily in morning, Twice daily with meals"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm bg-slate-900 text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                Prescribing Reason / Condition
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. High blood pressure, Type 2 diabetes"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm bg-slate-900 text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
              Personal Notes or Doctor Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take with full glass of water. Avoid taking before bedtime."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm bg-slate-900 text-slate-100 placeholder:text-slate-600"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm shadow-md"
            >
              Save Medication
            </button>
          </div>
        </form>
      )}

      {/* Medication List */}
      {savedList.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 shadow-xl">
          <div className="w-16 h-16 bg-slate-900 text-cyan-400 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Your Cabinet is Currently Empty</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Keep track of your active medications and supplements for quick interaction checking and doctor consultations.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-cyan-500 text-slate-950 font-extrabold rounded-xl text-sm hover:bg-cyan-400 inline-flex items-center space-x-2 transition shadow-[0_0_12px_rgba(0,209,255,0.3)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Your First Medication</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedList.map((med) => (
            <div
              key={med.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/40 transition shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{med.name}</h3>
                    <p className="text-xs font-mono font-semibold text-cyan-400 mt-0.5">{med.dosage}</p>
                  </div>
                  <button
                    onClick={() => onRemoveMedication(med.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                    title="Remove from cabinet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Schedule: <strong className="text-slate-100">{med.frequency}</strong></span>
                  </div>

                  {med.prescribingReason && (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>For: <strong className="text-slate-100">{med.prescribingReason}</strong></span>
                    </div>
                  )}

                  {med.notes && (
                    <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-slate-300 italic">
                      "{med.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">Added {med.dateAdded}</span>
                <button
                  onClick={() => onAskAboutMedication(med.name)}
                  className="text-xs font-bold text-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Ask MediBot</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

