import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RecordsService, } from '../../services/records.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilterService } from '../../services/filter.service';
import { RecordItemsDto } from '../../domain/';
import { DATA_TYPE_MAP, DATA_TYPE_OPTIONS_FIXED, DAY_TYPE_MAP, DAY_TYPE_OPTIONS_FIXED } from '../../constants/index';

type Filters = {
  dataType?: string | number;
  trainNo?: string | number;
  dataTypeName?: string;
  dayTypeName?: string;

  dayType?: string | number;
  dateP?: string;
  dispatchNo?:string| number | undefined;
  [key: string]: string | number | undefined;
};


// const DATA_TYPE_OPTIONS_FIXED: { value: number; label: string }[] = [
//   { value: 1, label: DATA_TYPE_MAP[1] },
//   { value: 2, label: DATA_TYPE_MAP[2] },
//   { value: 3, label: DATA_TYPE_MAP[3] },
//   { value: 4, label: DATA_TYPE_MAP[4] },
//   { value: 5, label: DATA_TYPE_MAP[5] },
//   { value: 6, label: DATA_TYPE_MAP[6] },
// ];
// const DAY_TYPE_OPTIONS_FIXED: { value: number; label: string }[] = [
//   { value: 1, label: DAY_TYPE_MAP[1] },
//   { value: 2, label: DAY_TYPE_MAP[2] },
//   { value: 3, label: DAY_TYPE_MAP[3] },

// ];
type Column = { key: keyof RecordItemsDto; title: string };
@Component({
  selector: 'app-records-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './records-table.component.html',
  styleUrls: ['./records-table.component.css'],

})

export class RecordsTableComponent implements OnInit, OnDestroy {
  currentFilter: any = null;

  private pick3NeighborsAround(row: RecordItemsDto): RecordItemsDto[] {
    const list = this.rows();
    const idx = list.findIndex(x => x.id === row.id || x.id === row.id);
    if (idx < 0) return [row];

    // تلاش: از idx تا idx+3 (خودِ ردیف + دو ردیف بعدی)
    let chunk = list.slice(idx, idx + 3);

    // اگر به انتهای صفحه خورد و کمتر از 3 شد، از قبلش پر کن تا بشه 3تا
    if (chunk.length < 3) {
      const deficit = 3 - chunk.length;
      const start = Math.max(0, idx - deficit);
      chunk = list.slice(start, idx).concat(chunk);
    }
    // در نهایت فقط 3تا
    return chunk.slice(0, 3);
  }



  openDetails(r: RecordItemsDto) {
    this.filterService.setFilter({ ...this.filters });
    const bundle = this.pick3NeighborsAround(r);
    this.router.navigate(['/records-chart'], { state: { records: bundle } });
  }

  activeDirection = signal<1 | 2>(2);

  private stationTitlesDir1: Column[] =
    [
      { key: 's118', title: 'کلاهدوز' },
      { key: 's119', title: 'نیروهوایی' },
      { key: 's120', title: 'نبرد' },
      { key: 's121', title: 'پیروزی' },
      { key: 's122', title: 'ابن‌سینا' },
      { key: 's123', title: 'میدان شهدا' },
      { key: 's124', title: 'دروازه شمیران' },
      { key: 's125', title: 'دروازه دولت' },
      { key: 's126', title: 'میدان فردوسی' },
      { key: 's127', title: 'تئاتر شهر' },
      { key: 's128', title: 'میدان انقلاب اسلامی' },
      { key: 's129', title: 'توحید' },
      { key: 's130', title: 'شادمان' },
      { key: 's131', title: 'دکتر حبیب‌الله' },
      { key: 's132', title: 'استاد معین' },
      { key: 's133', title: 'میدان آزادی' },
      { key: 's134', title: 'بیمه' },
      { key: 's135', title: 'شهرک اکباتان' },
      { key: 's136', title: 'ارم سبز' },
      { key: 's137', title: 'علامه جعفری' },

    ];

