import { QuranLanguage } from './quranTranslation';

export type QuranLanguageOption = {
  id: QuranLanguage;
  label: string;
  nativeLabel: string;
};

export const QURAN_LANGUAGES: QuranLanguageOption[] = [
  {
    id: 'arabic',
    label: 'Arabic',
    nativeLabel: 'العربية',
  },
  {
    id: 'urdu',
    label: 'Urdu',
    nativeLabel: 'اردو',
  },
  {
    id: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'Roman Urdu',
  },
  {
    id: 'english',
    label: 'English',
    nativeLabel: 'English',
  },
];

export const DEFAULT_QURAN_LANGUAGE: QuranLanguage = 'arabic';

export const TRANSLATION_FILE_URLS: Record<
  Exclude<QuranLanguage, 'arabic'>,
  string
> = {
  urdu: '/quran-urdu.txt',
  hinglish: '/quran-hinglish.txt',
  english: '/quran-english.txt',
};
