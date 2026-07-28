import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import {
  Bot,
  User,
  ExternalLink,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onRate?: (messageId: string, rating: 'helpful' | 'unhelpful') => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRate }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.sender === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = message.text.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div
      className={`py-5 px-5 sm:px-6 rounded-2xl transition-all ${
        isUser
          ? 'bg-slate-900 text-white ml-auto max-w-3xl border border-slate-800 shadow-md'
          : 'glass-panel max-w-4xl border border-slate-200 text-slate-800 shadow-xs'
      }`}
    >
      <div className="flex items-start space-x-3 sm:space-x-4">
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs ${
            isUser
              ? 'bg-slate-800 text-teal-400 border border-slate-700'
              : 'bg-teal-600 text-white font-black shadow-xs'
          }`}
        >
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 stroke-[2.5]" />}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}>
                {isUser ? 'You' : 'MediBot Clinical AI'}
              </span>
              {!isUser && (
                <span className="inline-flex items-center space-x-1 bg-teal-50 text-teal-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-teal-200">
                  <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                  <span>Verified Evidence</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{message.timestamp}</span>
            </div>
          </div>

          {/* Image Attachment preview */}
          {message.imageAttachment && (
            <div className="mb-3">
              <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs max-w-xs">
                <img
                  src={message.imageAttachment}
                  alt="Uploaded medication or pill sample"
                  className="max-h-48 object-cover rounded-xl"
                />
                <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  Uploaded Photo
                </span>
              </div>
            </div>
          )}

          {/* Text Message Content */}
          <div className={`text-sm leading-relaxed ${isUser ? 'text-slate-100 font-normal' : 'medibot-markdown'}`}>
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>

          {/* Grounding Sources & Citations */}
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5 mb-2">
                <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                <span>Clinical Sources & Evidence Citations:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="citation-tag hover:bg-teal-100 transition"
                  >
                    <span className="truncate max-w-[200px]">{source.title}</span>
                    <ExternalLink className="w-3 h-3 text-teal-600 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Toolbar for Bot Messages */}
          {!isUser && (
            <div className="mt-4 pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                  title="Copy medical summary"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleSpeech}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg transition ${
                    isSpeaking ? 'bg-teal-100 text-teal-800 font-semibold border border-teal-200' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Listen to audio response"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-teal-600" /> : <Volume2 className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isSpeaking ? 'Stop Voice' : 'Read Aloud'}</span>
                </button>
              </div>

              {/* Feedback buttons */}
              {onRate && (
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] text-slate-400 mr-1 hidden xs:inline font-mono">Helpful?</span>
                  <button
                    onClick={() => onRate(message.id, 'helpful')}
                    className={`p-1.5 rounded-lg hover:bg-emerald-50 transition ${
                      message.rating === 'helpful' ? 'text-emerald-700 font-bold bg-emerald-50 border border-emerald-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Mark helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRate(message.id, 'unhelpful')}
                    className={`p-1.5 rounded-lg hover:bg-rose-50 transition ${
                      message.rating === 'unhelpful' ? 'text-rose-700 font-bold bg-rose-50 border border-rose-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Mark unhelpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

