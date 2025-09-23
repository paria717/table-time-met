export const DAY_TYPE_MAP: Record<number, string> = {
  1: 'عادی',
  2: 'پنجشنبه',
  3: 'جمعه'
};
export const DAY_TYPE_OPTIONS_FIXED: { value: number; label: string }[] = [
  { value: 1, label: DAY_TYPE_MAP[1] },
  { value: 2, label: DAY_TYPE_MAP[2] },
  { value: 3, label: DAY_TYPE_MAP[3] },

];