  private stationTitlesDir2: Column[] = [
    { key: 's137', title: 'علامه جعفری' },
    { key: 's136', title: 'ارم سبز' },
    { key: 's135', title: 'شهرک اکباتان' },
    { key: 's134', title: 'بیمه' },
    { key: 's133', title: 'میدان آزادی' },
    { key: 's132', title: 'استاد معین' },
    { key: 's131', title: 'دکتر حبیب‌الله' },
    { key: 's130', title: 'شادمان' },
    { key: 's129', title: 'توحید' },
    { key: 's128', title: 'میدان انقلاب اسلامی' },
    { key: 's127', title: 'تئاتر شهر' },
    { key: 's126', title: 'میدان فردوسی' },
    { key: 's125', title: 'دروازه دولت' },
    { key: 's124', title: 'دروازه شمیران' },
    { key: 's123', title: 'میدان شهدا' },
    { key: 's122', title: 'ابن‌سینا' },
    { key: 's121', title: 'پیروزی' },
    { key: 's120', title: 'نبرد' },
    { key: 's119', title: 'نیروهوایی' },
    { key: 's118', title: 'کلاهدوز' }
  ];
  private row2: Column[] = [{ key: 'rowNum2', title: 'ردیف' },];
  private row1: Column[] = [{ key: 'rowNum', title: 'ردیف' },];
  // ستون‌های ثابت
  private baseColumns: Column[]
    = [
      { key: 'dispatchNo', title: 'شماره اعزام' },
      { key: 'dateP', title: 'تاریخ (شمسی)' },

      { key: 'trainNo', title: 'شماره قطار' },
      { key: 'dataType', title: 'نوع' },
      { key: 'dayType', title: 'نوع روز' },
      { key: 'totalTirpTime', title: 'مدت زمان سفر' }
    ];
  private isStationKey(key: string): key is `s${string}` {
    return /^s\d{3}$/i.test(key);
  }
  get columns() {
    return [...(this.activeDirection() === 1 ? this.row1 : this.row2),
    ...this.baseColumns,
    ...(this.activeDirection() === 1 ? this.stationTitlesDir1 : this.stationTitlesDir2)
    ];
  }
  getCell(row: RecordItemsDto, key: keyof RecordItemsDto) {
    if (this.isStationKey(String(key))) {
      const start = (row[key] as string | null | undefined) ?? null;
      const endKey = (String(key) + 'e') as keyof RecordItemsDto; // e.g. s134 -> s134e
      const end = (row[endKey] as string | null | undefined) ?? null;

      const a = start ?? '';
      const b = end ?? '';


      if (start && end) return `${b} — ${a}`;



      return `${b}${a}`;
    }
    if (key === 'dataType' && row.dataType !== null) {
      return DATA_TYPE_MAP[row.dataType] ?? row.dataType
    }
    if (key === 'dayType' && row.dayType !== null) {
      return DAY_TYPE_MAP[row.dayType] ?? row.dayType
    }
    // هر چیزی null/undefined بود، '—' برگردون
    const val = row[key] as unknown as string | number | null | undefined;
    return (val ?? '—');
  }

  // صفحه‌بندی
  pageNumber = signal(1);          // 1-based
  pageSize = signal(20);
  totalCount = signal(0);
  isLoading = signal(false);

  // دیتا
  rows = signal<RecordItemsDto[]>([]);


  dataTypeOptions = signal<{ value: number, label: string }[]>(DATA_TYPE_OPTIONS_FIXED);

  dayTypeOptions = signal<{ value: number, label: string }[]>(DAY_TYPE_OPTIONS_FIXED);
  // فیلترها
  private filters: Filters = {};
  private filterChange$ = new Subject<Partial<Filters>>();
  private destroy$ = new Subject<void>();

  constructor(private api: RecordsService, private router: Router, private filterService: FilterService) { }

