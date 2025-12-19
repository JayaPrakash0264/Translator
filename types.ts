
export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  pronunciation?: string;
  alternatives?: string[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}
