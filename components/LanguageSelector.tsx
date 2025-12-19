
import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Language } from '../types';

interface LanguageSelectorProps {
  selectedCode: string;
  onChange: (code: string) => void;
  excludeAuto?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedCode, onChange, excludeAuto = false }) => {
  const filteredLanguages = excludeAuto 
    ? SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto') 
    : SUPPORTED_LANGUAGES;

  return (
    <div className="relative inline-block w-full">
      <select
        value={selectedCode}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
      >
        {filteredLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name} {lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
        <i className="fas fa-chevron-down text-xs"></i>
      </div>
    </div>
  );
};

export default LanguageSelector;
