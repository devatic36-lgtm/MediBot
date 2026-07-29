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
      <div className="bg-slate-50 px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs text-slate-600 flex items-center justify-between border-b border-slate-200 gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse overflow-hidden text-ellipsis min-w-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-800">{isAr ? 'ملاحظة طبية:' : 'Medical Notice:'}</strong>{' '}
            {isAr
              ? 'معلومات تعليمية موثوقة ولا يحل محل التشخيص الطبي المباشر.'
              : 'Evidence-based educational info, not direct diagnosis. Call 911 for emergencies.'}
          </span>
        </div>
        <button
          onClick={onOpenDisclaimer}
          className="underline hover:text-teal-700 shrink-0 text-[10px] sm:text-[11px] font-semibold transition py-0.5 px-1 min-h-[32px] flex items-center"
        >
          {isAr ? 'سياسة السلامة' : 'Safety Policy'}
        </button>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Pill className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                MediBot <span className="text-teal-600 font-mono text-[10px] sm:text-xs">AI</span>
              </h1>
              <span className="bg-teal-50 text-teal-700 text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-teal-200 hidden xs:inline-block">
                {isAr ? 'مساعد ذكي' : 'AI Assistant'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              {isAr ? 'استشارات الأدوية والمعلومات السريرية الموثوقة' : 'Evidence-Based Clinical & Medication Intelligence'}
            </p>
          </div>
        </div>

        {/* Center Badge / Title */}
        <div className="hidden lg:flex items-center space-x-2 rtl:space-x-reverse bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>{isAr ? 'المساعد الطبي السريري الذكي' : 'Clinical AI Assistant Engine'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse shrink-0">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse px-2.5 sm:px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 active:scale-95 rounded-xl transition border border-teal-200 min-h-[38px] touch-manipulation"
            title="Switch Language / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">{isAr ? 'English' : 'العربية'}</span>
          </button>

          <button
            onClick={onOpenDisclaimer}
            className="hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition border border-slate-200 min-h-[38px] touch-manipulation"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="hidden md:inline">{isAr ? 'إرشادات السلامة' : 'Safety Guidelines'}</span>
            <span className="md:hidden">{isAr ? 'السلامة' : 'Safety'}</span>
          </button>

          <button
            onClick={onExportPdf}
            title={isAr ? 'طباعة / تصدير الاستشارة' : 'Export / Print Consultation'}
            className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-teal-700 transition border border-slate-200 min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


