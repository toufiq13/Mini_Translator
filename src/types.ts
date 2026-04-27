import { Language, TextSegment } from "./services/geminiService";

export interface TranslationEntry {
  id: string;
  timestamp: number;
  mode: 'typing' | 'image';
  sourceLang: Language;
  targetLang: Language;
  inputText: string;
  image?: string;
  output: string;
  segments?: TextSegment[];
  isSaved: boolean;
}
