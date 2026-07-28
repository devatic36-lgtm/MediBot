import React, { useState, useEffect, useRef } from 'react';
import { Message } from './types';
import { Navbar } from './components/Navbar';
import { ChatMessage } from './components/ChatMessage';
import { PillScannerModal } from './components/PillScannerModal';
import { SafetyDisclaimerModal } from './components/SafetyDisclaimerModal';
import {
  Send,
  Pill,
  Camera,
  RefreshCw,
  Paperclip,
  X
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    const saved = localStorage.getItem('medibot_language');
    return saved === 'ar' ? 'ar' : 'en';
  });

  const isAr = language === 'ar';

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('medibot_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: language === 'ar'
          ? `مرحباً بك! أنا **MediBot AI**، مساعدك الطبي والسريري المعتمد على الأدلة العلمية والمعلومات الدوائية الدقيقة.

كيف يمكنني مساعدتك اليوم؟ يمكنك الاستفسار عن:
- 💊 **تفاصيل الأدوية**: الاستخدامات، الجرعات للكبار والأطفال، والآثار الجانبية.
- 🔀 **التداخلات الدوائية**: التحقق من أمان تناول دواءين أو أكثر معاً.
- 📸 **التعرف على الأقراص والكبسولات**: رفع صورة دواء أو ملصق وصفة لتحليلها.
- ⏱️ **طريقة وأوقات الاستعمال**: أفضل الأوقات لتناول الدواء مع الطعام أو بدونه.

*ما هو استفسارك الدوائي اليوم؟*`
          : `Hello! I am **MediBot AI**, your evidence-based Clinical & Medication Specialist Assistant.

How can I help you today? You can ask me about:
- 💊 **Medication Details**: Uses, adult/pediatric dosages, mechanisms, and side effects.
- 🔀 **Drug Interactions**: Check if two or more medications, foods, or supplements are safe together.
- 📸 **Pill Identification**: Upload a photo of a pill or prescription label to analyze imprints and colors.
- ⏱️ **Administration & Timing**: Best times to take medications with or without food.

*What medication question do you have today?*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'chat',
      },
    ];
  });

  const [input, setInput] = useState('');
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPillModalOpen, setIsPillModalOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync language state to local storage
  useEffect(() => {
    localStorage.setItem('medibot_language', language);
  }, [language]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('medibot_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleToggleLanguage = () => {
    const nextLang = language === 'en' ? 'ar' : 'en';
    setLanguage(nextLang);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const queryText = (customPrompt || input).trim();
    if (!queryText && !imageAttachment) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText || (imageAttachment ? (isAr ? 'يرجى تحليل هذه الصورة المرفقة.' : 'Please analyze this uploaded photo.') : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageAttachment: imageAttachment || undefined,
      mode: 'chat',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setImageAttachment(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          history: messages,
          imageAttachment,
          mode: 'chat',
          language,
        }),
      });

      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.warn('Received non-JSON response from /api/chat server, activating clinical fallback');
        data = {
          text: isAr
            ? '⚠️ **تنبيه خادم الاستشارة الطبية:** الخادم مشغول حالياً. يرجى الانتظار بضع ثوانٍ ثم إعادة المحاولة.'
            : '⚠️ **MediBot Notice:** The clinical AI service is momentarily busy. Please wait a few seconds and try sending your query again.',
          groundingSources: [],
        };
      }

      if (!response.ok && data.error) {
        throw new Error(data.error);
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.text || (isAr ? 'لم أتمكن من الحصول على إجابة. يرجى المحاولة مرة أخرى.' : 'No response text received.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: data.groundingSources,
        mode: 'chat',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorText = error?.message || '';
      
      // Clean up raw JSON error dumps (e.g. 429 quota error strings)
      if (errorText.includes('429') || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
        errorText = isAr
          ? '⚠️ **تنبيه:** تم الوصول إلى حد الاستخدام المؤقت بنظام الذكاء الاصطناعي (Error 429). يرجى الانتظار بضع ثوانٍ وإعادة المحاولة.'
          : '⚠️ **Notice:** Gemini API rate limit reached (Error 429). Please wait a few seconds and try sending your prompt again.';
      } else {
        errorText = isAr
          ? `⚠️ **عذراً، حدث خطأ في الاتصال بالخادم:** ${errorText}`
          : `⚠️ **Clinical Assistant Error:** ${errorText}`;
      }

      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePillImageAnalyzed = (base64Image: string) => {
    setImageAttachment(base64Image);
    setInput(isAr 
      ? 'هل يمكنك مساعدتي في التعرف على دواء أو قرص الدواء هذا واستخداماته الشائعة واحتياطاته؟' 
      : 'Can you help me identify this pill/prescription image and explain its common usage and precautions?');
  };

  const handleRateMessage = (messageId: string, rating: 'helpful' | 'unhelpful') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, rating } : msg))
    );
  };

  const handleExportPdf = () => {
    window.print();
  };

  const clearChatHistory = () => {
    const confirmText = isAr
      ? 'هل أنت تأكد من رغبتك في مسح سجّل المحادثة الحالي؟'
      : 'Are you sure you want to clear your current chat history?';
    if (window.confirm(confirmText)) {
      setMessages([
        {
          id: 'welcome-reset',
          sender: 'bot',
          text: isAr
            ? 'تم مسح سجل المحادثة. كيف يمكن لـ MediBot مساعدتك الآن؟'
            : 'Chat history cleared. How can MediBot assist you next?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const PRESET_PROMPTS_LOCALIZED = isAr
    ? [
        {
          title: 'فحص التداخلات',
          prompt: 'هل يوجد تداخل دوائي بين الإيبوبروفين والباراسيتامول والليسينوبريل؟',
        },
        {
          title: 'الآثار الجانبية',
          prompt: 'ما هي أهم الأعراض الجانبية والتحذيرات عند استخدام دواء ميتفورمين (Metformin)؟',
        },
        {
          title: 'إرشادات الجرعة',
          prompt: 'ما هي الطريقة الصحيحة لتناول دواء ليفوثيروكسين (Levothyroxine) للحصول على أفضل امتصاص؟',
        },
        {
          title: 'التعرف على قرص دواء',
          prompt: 'لدي قرص دواء أبيض بيضاوي مكتوب عليه "M367"، ما هو هذا الدواء وما استخدامه؟',
        },
      ]
    : [
        {
          title: 'Interaction Check',
          prompt: 'Check for potential interactions between Ibuprofen, Acetaminophen, and Lisinopril.',
        },
        {
          title: 'Side Effects Analysis',
          prompt: 'What are the key side effects and warning signs of Metformin?',
        },
        {
          title: 'Dosage & Administration',
          prompt: 'How should Levothyroxine be taken for optimal absorption, and what food/supplements should I avoid near the dose?',
        },
        {
          title: 'Pill Identification Help',
          prompt: 'I have an oval white pill marked "M367". Can you help me identify what medication this likely is?',
        },
      ];

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Navbar */}
      <Navbar
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onExportPdf={handleExportPdf}
      />

      {/* Main Body */}
      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-3 sm:p-5 md:p-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {/* Chat Top Sub-header */}
          <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse shadow-sm" />
              <span className="text-xs font-mono font-bold text-teal-800">
                {isAr ? 'نظام MediBot الذكي نشط' : 'MediBot AI Engine Active'}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                | {isAr ? 'معلومات صيدلانية ودلائل إرشادية معتمدة' : 'Evidence-Based Pharmacology & FDA Guidelines'}
              </span>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setIsPillModalOpen(true)}
                className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 text-xs font-bold rounded-xl transition flex items-center space-x-1 rtl:space-x-reverse"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isAr ? 'ماسح الأدوية' : 'Pill Scanner'}</span>
              </button>

              <button
                onClick={clearChatHistory}
                className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 rounded transition"
                title={isAr ? 'مسح المحادثة' : 'Clear chat session'}
              >
                {isAr ? 'مسح المحادثة' : 'Clear Session'}
              </button>
            </div>
          </div>

          {/* Chat Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[calc(100vh-270px)]">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onRate={handleRateMessage} />
            ))}

            {isLoading && (
              <div className="py-4 px-4 bg-white max-w-2xl border border-teal-200 rounded-2xl shadow-xs flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center animate-bounce">
                  <Pill className="w-5 h-5" />
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-teal-700 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                  <span>
                    {isAr
                      ? 'جاري تحليل القواعد المرجعية والأدلة الطبية والصيدلانية...'
                      : 'Analyzing clinical reference databases & drug safety guidelines...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Preset Prompts when chat is short */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-500 block mb-2">
                {isAr ? 'أسئلة شائعة سريعة:' : 'Quick Clinical Queries:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {PRESET_PROMPTS_LOCALIZED.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-2.5 bg-white border border-slate-200 hover:border-teal-400 rounded-xl text-left rtl:text-right text-xs transition hover:bg-teal-50/30 group"
                  >
                    <span className="font-bold text-slate-800 block group-hover:text-teal-700">{item.title}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{item.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Preview attachment badge */}
          {imageAttachment && (
            <div className="px-4 py-2 bg-teal-50 text-slate-800 flex items-center justify-between text-xs border-t border-teal-200">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <img src={imageAttachment} alt="Attached pill preview" className="w-8 h-8 object-cover rounded border border-teal-300" />
                <span className="text-teal-800 font-semibold">
                  {isAr ? 'تم إرفاق صورة الدواء (جاهزة للتحليل والرأي الطبي)' : 'Photo Attached (Pill / Label Analysis Ready)'}
                </span>
              </div>
              <button
                onClick={() => setImageAttachment(null)}
                className="p-1 hover:bg-teal-100 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
            {/* Input + Action buttons */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setIsPillModalOpen(true)}
                className="p-3 text-teal-700 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-2xl transition"
                title={isAr ? 'رفع صورة قرص دواء' : 'Upload pill photo'}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder={
                  isAr
                    ? 'اسأل MediBot عن أي دواء، جرعة، آثار جانبية، أو تداخلات دوائية...'
                    : 'Ask MediBot about any medication, dosage, side effects, or safety precautions...'
                }
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!input.trim() && !imageAttachment)}
                className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center space-x-2 rtl:space-x-reverse transition shadow-xs ${
                  isLoading || (!input.trim() && !imageAttachment)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                }`}
              >
                <span>{isAr ? 'إرسال' : 'Ask'}</span>
                <Send className="w-4 h-4 stroke-[2.5] rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Pill Scanner Modal */}
      <PillScannerModal
        isOpen={isPillModalOpen}
        onClose={() => setIsPillModalOpen(false)}
        onAnalyzeImage={handlePillImageAnalyzed}
        language={language}
      />

      {/* Safety Disclaimer Policy Modal */}
      <SafetyDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        language={language}
      />

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-4 px-6 text-center text-xs border-t border-slate-200 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} MediBot AI — {isAr ? 'المساعد الطبي الصيدلاني المعتمد' : 'Evidence-Based Clinical AI Specialist.'}</p>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button onClick={() => setIsDisclaimerOpen(true)} className="hover:text-teal-700 underline transition">
              {isAr ? 'سياسة وإرشادات السلامة الطبية' : 'Clinical Policy & Disclaimers'}
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-teal-700 font-mono">Powered by Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
