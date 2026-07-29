import React from 'react';
import { ShieldCheck, Phone, X } from 'lucide-react';

interface SafetyDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'ar';
}

export const SafetyDisclaimerModal: React.FC<SafetyDisclaimerModalProps> = ({ isOpen, onClose, language = 'en' }) => {
  if (!isOpen) return null;

  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel-glow rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200 relative bg-white text-slate-800 max-h-[92dvh] flex flex-col justify-between">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rtl:right-auto rtl:left-3 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 rtl:space-x-reverse mb-3 pr-8 rtl:pr-0 rtl:pl-8">
          <div className="p-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl font-bold shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{isAr ? 'معايير السلامة والإرشادات السريرية' : 'Clinical & Safety Standards'}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">{isAr ? 'سياسة وإرشادات MediBot AI' : 'MediBot AI Policy & Guidelines'}</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed mb-4 overflow-y-auto pr-1">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-medium">
            <div className="flex items-center space-x-2 rtl:space-x-reverse font-bold mb-1 text-rose-800">
              <Phone className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{isAr ? 'تنبيه طوارئ طبية' : 'Medical Emergency Notice'}</span>
            </div>
            {isAr
              ? 'إذا كنت تعاني من ألم شديد في الصدر، ضيق تنفس، أو أعراض حساسية شديدة، يرجى الاتصال بالإسعاف أو الطوارئ فوراً.'
              : 'If you are experiencing severe chest pain, shortness of breath, sudden facial numbness, or signs of anaphylaxis, please call 911 (or local emergency services) immediately.'}
          </div>

          <p>
            <strong className="text-slate-900">{isAr ? 'الهدف التعليمي:' : 'Educational Purpose:'}</strong>{' '}
            {isAr
              ? 'تم تصميم MediBot AI لتوفير معلومات تعليمية موثوقة من المصادر الطبية المعتمدة. هذا النظام ليس طبيباً أو صيدلياً مجازاً.'
              : 'MediBot AI is designed to synthesize evidence-based pharmacological data from public health standards. It is not a licensed physician or pharmacist.'}
          </p>

          <p>
            <strong className="text-slate-900">{isAr ? 'عدم وجود علاقة طبيب ومريض:' : 'No Patient-Doctor Relationship:'}</strong>{' '}
            {isAr
              ? 'المعلومات المقدمة لا تشكل استشارة طبية مباشرة أو تشخيصاً أو توصية علاجية.'
              : 'Information provided by MediBot AI does not constitute direct medical advice, diagnosis, or treatment recommendations.'}
          </p>

          <p>
            <strong className="text-slate-900">{isAr ? 'تعديل الوصفات الطبية:' : 'Prescription Modifications:'}</strong>{' '}
            {isAr
              ? 'لا تقم أبداً بتغيير أو إيقاف أو بدء أي دواء دون استشارة طبيبك المعالج أو الصيدلي.'
              : 'Never alter, stop, or start taking any prescription medication without consulting your prescribing healthcare professional.'}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition min-h-[44px] touch-manipulation active:scale-98"
          >
            {isAr ? 'أفهم وأوافق' : 'I Understand & Agree'}
          </button>
        </div>
      </div>
    </div>
  );
};

