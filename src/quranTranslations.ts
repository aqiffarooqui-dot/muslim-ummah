import { QuranLanguage } from './quranTranslation';

export type QuranLanguageOption = {
  id: QuranLanguage;
  label: string;
  nativeLabel: string;
};

export const QURAN_LANGUAGES: QuranLanguageOption[] = [
  { id: 'arabic', label: 'Arabic', nativeLabel: 'العربية' },
  { id: 'urdu', label: 'Urdu — Fateh Muhammad Jalandhry', nativeLabel: 'اردو' },
  { id: 'hinglish', label: 'Hinglish — Roman Urdu', nativeLabel: 'Roman Urdu' },
  { id: 'english', label: 'English — Saheeh International', nativeLabel: 'English' },
];

export const DEFAULT_QURAN_LANGUAGE: QuranLanguage = 'arabic';

export const TRANSLATION_FILE_URLS: Record<Exclude<QuranLanguage, 'arabic'>, string> = {
  urdu: 'https://raw.githubusercontent.com/druvx13/Quran-data/cairo/data/ur.jalandhry.txt',
  hinglish: 'https://raw.githubusercontent.com/druvx13/Quran-data/cairo/data/ur.romanmaududi.txt',
  english: 'https://raw.githubusercontent.com/druvx13/Quran-data/cairo/data/en.sahih.txt',
};
