import React from 'react';
import { Pill, AlertTriangle, Printer, Sparkles, ShieldCheck, Globe } from 'lucide-react';

interface NavbarProps {
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
  onOpenDisclaimer: () => void;
  onExportPdf: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onToggleLanguage,
  onOpenDisclaimer,
  onExportPdf,
}) => {
  const isAr = language === 'ar';

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top emergency disclaimer bar */}
      <div className="bg-slate-50 px-4 py-1.5 text-xs text-slate-600 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-hidden text-ellipsis whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong className="text-slate-800">{isAr ? 'ملاحظة طبية:' : 'Medical Notice:'}</strong>{' '}
            {isAr
              ? 'يوفر MediBot AI معلومات تعليمية موثوقة ولا يحل محل التشخيص الطبي المباشر. في حالات الطوارئ اتصل بالطوارئ.'
              : 'MediBot AI provides evidence-based educational information, not professional diagnosis. Call 911 for medical emergencies.'}
          </span>
        </div>
        <button
          onClick={onOpenDisclaimer}
          className="underline hover:text-teal-700 shrink-0 ml-2 rtl:mr-2 text-[11px] font-medium transition"
        >
          {isAr ? 'سياسة السلامة' : 'Safety Policy'}
        </button>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Title */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Pill className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                MediBot <span className="text-teal-600 font-mono text-xs">AI</span>
              </h1>
              <span className="bg-teal-50 text-teal-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-teal-200">
                {isAr ? 'مساعد ذكي' : 'AI Assistant'}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {isAr ? 'استشارات الأدوية والمعلومات السريرية الموثوقة' : 'Evidence-Based Clinical & Medication Intelligence'}
            </p>
          </div>
        </div>

        {/* Center Badge / Title */}
        <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>{isAr ? 'المساعد الطبي السريري الذكي' : 'Clinical AI Assistant Engine'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition border border-teal-200"
            title="Switch Language / تغيير اللغة"
          >
            <Globe className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          <button
            onClick={onOpenDisclaimer}
            className="hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition border border-slate-200"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'إرشادات السلامة' : 'Safety Guidelines'}</span>
          </button>

          <button
            onClick={onExportPdf}
            title={isAr ? 'طباعة / تصدير الاستشارة' : 'Export / Print Consultation'}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-teal-700 transition border border-slate-200"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


