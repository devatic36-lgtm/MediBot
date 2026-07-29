import React, { useState } from 'react';
import { COMMON_MEDICATIONS } from '../data/medications';
import { MedicationQuickRef } from '../types';
import {
  Search,
  Sparkles,
  Pill,
  Info,
  MessageSquarePlus,
  X,
  ShieldAlert,
  Clock,
  Database,
  Filter,
  CheckCircle2,
  BookOpen,
  Volume2,
  VolumeX
} from 'lucide-react';

interface MediBaseProps {
  language: 'en' | 'ar';
  onAddMedicationToChat: (medName: string, promptText?: string) => void;
}

export const MediBase: React.FC<MediBaseProps> = ({
  language,
  onAddMedicationToChat,
}) => {
  const isAr = language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'ALL' | 'Rx' | 'OTC'>('ALL');
  const [selectedMedForModal, setSelectedMedForModal] = useState<MedicationQuickRef | null>(null);
  const [speakingMedId, setSpeakingMedId] = useState<string | null>(null);

  const handleSpeakMonograph = (med: MedicationQuickRef) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMedId === med.id) {
      window.speechSynthesis.cancel();
      setSpeakingMedId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const nameToRead = isAr ? (med.nameAr || med.name) : med.name;
    const indicationToRead = isAr ? (med.primaryUseAr || med.primaryUse) : med.primaryUse;
    const dosageToRead = isAr ? (med.typicalDosageAr || med.typicalDosage) : med.typicalDosage;
    const warningToRead = isAr ? (med.keyWarningsAr || med.keyWarnings) : med.keyWarnings;

    const fullText = isAr
      ? `دواء ${nameToRead}. الأسماء التجارية: ${med.brandNames.join('، ')}. دواعي الاستعمال: ${indicationToRead}. الجرعة: ${dosageToRead}. التحذيرات: ${warningToRead}`
      : `Medication ${nameToRead}. Brand names: ${med.brandNames.join(', ')}. Indications: ${indicationToRead}. Dosage: ${dosageToRead}. Key warnings: ${warningToRead}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = isAr ? 'ar-SA' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    if (isAr) {
      const arVoice = voices.find((v) => v.lang.startsWith('ar'));
      if (arVoice) utterance.voice = arVoice;
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingMedId(null);
    utterance.onerror = () => setSpeakingMedId(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingMedId(med.id);
  };

  // Category chips
  const categories = [
    { key: 'all', labelEn: 'All Categories', labelAr: 'جميع الفئات' },
    { key: 'pain', labelEn: 'Pain & Fever', labelAr: 'مسكنات وخافضات حرارة' },
    { key: 'heart', labelEn: 'Heart & BP', labelAr: 'القلب وضغط الدم' },
    { key: 'stomach', labelEn: 'Stomach & GERD', labelAr: 'المعدة والحرقة' },
    { key: 'antibiotics', labelEn: 'Antibiotics', labelAr: 'المضادات الحيوية' },
    { key: 'diabetes', labelEn: 'Diabetes & Metabolism', labelAr: 'السكري والأيض' },
    { key: 'allergy', labelEn: 'Allergy & Respiratory', labelAr: 'الحساسية والربو' },
    { key: 'mental', labelEn: 'Mental Health', labelAr: 'الصحة النفسية' },
    { key: 'thyroid', labelEn: 'Thyroid', labelAr: 'الغدة الدرقية' },
    { key: 'vitamins', labelEn: 'Vitamins & Minerals', labelAr: 'فيتامينات ومكملات' },
  ];

  const filteredMeds = COMMON_MEDICATIONS.filter((med) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      med.name.toLowerCase().includes(query) ||
      (med.nameAr && med.nameAr.includes(query)) ||
      med.brandNames.some((b) => b.toLowerCase().includes(query)) ||
      med.primaryUse.toLowerCase().includes(query) ||
      (med.primaryUseAr && med.primaryUseAr.includes(query)) ||
      med.class.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'all' || med.categoryKey === selectedCategory;
    const matchesType = selectedType === 'ALL' || med.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const totalRxCount = COMMON_MEDICATIONS.filter(m => m.type === 'Rx').length;
  const totalOtcCount = COMMON_MEDICATIONS.filter(m => m.type === 'OTC').length;

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
      {/* 1. MediBase Hero Header */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white p-5 sm:p-7 rounded-3xl shadow-xl mb-6 border border-teal-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start space-x-4 rtl:space-x-reverse">
            <div className="p-3.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-2xl shrink-0 font-bold shadow-sm">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse flex-wrap gap-y-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                  MediBase <span className="text-teal-400 text-sm font-sans font-normal">v2.0</span>
                </h2>
                <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-bold px-3 py-0.5 rounded-full">
                  {COMMON_MEDICATIONS.length} {isAr ? 'مرجع سريري موثق' : 'Verified Monographs'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                {isAr
                  ? 'قاعدة بيانات الأدوية السريرية الشاملة — محرك الأدوية المعتمد لاستفسارات MediBot AI وتحليل الاستخدامات والجرعات والتداخلات.'
                  : 'Comprehensive Pharmacotherapy & Rx/OTC Clinical Database — synced directly with MediBot AI engine for instant clinical reference.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse bg-slate-900/90 p-3 rounded-2xl border border-teal-500/30 text-xs text-teal-300 shrink-0">
            <div className="text-center px-3 border-r border-teal-500/20 rtl:border-r-0 rtl:border-l">
              <span className="text-lg font-mono font-bold text-white block">{totalRxCount}</span>
              <span className="text-[10px] text-slate-400">{isAr ? 'وصفات Rx' : 'Rx Meds'}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-lg font-mono font-bold text-emerald-400 block">{totalOtcCount}</span>
              <span className="text-[10px] text-slate-400">{isAr ? 'بدون وصفة OTC' : 'OTC Meds'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Row */}
      <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
        {/* Search input bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-teal-600 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث بالاسم، العلاج، الجرعة، أو الفئة...'
                : 'Search generic/brand name, use, or class (e.g. Lipitor, Advil, Diabetes)...'
            }
            className="w-full pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-3 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition touch-manipulation min-h-[44px]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-3 text-slate-400 hover:text-slate-700 p-1 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Rx/OTC & Category Filter Container */}
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
          {/* Mobile Category Select Dropdown (Visible on small screens) */}
          <div className="block sm:hidden relative">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">
              {isAr ? 'التصنيف الطبي:' : 'Filter Category:'}
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-teal-500 appearance-none min-h-[42px] touch-manipulation pr-8 rtl:pr-3 rtl:pl-8"
              >
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {isAr ? cat.labelAr : cat.labelEn}
                  </option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-slate-500 absolute right-3 rtl:right-auto rtl:left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Desktop/Tablet Horizontal Category Scroll Chips */}
          <div className="hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none text-xs touch-pan-x">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition min-h-[38px] flex items-center space-x-1 rtl:space-x-reverse touch-manipulation ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60'
                  }`}
                >
                  <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Rx vs OTC Segment Control */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setSelectedType('ALL')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition min-h-[36px] touch-manipulation ${
                selectedType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('Rx')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition min-h-[36px] touch-manipulation ${
                selectedType === 'Rx' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Rx Only
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('OTC')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition min-h-[36px] touch-manipulation ${
                selectedType === 'OTC' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              OTC
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-slate-500 font-mono">
          {isAr
            ? `عرض ${filteredMeds.length} من إجمالي ${COMMON_MEDICATIONS.length} دواء`
            : `Showing ${filteredMeds.length} of ${COMMON_MEDICATIONS.length} clinical records`}
        </span>

        {(searchTerm || selectedCategory !== 'all' || selectedType !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedType('ALL');
            }}
            className="text-xs font-bold text-teal-700 hover:underline"
          >
            {isAr ? 'مسح الفلاتر' : 'Reset All Filters'}
          </button>
        )}
      </div>

      {/* 3. Grid of Medicine Cards */}
      {filteredMeds.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs my-4">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {isAr ? 'لم يتم العثور على أدوية مطابقة' : 'No matching medications found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md mx-auto">
            {isAr
              ? 'جرّب البحث باسم آخر (مثل الاسم التجاري أو المادة الفعالة) أو تغيير فئة الفلتر.'
              : 'Try clearing your search filters or searching with generic or brand names.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedType('ALL');
            }}
            className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs shadow-xs hover:bg-teal-700 transition"
          >
            {isAr ? 'إعادة ضبط البحث' : 'Reset Search Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredMeds.map((med) => (
            <div
              key={med.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              <div>
                {/* Card Header: Pill icon, class badge, Rx/OTC */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
                    <div className={`p-2 rounded-xl border font-bold shrink-0 ${med.pillColor || 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 block truncate">
                        {isAr && med.classAr ? med.classAr : med.class}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      med.type === 'OTC'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {med.type || 'Rx'}
                  </span>
                </div>

                {/* Medicine Title & Arabic Title */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {isAr && med.nameAr ? med.nameAr : med.name}
                  {isAr && med.nameAr && (
                    <span className="text-xs font-semibold text-slate-400 block font-sans mt-0.5">
                      ({med.name})
                    </span>
                  )}
                </h3>

                {/* Brand Names */}
                <div className="mt-1 flex items-center space-x-1 rtl:space-x-reverse text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400">{isAr ? 'الأسماء التجارية:' : 'Brands:'}</span>
                  <span className="text-teal-800 font-medium truncate">{med.brandNames.join(', ')}</span>
                </div>

                {/* Primary Use Box */}
                <div className="mt-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 text-xs">
                  <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                    {isAr ? 'الاستخدام العلاجي الرئيسي:' : 'Clinical Indication:'}
                  </span>
                  <p className="text-slate-700 leading-snug">
                    {isAr && med.primaryUseAr ? med.primaryUseAr : med.primaryUse}
                  </p>
                </div>

                {/* Dosage & Form Info */}
                <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                  <div>
                    <strong>{isAr ? 'الجرعة الشائعة:' : 'Dosage:'}</strong>{' '}
                    <span>{isAr && med.typicalDosageAr ? med.typicalDosageAr : med.typicalDosage}</span>
                  </div>
                  {med.form && (
                    <div className="text-slate-500">
                      <strong>{isAr ? 'الشكل:' : 'Form:'}</strong> {isAr && med.formAr ? med.formAr : med.form}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-1 rtl:space-x-reverse shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedMedForModal(med)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition inline-flex items-center space-x-1 rtl:space-x-reverse min-h-[38px] touch-manipulation active:scale-95"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAr ? 'الدليل' : 'Monograph'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpeakMonograph(med)}
                    className={`p-2 rounded-xl text-xs font-medium transition min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation active:scale-95 ${
                      speakingMedId === med.id
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-teal-700 border border-slate-200/60'
                    }`}
                    title={isAr ? 'استمع للمعلومات' : 'Listen monograph'}
                  >
                    {speakingMedId === med.id ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onAddMedicationToChat(
                      med.name,
                      isAr
                        ? `أرغب في الاستفسار عن دواء "${med.nameAr || med.name}" (${med.brandNames.join(', ')}). يرجى تقديم ملخص سريري شامل عن الاستخدامات، الجرعات، والاحتياطات.`
                        : `I'd like to discuss the medication "${med.name}" (${med.brandNames.join(', ')}). Please provide a full clinical summary of indications, dosage, and warnings.`
                    )
                  }
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse shadow-xs transition min-h-[38px] touch-manipulation flex-1 sm:flex-none"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{isAr ? 'أضف للمحادثة' : 'Add to Chat'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Detail Monograph Modal */}
      {selectedMedForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden max-h-[92dvh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 gap-3">
              <div className="flex items-start space-x-3 rtl:space-x-reverse min-w-0">
                <div className={`p-3 rounded-2xl border font-bold shrink-0 ${selectedMedForModal.pillColor || 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                  <Pill className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-y-1">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {isAr && selectedMedForModal.nameAr ? selectedMedForModal.nameAr : selectedMedForModal.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {selectedMedForModal.type || 'Rx'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr ? 'الأسماء التجارية: ' : 'Brand Names: '}
                    <span className="font-semibold text-slate-800">{selectedMedForModal.brandNames.join(', ')}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMedForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700 rounded-lg">
                  {isAr ? 'الفئة: ' : 'Class: '}
                  {isAr && selectedMedForModal.classAr ? selectedMedForModal.classAr : selectedMedForModal.class}
                </span>
                {selectedMedForModal.form && (
                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700 rounded-lg">
                    {isAr ? 'الشكل الصيدلاني: ' : 'Form: '}
                    {isAr && selectedMedForModal.formAr ? selectedMedForModal.formAr : selectedMedForModal.form}
                  </span>
                )}
              </div>

              {/* Primary Indications */}
              <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl">
                <span className="font-bold text-teal-950 block mb-1">
                  {isAr ? 'دواعي الاستعمال السريرية:' : 'Clinical Indications:'}
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {isAr && selectedMedForModal.primaryUseAr
                    ? selectedMedForModal.primaryUseAr
                    : selectedMedForModal.primaryUse}
                </p>
              </div>

              {/* Dosage */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5 rtl:space-x-reverse">
                <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">
                    {isAr ? 'الجرعة الإرشادية وطريقة الإدارة:' : 'Typical Clinical Dosage:'}
                  </span>
                  <p className="text-slate-700">
                    {isAr && selectedMedForModal.typicalDosageAr
                      ? selectedMedForModal.typicalDosageAr
                      : selectedMedForModal.typicalDosage}
                  </p>
                </div>
              </div>

              {/* Warnings */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start space-x-2.5 rtl:space-x-reverse">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block mb-0.5">
                    {isAr ? 'التحذيرات وموانع الاستعمال:' : 'Key Clinical Warnings & Precautions:'}
                  </span>
                  <p className="text-amber-900 leading-relaxed">
                    {isAr && selectedMedForModal.keyWarningsAr
                      ? selectedMedForModal.keyWarningsAr
                      : selectedMedForModal.keyWarnings}
                  </p>
                </div>
              </div>

              {/* Side Effects */}
              <div>
                <span className="font-bold text-slate-900 block mb-1.5">
                  {isAr ? 'الأعراض الجانبية الشائعة:' : 'Common Side Effects:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(isAr && selectedMedForModal.commonSideEffectsAr
                    ? selectedMedForModal.commonSideEffectsAr
                    : selectedMedForModal.commonSideEffects
                  ).map((effect, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px]"
                    >
                      • {effect}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2 rtl:space-x-reverse justify-between sm:justify-start w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMedForModal) handleSpeakMonograph(selectedMedForModal);
                  }}
                  className={`flex-1 sm:flex-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse min-h-[42px] touch-manipulation active:scale-95 ${
                    speakingMedId === selectedMedForModal.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {speakingMedId === selectedMedForModal.id ? (
                    <>
                      <VolumeX className="w-4 h-4 animate-pulse shrink-0" />
                      <span>{isAr ? 'إيقاف الصوت' : 'Stop Audio'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{isAr ? 'استمع للدليل' : 'Listen Monograph'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setSpeakingMedId(null);
                    setSelectedMedForModal(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[42px] touch-manipulation active:scale-95 border border-slate-200 sm:border-transparent"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const med = selectedMedForModal;
                  window.speechSynthesis.cancel();
                  setSpeakingMedId(null);
                  setSelectedMedForModal(null);
                  onAddMedicationToChat(
                    med.name,
                    isAr
                      ? `أرغب في مناقشة تفاصيل دواء "${med.nameAr || med.name}" مع MediBot AI.`
                      : `I'd like to discuss "${med.name}" with MediBot AI.`
                  );
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse shadow-xs min-h-[42px] touch-manipulation active:scale-95"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{isAr ? 'تحدث مع AI حول الدواء' : 'Ask MediBot AI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
