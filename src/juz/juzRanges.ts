export type JuzRange = {
  juz: number;
  name: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
};

export const JUZ_RANGES: JuzRange[] = [
  { juz: 1, name: 'Alif Lam Meem', startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
  { juz: 2, name: 'Sayaqool', startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
  { juz: 3, name: 'Tilkal Rusul', startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
  { juz: 4, name: 'Lan Tanaalu', startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
  { juz: 5, name: 'Wal Muhsanat', startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
  { juz: 6, name: 'La Yuhibbullah', startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
  { juz: 7, name: 'Wa Iza Sami’oo', startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
  { juz: 8, name: 'Wa Lau Annana', startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
  { juz: 9, name: 'Qalal Malao', startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
  { juz: 10, name: 'Wa A’lamoo', startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
  { juz: 11, name: 'Ya’taziroon', startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
  { juz: 12, name: 'Wa Ma Min Daabbah', startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
  { juz: 13, name: 'Wa Ma Ubarri’u', startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
  { juz: 14, name: 'Rubama', startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
  { juz: 15, name: 'Subhanallazi', startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
  { juz: 16, name: 'Qala Alam', startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
  { juz: 17, name: 'Iqtaraba', startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
  { juz: 18, name: 'Qad Aflaha', startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
  { juz: 19, name: 'Wa Qalallazina', startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
  { juz: 20, name: 'Amman Khalaq', startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
  { juz: 21, name: 'Utlu Ma Oohiya', startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
  { juz: 22, name: 'Wa Man Yaqnut', startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
  { juz: 23, name: 'Wa Mali', startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
  { juz: 24, name: 'Faman Azlamu', startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
  { juz: 25, name: 'Ilaihi Yuraddu', startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
  { juz: 26, name: 'Ha Meem', startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
  { juz: 27, name: 'Qala Fama Khatbukum', startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
  { juz: 28, name: 'Qad Sami’a', startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
  { juz: 29, name: 'Tabarak', startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
  { juz: 30, name: 'Amma', startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];

export function getJuzRange(juz: number): JuzRange | undefined {
  return JUZ_RANGES.find((item) => item.juz === juz);
}
