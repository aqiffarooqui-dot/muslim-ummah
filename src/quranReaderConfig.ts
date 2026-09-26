export type QuranReaderStyle = 'uthmani' | 'indopak';

export type QuranReaderLineStyle = 'standard' | '15_lines' | '16_lines';

export const QURAN_READER_STYLES = [
  {
    id: 'uthmani' as const,
    label: 'Uthmani',
    description: 'Standard Uthmani Quran text',
  },
  {
    id: 'indopak' as const,
    label: 'Indo-Pak',
    description: 'Traditional Indo-Pak Quran reading style',
  },
];

export const QURAN_LINE_STYLES = [
  {
    id: 'standard' as const,
    label: 'Standard',
  },
  {
    id: '15_lines' as const,
    label: '15 Lines',
  },
  {
    id: '16_lines' as const,
    label: '16 Lines',
  },
];

export const DEFAULT_READER_STYLE: QuranReaderStyle = 'indopak';

export const DEFAULT_LINE_STYLE: QuranReaderLineStyle = 'standard';
