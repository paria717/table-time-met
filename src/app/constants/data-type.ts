export  const DATA_TYPE_MAP: Record<number, string> = {
  1: 'زمان ورود',
  2: 'زمان خروج',
  3: 'میانگین',
  4: 'تاخير',
  5: 'تعجيل',
  6: 'زمان ورود + خروج',
};
 export const DATA_TYPE_OPTIONS_FIXED: { value: number; label: string }[] = [
  { value: 1, label: DATA_TYPE_MAP[1] },
  { value: 2, label: DATA_TYPE_MAP[2] },
  { value: 3, label: DATA_TYPE_MAP[3] },
  { value: 4, label: DATA_TYPE_MAP[4] },
  { value: 5, label: DATA_TYPE_MAP[5] },
  { value: 6, label: DATA_TYPE_MAP[6] },
];