  ngOnInit(): void {
    const stored = this.filterService.getFilter();
    if (stored) {
      this.filters = { ...stored };
      // set UI inputs if you use plain DOM inputs (you already query by .filter-input elsewhere)
      setTimeout(() => {
        Object.entries(this.filters).forEach(([k, v]) => {
          const el = document.querySelector<HTMLInputElement | HTMLSelectElement>(`.filter-input[name="${k}"]`);
          if (el) el.value = String(v ?? '');
        });
      }, 0);
    }
    // تغییر فیلترها با debounce → صفحه 1 → لود
    this.filterChange$
      .pipe(
        debounceTime(350),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$)
      )
      .subscribe(patch => {
        this.filters = { ...this.filters, ...patch };
        this.pageNumber.set(1);
        this.loadData();
      });

    this.loadData();
  }

  private buildFilters(): Record<string, string | number> {
    const f = this.filters;
    const allowed = new Set(['dispatchNo','dataType', 'trainNo', 'dataTypeName', 'dayTypeName', 'dayType', 'dateP']);
    const out: Record<string, string | number> = {};

    for (const [k, v] of Object.entries(f)) {
      if (!allowed.has(k)) continue;
      if (v === undefined || v === null || String(v).trim() === '') continue;
      if (k === 'dataType' || k === 'trainNo' || k ==='dispatchNo') {
        out[k] = Number(v);
      } else {
        out[k] = String(v).trim();
      }
    }
    return out;
  }

  loadData(): void {
    this.isLoading.set(true);

    this.api.getRecords(this.activeDirection(), {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      filters: this.buildFilters(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.rows.set(res.result ?? []);

          this.totalCount.set(res.count ?? 0);
          this.isLoading.set(false);

        },

        error: _ => { this.isLoading.set(false); }
      });
  }

  onFilterInput(field: keyof Filters, ev: Event) {
    const value = (ev.target as HTMLInputElement)?.value ?? '';
    this.onFilterChange(field, value);
  }

  onFilterSelect(field: keyof Filters, ev: Event) {
    const value = (ev.target as HTMLSelectElement)?.value ?? '';
    this.onFilterChange(field, value);
  }

  // pagination helpers
  canPrev() { return this.pageNumber() > 1; }
  canNext() {
    const pages = Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
    return this.pageNumber() < pages;
  }
  goPrev() {
    if (!this.canPrev()) return;
    this.pageNumber.set(this.pageNumber() - 1);
    this.loadData();
  }
  goNext() {
    if (!this.canNext()) return;
    this.pageNumber.set(this.pageNumber() + 1);
    this.loadData();
  }
  changePageSize(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return;
    this.pageSize.set(n);
    this.pageNumber.set(1);
    this.loadData();
  }

  // toggle direction
  toggleDirection() {
    this.activeDirection.set(this.activeDirection() === 1 ? 2 : 1);
    this.pageNumber.set(1);
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  onFilterChange(field: keyof Filters, value: string) {
    this.filterChange$.next({ [field]: value });
  }
  onFilterChangeNo(field: keyof Filters, value: number) {
    this.filterChange$.next({ [field]: value });
  }

  showFilters = signal(true); // پیش‌فرض: فیلترها باز باشن
  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  onDateInput(ev: Event) {
    let v = (ev.target as HTMLInputElement).value || '';

    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arDigits = '٠١٢٣٤٥٦٧٨٩';
    v = v.replace(/[۰-۹]/g, d => String(faDigits.indexOf(d)))
      .replace(/[٠-٩]/g, d => String(arDigits.indexOf(d)));

    const digits = v.replace(/\D/g, '').slice(0, 8); // YYYYMMDD
    let out = digits;
    if (digits.length > 4) out = digits.slice(0, 4) + '/' + digits.slice(4);
    if (digits.length > 6) out = out.slice(0, 7) + '/' + out.slice(7);

    (ev.target as HTMLInputElement).value = out;
    this.onFilterChange('dateP', out);
  }
  resetFilters() {
    // فیلترها رو پاک کن
    this.filters = {};

    // همه‌ی input ها و select ها رو خالی کن
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.filter-input');
    inputs.forEach(el => el.value = '');

    // صفحه رو برگردون به 1 و لود دوباره
    this.pageNumber.set(1);
    this.loadData();
    this.filterService.setFilter(null);
  }
  showHelp = false;

  openHelp() {
    this.showHelp = true;
  }

  closeHelp() {
    this.showHelp = false;
  }

}