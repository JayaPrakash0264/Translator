
import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Language } from '../types';

interface LanguageSelectorProps {
  selectedCode: string;
  onChange: (code: string) => void;
  excludeAuto?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedCode, onChange, excludeAuto = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => {
    if (excludeAuto && lang.code === 'auto') return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      lang.name.toLowerCase().includes(searchLower) ||
      lang.nativeName.toLowerCase().includes(searchLower) ||
      lang.code.toLowerCase().includes(searchLower)
    );
  });

  const selectedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === selectedCode) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-sm hover:border-slate-300"
      >
        <span className="truncate font-medium">
          {selectedLanguage.name} {selectedLanguage.nativeName !== selectedLanguage.name && selectedLanguage.code !== 'auto' ? `(${selectedLanguage.nativeName})` : ''}
        </span>
        <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onChange(lang.code);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                    selectedCode === lang.code ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">
                    {lang.name} 
                    {lang.nativeName !== lang.name && lang.code !== 'auto' && (
                      <span className="ml-2 text-slate-400 font-normal group-hover:text-indigo-300">{lang.nativeName}</span>
                    )}
                  </span>
                  {selectedCode === lang.code && (
                    <i className="fas fa-check text-[10px] text-indigo-500"></i>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-slate-400 text-sm italic">
                No languages found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
