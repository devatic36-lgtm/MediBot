import React, { useState, useEffect, useRef } from 'react';
import { Message } from './types';
import { Navbar, ActiveTabType } from './components/Navbar';
import { ChatMessage } from './components/ChatMessage';
import { PillScannerModal } from './components/PillScannerModal';
import { SafetyDisclaimerModal } from './components/SafetyDisclaimerModal';
import { MediBase } from './components/MediBase';
import { getOfflineClinicalResponse } from './data/clinicalEngine';
import {
  Send,
  Pill,
  Camera,
  RefreshCw,
  Paperclip,
  X,
  Mic,
  MicOff,
  Database
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    const saved = localStorage.getItem('medibot_language');
    return saved === 'ar' ? 'ar' : 'en';
  });

  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<ActiveTabType>('chat');

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
          ? `مرحباً بك! أنا **MediBot AI**، مساعدك الطبي والسريري المعتمد على الأدلة العلمية وقاعدة البيانات الموسعة **MediBase (Rx/OTC)**.

كيف يمكنني مساعدتك اليوم؟ يمكنك الاستفسار عن:
- 🗄️ **قاعدة بيانات الأدوية (MediBase)**: تصفح مئات الأدوية الموثقة والأسماء التجارية والدولية.
- 💊 **تفاصيل الأدوية والجرعات**: الاستخدامات، الجرعات للكبار والأطفال، والآثار الجانبية.
- 🔀 **التداخلات الدوائية**: التحقق من أمان تناول دواءين أو أكثر معاً.
- 📸 **التعرف على الأقراص والكبسولات**: رفع صورة دواء أو ملصق وصفة لتحليلها.

*ما هو استفسارك الدوائي اليوم؟*`
          : `Hello! I am **MediBot AI**, your evidence-based Clinical & Medication Specialist Assistant powered by the expanded **MediBase (Rx/OTC)** database.

How can I help you today? You can ask me about:
- 🗄️ **MediBase Database**: Browse hundreds of verified medications, brand/generic names, and indications.
- 💊 **Medication Details**: Clinical uses, adult/pediatric dosages, mechanisms, and side effects.
- 🔀 **Drug Interactions**: Check if two or more medications, foods, or supplements are safe together.
- 📸 **Pill Identification**: Upload a photo of a pill or prescription label to analyze imprints and colors.

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
  const [isListening, setIsListening] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const toggleSpeechToText = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert(
        language === 'ar'
          ? 'خاصية الإملاء الصوتي غير مدعومة مباشرة في هذا المتصفح. يرجى تجربة متصفح Chrome أو Edge.'
          : 'Voice speech recognition is not supported in this browser. Please try Chrome or Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('medibot_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('medibot_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTab]);

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
          text: getOfflineClinicalResponse(queryText, language, 'chat'),
          groundingSources: [],
        };
      }

      if (!response.ok && data?.error) {
        throw new Error(data.error);
      }

      const replyText = data?.text || getOfflineClinicalResponse(queryText, language, 'chat');

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: data?.groundingSources || [],
        mode: 'chat',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const fallbackText = getOfflineClinicalResponse(queryText, language, 'chat');

      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePillImageAnalyzed = (base64Image: string) => {
    setActiveTab('chat');
    setImageAttachment(base64Image);
    setInput(isAr 
      ? 'هل يمكنك مساعدتي في التعرف على دواء أو قرص الدواء هذا واستخداماته الشائعة واحتياطاته؟' 
      : 'Can you help me identify this pill/prescription image and explain its common usage and precautions?');
  };

  const handleAddMedicationToChat = (medName: string, promptText?: string) => {
    setActiveTab('chat');
    const textToSend = promptText || (isAr
      ? `أرغب في الاستفسار عن دواء ${medName}. ما هي أهم استخداماته، جرعاته، وآثاره الجانبية؟`
      : `I'd like to discuss the medication ${medName}. What are its primary uses, dosages, and safety precautions?`);
    handleSendMessage(textToSend);
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
      {/* Navbar with View Tabs */}
      <Navbar
        language={language}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onToggleLanguage={handleToggleLanguage}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onExportPdf={handleExportPdf}
      />

      {/* Main Body View Switching */}
      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-2 sm:p-4 md:p-6 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-[480px]">
            {/* Chat Top Sub-header */}
            <div className="bg-slate-100/80 px-3 sm:px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse shadow-xs shrink-0" />
                <span className="text-[11px] sm:text-xs font-mono font-bold text-teal-800 truncate">
                  {isAr ? 'MediBot AI نشط' : 'MediBot AI Active'}
                </span>
                <span className="text-xs text-slate-500 hidden md:inline truncate">
                  | {isAr ? 'معلومات صيدلانية ودلائل إرشادية معتمدة' : 'Evidence-Based Pharmacology & FDA Guidelines'}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('medibase')}
                  className="px-2.5 py-1.5 sm:px-3 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 active:scale-95 text-xs font-bold rounded-xl transition flex items-center space-x-1 rtl:space-x-reverse min-h-[34px] touch-manipulation"
                >
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] sm:text-xs">{isAr ? 'MediBase (100x)' : 'MediBase 100x'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPillModalOpen(true)}
                  className="px-2.5 py-1.5 sm:px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 text-xs font-bold rounded-xl transition flex items-center space-x-1 rtl:space-x-reverse min-h-[34px] touch-manipulation"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                  <span className="text-[11px] sm:text-xs">{isAr ? 'مسح قرص' : 'Scan Pill'}</span>
                </button>

                <button
                  type="button"
                  onClick={clearChatHistory}
                  className="text-[11px] sm:text-xs text-slate-400 hover:text-rose-600 px-2 py-1 rounded transition min-h-[34px] flex items-center"
                  title={isAr ? 'مسح المحادثة' : 'Clear chat session'}
                >
                  {isAr ? 'مسح' : 'Clear'}
                </button>
              </div>
            </div>

            {/* Chat Scroll Area */}
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3.5 max-h-[calc(100dvh-250px)]">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onRate={handleRateMessage} />
              ))}

              {isLoading && (
                <div className="py-3 px-3.5 bg-white max-w-2xl border border-teal-200 rounded-2xl shadow-xs flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center animate-bounce shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm text-teal-700 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
                    <span>
                      {isAr
                        ? 'جاري تحليل القواعد المرجعية في MediBase والأدلة الطبية الصيدلانية...'
                        : 'Analyzing clinical databases & MediBase references...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Preset Prompts when chat is short */}
            {messages.length <= 2 && (
              <div className="px-3 sm:px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-500 block mb-1.5">
                  {isAr ? 'أسئلة شائعة سريعة:' : 'Quick Clinical Queries:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
                  {PRESET_PROMPTS_LOCALIZED.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-2 sm:p-2.5 bg-white border border-slate-200 hover:border-teal-400 active:scale-98 rounded-xl text-left rtl:text-right text-xs transition hover:bg-teal-50/30 group min-h-[44px] touch-manipulation flex flex-col justify-center"
                    >
                      <span className="font-bold text-slate-800 block text-[11px] sm:text-xs group-hover:text-teal-700 leading-tight">{item.title}</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block mt-0.5">{item.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Preview attachment badge */}
            {imageAttachment && (
              <div className="px-3 py-2 bg-teal-50 text-slate-800 flex items-center justify-between text-xs border-t border-teal-200 gap-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
                  <img src={imageAttachment} alt="Attached pill preview" className="w-7 h-7 object-cover rounded border border-teal-300 shrink-0" />
                  <span className="text-teal-800 font-semibold text-[11px] sm:text-xs truncate">
                    {isAr ? 'تم إرفاق صورة الدواء' : 'Photo Attached'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageAttachment(null)}
                  className="p-1 hover:bg-teal-100 rounded text-slate-500 hover:text-slate-800 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Chat Input Bar */}
            <div className="p-2.5 sm:p-4 bg-slate-50 border-t border-slate-200">
              {isListening && (
                <div className="mb-2 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                    <span className="truncate text-[11px] sm:text-xs">
                      {isAr
                        ? '🎙️ جاري الاستماع للإملاء الصوتي بالعربية...'
                        : '🎙️ Listening to voice dictation in English...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSpeechToText}
                    className="text-[11px] underline text-rose-800 font-bold shrink-0 ml-2 rtl:mr-2"
                  >
                    {isAr ? 'إيقاف' : 'Stop'}
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setIsPillModalOpen(true)}
                  className="p-2.5 sm:p-3 text-teal-700 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl sm:rounded-2xl transition shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  title={isAr ? 'رفع صورة قرص دواء' : 'Upload pill photo'}
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="button"
                  onClick={toggleSpeechToText}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition border flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] touch-manipulation ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-200 shadow-sm'
                      : 'bg-white text-teal-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50'
                  }`}
                  title={
                    isListening
                      ? (isAr ? 'إيقاف الإملاء الصوتي' : 'Stop voice recording')
                      : (isAr ? 'الإملاء الصوتي (بالعربية / الإنجليزية)' : 'Voice input dictation (Arabic / English)')
                  }
                >
                  {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder={
                    isListening
                      ? (isAr ? 'جاري تحويل صوتك إلى نص...' : 'Converting speech to text...')
                      : (isAr
                        ? 'اسأل MediBot أو انقر للمايك...'
                        : 'Ask MediBot or click mic...')
                  }
                  className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 min-h-[44px]"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || (!input.trim() && !imageAttachment)}
                  className={`px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition shadow-xs shrink-0 min-h-[44px] touch-manipulation ${
                    isLoading || (!input.trim() && !imageAttachment)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs active:scale-95'
                  }`}
                >
                  <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Ask'}</span>
                  <Send className="w-4 h-4 stroke-[2.5] rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MediBase Database View */}
        {activeTab === 'medibase' && (
          <MediBase
            language={language}
            onAddMedicationToChat={handleAddMedicationToChat}
          />
        )}
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
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} MediBot AI & MediBase — {isAr ? 'المساعد الطبي الصيدلاني المعتمد' : 'Evidence-Based Clinical AI Specialist.'}</p>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button onClick={() => setIsDisclaimerOpen(true)} className="hover:text-teal-700 underline transition">
              {isAr ? 'سياسة وإرشادات السلامة الطبية' : 'Clinical Policy & Disclaimers'}
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-teal-700 font-mono">MediBase v2.0 (100x)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
