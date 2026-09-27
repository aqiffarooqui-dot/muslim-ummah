export type PremiumFeatureId =
  | 'themes'
  | 'quranAdvanced'
  | 'quranAudio'
  | 'bookmarks'
  | 'duas'
  | 'hadith'
  | 'prayerAdvanced'
  | 'insights'
  | 'reminders'
  | 'cloudSync';

export type PremiumFeature = {
  id: PremiumFeatureId;
  title: string;
  description: string;
};

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'themes',
    title: 'Premium Themes',
    description:
      'Exclusive Muslim Ummah themes and appearance options.',
  },
  {
    id: 'quranAdvanced',
    title: 'Advanced Quran',
    description:
      'Advanced reading controls, fonts and reader preferences.',
  },
  {
    id: 'quranAudio',
    title: 'Quran Audio',
    description:
      'Enhanced Quran listening and playback controls.',
  },
  {
    id: 'bookmarks',
    title: 'Unlimited Bookmarks',
    description:
      'Save and organize your important Ayahs.',
  },
  {
    id: 'duas',
    title: 'Premium Duas',
    description:
      'Expanded Dua collections and saved favorites.',
  },
  {
    id: 'hadith',
    title: 'Premium Hadith',
    description:
      'Expanded Hadith reading and collections.',
  },
  {
    id: 'prayerAdvanced',
    title: 'Advanced Prayer',
    description:
      'Additional prayer and Islamic features.',
  },
  {
    id: 'insights',
    title: 'Reading Insights',
    description:
      'Personal Quran progress and reading statistics.',
  },
  {
    id: 'reminders',
    title: 'Advanced Reminders',
    description:
      'More flexible Islamic and prayer reminders.',
  },
  {
    id: 'cloudSync',
    title: 'Cloud Sync',
    description:
      'Synchronize supported personal preferences and progress.',
  },
];
