
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { translateText, generateSpeech, decodeAudioData } from './services/geminiService';
import { TranslationResult, HistoryItem } from './types';
import { SUPPORTED_LANGUAGES, APP_NAME } from './constants';
import LanguageSelector from './components/LanguageSelector';

const App: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('translation_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('translation_history', JSON.stringify(history.slice(0, 50)));
  }, [history]);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      setTargetText('');
      setDetectedLang(null);
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTargetText(result.translatedText);
      if (result.detectedLanguage) {
        setDetectedLang(result.detectedLanguage);
      }
      
      // Add to history
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        sourceText,
        translatedText: result.translatedText,
        sourceLang: result.detectedLanguage || sourceLang,
        targetLang,
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev.filter(h => h.sourceText !== sourceText)]);
    } catch (err: any) {
      setError(err.message || "Translation failed. Please try again.");
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang]);

  // Debounced translation
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (sourceText.length > 0) {
        handleTranslate();
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [sourceText, sourceLang, targetLang, handleTranslate]);

  const handleSpeak = async (text: string, langCode: string) => {
    if (!text || isSpeaking) return;

    setIsSpeaking(true);
    try {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name || 'English';
      const audioBytes = await generateSpeech(text, langName);
      
      if (!audioBytes) throw new Error("Audio generation failed");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const buffer = await decodeAudioData(audioBytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      source.start(0);
    } catch (err) {
      console.error("Speech Error:", err);
      setIsSpeaking(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const clearAll = () => {
    setSourceText('');
    setTargetText('');
    setDetectedLang(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-language text-xl"></i>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {APP_NAME}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <button className="hover:text-indigo-600 transition-colors">
              <i className="fas fa-history text-lg"></i>
            </button>
            <button className="hover:text-indigo-600 transition-colors">
              <i className="fas fa-cog text-lg"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Translation Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          
          {/* Source Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="w-48">
                <LanguageSelector 
                  selectedCode={sourceLang} 
                  onChange={(code) => setSourceLang(code)} 
                />
              </div>
              {detectedLang && sourceLang === 'auto' && (
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Detected: {detectedLang}
                </span>
              )}
            </div>

            <div className="relative group">
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Type or paste text to translate..."
                className="w-full h-64 p-6 text-xl bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm placeholder:text-slate-300"
              />
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 {sourceText && (
                  <button 
                    onClick={clearAll}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Clear"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                 )}
                <button 
                   onClick={() => handleSpeak(sourceText, detectedLang || sourceLang)}
                   disabled={!sourceText || isSpeaking}
                   className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                   title="Listen"
                >
                  <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'}`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Swap Button (Mobile) */}
          <div className="lg:hidden flex justify-center -my-2 z-10">
            <button 
              onClick={swapLanguages}
              className="bg-white border border-slate-200 p-3 rounded-full shadow-md hover:shadow-lg hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
            >
              <i className="fas fa-exchange-alt rotate-90"></i>
            </button>
          </div>

          {/* Target Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="w-48">
                <LanguageSelector 
                  selectedCode={targetLang} 
                  onChange={(code) => setTargetLang(code)} 
                  excludeAuto
                />
              </div>
              {/* Swap Button (Desktop) */}
              <button 
                onClick={swapLanguages}
                disabled={sourceLang === 'auto'}
                className={`hidden lg:block p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ${sourceLang === 'auto' ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="Swap Languages"
              >
                <i className="fas fa-exchange-alt"></i>
              </button>
            </div>

            <div className="relative group">
              <div className={`w-full h-64 p-6 text-xl bg-slate-50 border border-slate-200 rounded-2xl overflow-y-auto custom-scrollbar transition-all ${isTranslating ? 'animate-pulse' : ''}`}>
                {isTranslating && !targetText ? (
                  <span className="text-slate-300">Translating...</span>
                ) : targetText ? (
                  <span className="text-slate-800 whitespace-pre-wrap">{targetText}</span>
                ) : (
                  <span className="text-slate-300">Translation</span>
                )}
              </div>
              {targetText && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(targetText)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Copy"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                  <button 
                    onClick={() => handleSpeak(targetText, targetLang)}
                    disabled={isSpeaking}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Listen"
                  >
                    <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'}`}></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <i className="fas fa-exclamation-circle"></i>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <i className="fas fa-clock-rotate-left text-indigo-400"></i>
                Recent Translations
              </h2>
              <button 
                onClick={() => setHistory([])}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear History
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => {
                    setSourceText(item.sourceText);
                    setTargetLang(item.targetLang);
                    setSourceLang(item.sourceLang);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                        {item.sourceLang}
                      </span>
                      <i className="fas fa-arrow-right text-[10px] text-slate-300"></i>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                        {item.targetLang}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1 mb-1 italic">"{item.sourceText}"</p>
                  <p className="text-base font-medium text-slate-800 line-clamp-2">{item.translatedText}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>Powered by Google Gemini 3 Flash & 2.5 Flash TTS</p>
          <p className="mt-1">Built with high-fidelity React & Tailwind</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
