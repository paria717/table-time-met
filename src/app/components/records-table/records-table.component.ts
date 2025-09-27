import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RecordsService, } from '../../services/records.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilterService } from '../../services/filter.service';
import { RecordItemsDto } from '../../domain/';
import { DATA_TYPE_MAP, DATA_TYPE_OPTIONS_FIXED, DAY_TYPE_MAP, DAY_TYPE_OPTIONS_FIXED } from '../../constants/index';
import { HtmlParser } from '@angular/compiler'; import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
type Filters = {
  dataType?: string | number;
  trainNo?: string | number;
  dataTypeName?: string;
  dayTypeName?: string;
  dayType?: string | number;
  dateP?: string;
  dispatchNo?: string | number | undefined;
  totalTirpTime?: number | undefined;
  totalArriveTime?: number | undefined;
  totalStopTime?: number | undefined;
  [key: string]: string | number | undefined;
};

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

  private pick5NeighborsAround(row: RecordItemsDto): RecordItemsDto[] {
    const list = this.rows();
    const idx = list.findIndex(x => x.id === row.id || x.id === row.id);
    if (idx < 0) return [row];

    // تلاش: از idx تا idx+3 (خودِ ردیف + دو ردیف بعدی)
    let chunk = list.slice(idx, idx + 5);

    // اگر به انتهای صفحه خورد و کمتر از 3 شد، از قبلش پر کن تا بشه 3تا
    if (chunk.length < 5) {
      const deficit = 5 - chunk.length;
      const start = Math.max(0, idx - deficit);
      chunk = list.slice(start, idx).concat(chunk);
    }
    // در نهایت فقط 3تا
    return chunk.slice(0, 5);
  }



  openDetails(r: RecordItemsDto) {
    this.filterService.setFilter({ ...this.filters });
    const bundle = this.pick5NeighborsAround(r);
    this.router.navigate(['/records-chart'], { state: { records: bundle } });
  }

  activeDirection = signal<1 | 2>(2);

  private stationTitlesDir1: Column[] = [
    { key: 's118', title: 'کلاهدوز' },
    { key: 's118a', title: '  کلاهدوز به نیروهوایی (ثانیه)' },

    { key: 's119', title: 'نیروهوایی' },
    { key: 's119stop', title: ' توقف در نیروهوایی (ثانیه) ' },
    { key: 's119a', title: '(ثانیه)  نیروهوایی به نبرد' },

    { key: 's120', title: 'نبرد' },
    { key: 's120stop', title: ' توقف در نبرد (ثانیه)' },
    { key: 's120a', title: '  نبرد به پیروزی (ثانیه)' },

    { key: 's121', title: 'پیروزی' },
    { key: 's121stop', title: ' توقف در پیروزی (ثانیه)' },
    { key: 's121a', title: '  پیروزی به ابن‌سینا (ثانیه)' },

    { key: 's122', title: 'ابن‌سینا' },
    { key: 's122stop', title: ' توقف در ابن‌سینا (ثانیه)' },
    { key: 's122a', title: '  ابن‌سینا به میدان شهدا (ثانیه)' },

    { key: 's123', title: 'میدان شهدا' },
    { key: 's123stop', title: ' توقف در میدان شهدا (ثانیه)' },
    { key: 's123a', title: '  میدان شهدا به دروازه شمیران (ثانیه)' },

    { key: 's124', title: 'دروازه شمیران' },
    { key: 's124stop', title: ' توقف در دروازه شمیران (ثانیه)' },
    { key: 's124a', title: '  دروازه شمیران به دروازه دولت (ثانیه)' },

    { key: 's125', title: 'دروازه دولت' },
    { key: 's125stop', title: ' توقف در دروازه دولت (ثانیه)' },
    { key: 's125a', title: '  دروازه دولت به میدان فردوسی (ثانیه)' },

    { key: 's126', title: 'میدان فردوسی' },
    { key: 's126stop', title: ' توقف در میدان فردوسی (ثانیه)' },
    { key: 's126a', title: '  میدان فردوسی به تئاتر شهر (ثانیه)' },

    { key: 's127', title: 'تئاتر شهر' },
    { key: 's127stop', title: ' توقف در تئاتر شهر (ثانیه)' },
    { key: 's127a', title: '  تئاتر شهر به میدان انقلاب اسلامی (ثانیه)' },

    { key: 's128', title: 'میدان انقلاب اسلامی' },
    { key: 's128stop', title: ' توقف در میدان انقلاب اسلامی (ثانیه)' },
    { key: 's128a', title: '  میدان انقلاب اسلامی به توحید (ثانیه)' },

    { key: 's129', title: 'توحید' },
    { key: 's129stop', title: ' توقف در توحید (ثانیه)' },
    { key: 's129a', title: '  توحید به شادمان (ثانیه)' },

    { key: 's130', title: 'شادمان' },
    { key: 's130stop', title: ' توقف در شادمان (ثانیه)' },
    { key: 's130a', title: '  شادمان به دکتر حبیب‌الله (ثانیه)' },

    { key: 's131', title: 'دکتر حبیب‌الله' },
    { key: 's131stop', title: ' توقف در دکتر حبیب‌الله (ثانیه)' },
    { key: 's131a', title: '  دکتر حبیب‌الله به استاد معین (ثانیه)' },

    { key: 's132', title: 'استاد معین' },
    { key: 's132stop', title: ' توقف در استاد معین (ثانیه)' },
    { key: 's132a', title: '  استاد معین به میدان آزادی (ثانیه)' },

    { key: 's133', title: 'میدان آزادی' },
    { key: 's133stop', title: ' توقف در میدان آزادی (ثانیه)' },
    { key: 's133a', title: '  میدان آزادی به بیمه (ثانیه)' },

    { key: 's134', title: 'بیمه' },
    { key: 's134stop', title: ' توقف در بیمه (ثانیه)' },
    { key: 's134a', title: '  بیمه به شهرک اکباتان (ثانیه)' },

    { key: 's135', title: 'شهرک اکباتان' },
    { key: 's135stop', title: ' توقف در شهرک اکباتان (ثانیه)' },
    { key: 's135a', title: '  شهرک اکباتان به ارم سبز (ثانیه)' },

    { key: 's136', title: 'ارم سبز' },
    { key: 's136stop', title: ' توقف در ارم سبز (ثانیه)' },
    { key: 's136a', title: '  ارم سبز به علامه جعفری (ثانیه)' },

    { key: 's137', title: 'علامه جعفری' },
    { key: 's137stop', title: ' توقف در علامه جعفری (ثانیه)' },
  ];

  private stationTitlesDir2: Column[] = [
    { key: 's137', title: 'علامه جعفری' },
    { key: 's137stop', title: ' توقف در علامه جعفری (ثانیه)' },
    { key: 's137a', title: '  علامه جعفری به ارم سبز(ثانیه)' },

    { key: 's136', title: 'ارم سبز' },
    { key: 's136stop', title: ' توقف در ارم سبز(ثانیه)' },
    { key: 's136a', title: '  ارم سبز به شهرک اکباتان(ثانیه)' },

    { key: 's135', title: 'شهرک اکباتان' },
    { key: 's135stop', title: ' توقف در شهرک اکباتان(ثانیه)' },
    { key: 's135a', title: '  شهرک اکباتان به بیمه(ثانیه)' },

    { key: 's134', title: 'بیمه' },
    { key: 's134stop', title: ' توقف در بیمه' },
    { key: 's134a', title: '  بیمه به میدان آزادی (ثانیه)' },

    { key: 's133', title: 'میدان آزادی' },
    { key: 's133stop', title: ' توقف در میدان آزادی (ثانیه)' },
    { key: 's133a', title: '  میدان آزادی به استاد معین (ثانیه)' },

    { key: 's132', title: 'استاد معین' },
    { key: 's132stop', title: ' توقف در استاد معین (ثانیه)' },
    { key: 's132a', title: '  استاد معین به دکتر حبیب‌الله (ثانیه)' },

    { key: 's131', title: 'دکتر حبیب‌الله' },
    { key: 's131stop', title: ' توقف در دکتر حبیب‌الله (ثانیه)' },
    { key: 's131a', title: '  دکتر حبیب‌الله به شادمان (ثانیه)' },

    { key: 's130', title: 'شادمان' },
    { key: 's130stop', title: ' توقف در شادمان (ثانیه)' },
    { key: 's130a', title: '  شادمان به توحید (ثانیه)' },

    { key: 's129', title: 'توحید' },
    { key: 's129stop', title: ' توقف در توحید (ثانیه)' },
    { key: 's129a', title: '  توحید به میدان انقلاب اسلامی (ثانیه)' },

    { key: 's128', title: 'میدان انقلاب اسلامی' },
    { key: 's128stop', title: ' توقف در میدان انقلاب اسلامی (ثانیه)' },
    { key: 's128a', title: '  میدان انقلاب اسلامی به تئاتر شهر (ثانیه)' },

    { key: 's127', title: 'تئاتر شهر' },
    { key: 's127stop', title: ' توقف در تئاتر شهر (ثانیه)' },
    { key: 's127a', title: '  تئاتر شهر به میدان فردوسی (ثانیه)' },

    { key: 's126', title: 'میدان فردوسی' },
    { key: 's126stop', title: ' توقف در میدان فردوسی (ثانیه)' },
    { key: 's126a', title: '  میدان فردوسی به دروازه دولت (ثانیه)' },

    { key: 's125', title: 'دروازه دولت' },
    { key: 's125stop', title: ' توقف در دروازه دولت (ثانیه)' },
    { key: 's125a', title: '  دروازه دولت به دروازه شمیران (ثانیه)' },

    { key: 's124', title: 'دروازه شمیران' },
    { key: 's124stop', title: ' توقف در دروازه شمیران (ثانیه)' },
    { key: 's124a', title: '  دروازه شمیران به میدان شهدا (ثانیه)' },

    { key: 's123', title: 'میدان شهدا' },
    { key: 's123stop', title: ' توقف در میدان شهدا (ثانیه)' },
    { key: 's123a', title: '  میدان شهدا به ابن‌سینا (ثانیه)' },

    { key: 's122', title: 'ابن‌سینا' },
    { key: 's122stop', title: ' توقف در ابن‌سینا (ثانیه)' },
    { key: 's122a', title: '  ابن‌سینا به پیروزی (ثانیه)' },

    { key: 's121', title: 'پیروزی' },
    { key: 's121stop', title: ' توقف در پیروزی (ثانیه)' },
    { key: 's121a', title: '  پیروزی به نبرد (ثانیه)' },

    { key: 's120', title: 'نبرد' },
    { key: 's120stop', title: ' توقف در نبرد (ثانیه)' },
    { key: 's120a', title: '  نبرد به نیروهوایی (ثانیه)' },

    { key: 's119', title: 'نیروهوایی' },
    { key: 's119stop', title: ' توقف در نیروهوایی (ثانیه)' },
    { key: 's119a', title: '  نیروهوایی به کلاهدوز (ثانیه)' },

    { key: 's118', title: 'کلاهدوز' },
    { key: 's118stop', title: ' توقف در کلاهدوز (ثانیه)' },
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
      { key: 'totalTirpTime', title: 'کل مدت زمان سفر (دقیقه)' },
      { key: 'totalStopTime', title: 'کل مدت زمان توقف (ثانیه)' },
      { key: 'totalArriveTime', title: 'کل مدت زمان حرکت (ثانیه)' }

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
    const val = row[key] as unknown as string | number | null | undefined;


    if ((key === 'totalStopTime' || key === 'totalArriveTime' || key === 's118a' || key === 's119a' || key === 's120a' || key === 's121a' || key === 's122a' ||
      key === 's123a' || key === 's124a' || key === 's125a' || key === 's126a' || key === 's127a' || key === 's128a' ||
      key === 's129a' || key === 's130a' || key === 's131a' || key === 's132a' || key === 's133a' || key === 's134a' || key === 's135a' || key === 's136a' || key == 's137a'
    ) && val !== null && typeof val === 'number' && val !== 0) {
      const absVal = Math.abs(val);

      const minutes = Math.floor(absVal / 60);
      return this.sanitizer.bypassSecurityTrustHtml(`(دقیقه <span class="text-red-500">${minutes}</span> )${absVal}`);
    }
    // هر چیزی null/undefined بود، '—' برگردون

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
  private filters: Filters = {

  };
  private filterChange$ = new Subject<Partial<Filters>>();
  private destroy$ = new Subject<void>();

  constructor(private api: RecordsService, private router: Router, private filterService: FilterService, private sanitizer: DomSanitizer) { }

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
    const allowed = new Set(['dispatchNo', 'dataType', 'trainNo', 'dataTypeName', 'dayTypeName', 'dayType', 'dateP', 'totalTirpTime', 'totalArriveTime', 'totalStopTime']);
    const out: Record<string, string | number> = {};

    for (const [k, v] of Object.entries(f)) {
      if (!allowed.has(k)) continue;
      if (v === undefined || v === null || String(v).trim() === '') continue;
      if (k === 'dataType' || k === 'trainNo' || k === 'dispatchNo') {
        out[k] = Number(v);
      } else {
        out[k] = String(v).trim();
      }
    }
    return out;
  }

  sortBy = signal<{ propertyName: keyof RecordItemsDto; method: 0 | 1 } | null>(null);
  orderBy(field: keyof RecordItemsDto) {
    const cur = this.sortBy();

    if (!cur || cur.propertyName !== field) {
      this.sortBy.set({ propertyName: field, method: 0 }); // Asc
    } else {
      this.sortBy.set({
        propertyName: field,
        method: cur.method === 0 ? 1 : 0, // toggle
      });
    }
    this.pageNumber.set(1);
    this.loadData(); // fetch با وضعیت جدید
  }


  private buildSortingForApi():
    | { conditions: { propertyName: string; method: 0 | 1 }[] }
    | undefined {
    const s = this.sortBy();
    if (!s) return undefined;
    return { conditions: [{ propertyName: s.propertyName, method: s.method }] };
  }

  loadData(): void {
    this.isLoading.set(true);

    this.api.getRecords(this.activeDirection(), {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      filters: this.buildFilters(),
      sorting: this.buildSortingForApi(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          const data = (res.result ?? []).slice();


          this.rows.set(data);
          this.totalCount.set(res.count ?? 0);
          this.isLoading.set(false);

          // اگر بک‌اند nullها را خوب هندل نمی‌کند، این سورت کلاینتی نتیجه را اصلاح می‌کند
          // this.applyClientSort();
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