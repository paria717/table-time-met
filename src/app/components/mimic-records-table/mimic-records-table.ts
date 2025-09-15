import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MimicLine4Service } from '../../services/mimic-records-line4.service';

@Component({
  selector: 'app-mimic-line4-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'mimic-records-table.html'
})
export class MimicLine4TableComponent implements AfterViewInit {
  private api = inject(MimicLine4Service);
  private cdr = inject(ChangeDetectorRef);

  loading = false;

  // همه‌ی داده‌ها
  all: any[] = [];

  // table 1
  dir1All: any[] = [];
  dir1Src: any[] = [];
  dir1Shown: any[] = [];
  dir1Keys: string[] = [];
  dir1Index = 0;
  dir1HasMore = true;
  dir1Loading = false;
  @ViewChild('sentinel1') sentinel1!: ElementRef<HTMLElement>;
  @ViewChild('root1') root1!: ElementRef<HTMLElement>;

  // table 2
  dir2All: any[] = [];
  dir2Src: any[] = [];
  dir2Shown: any[] = [];
  dir2Keys: string[] = [];
  dir2Index = 0;
  dir2HasMore = true;
  dir2Loading = false;
  @ViewChild('sentinel2') sentinel2!: ElementRef<HTMLElement>;
  @ViewChild('root2') root2!: ElementRef<HTMLElement>;

  // Observers (برای disconnect)
  private io1?: IntersectionObserver;
  private io2?: IntersectionObserver;


  visibleKeysTable1: string[] = [
    'dateP', 'trainNo', 'dataTypeName', 'dayTypeName',
    's118','s119','s120','s121','s122','s123','s124','s125','s126','s127',
    's128','s129','s130','s131','s132','s133','s134','s135','s136','s137'
  ];
  visibleKeysTable2: string[] = [
    'dateP', 'trainNo', 'dataTypeName', 'dayTypeName',
    's137','s136','s135','s134','s133','s132','s131','s130','s129','s128',
    's127','s126','s125','s124','s123','s122','s121','s120','s119','s118'
  ];

  // برچسب‌ها
  displayNames: Record<string, string> = {
    
    dateP: 'تاریخ',
    trainNo: 'شماره قطار',
    dataTypeName: 'نوع داده',
    dayTypeName: 'نوع روز',
    s118: 'کلاهدوز',
    s119: 'نیروهوایی',
    s120: 'نبرد',
    s121: 'پیروزی',
    s122: 'ابن‌سینا',
    s123: 'میدان شهدا',
    s124: 'دروازه شمیران',
    s125: 'دروازه دولت',
    s126: 'میدان فردوسی',
    s127: 'تئاتر شهر',
    s128: 'میدان انقلاب اسلامی',
    s129: 'توحید',
    s130: 'شادمان',
    s131: 'دکتر حبیب‌الله',
    s132: 'استاد معین',
    s133: 'میدان آزادی',
    s134: 'بیمه',
    s135: 'شهرک اکباتان',
    s136: 'ارم سبز',
    s137: 'علامه جعفری'
  };
  labelOf = (k: string) => this.displayNames[k] ?? k;

  // فیلتر/سورت تاریخ (شمسی)
  // مقدار ورودی جستجو: مانند 1404/06/21
  filterDateJalali: string | null = null;
  sortAsc1 = true;
  sortAsc2 = true;

  // اندازه هر بار لود
  readonly chunkSize = 50;

  ngAfterViewInit(): void {
    this.reload();
  }

  // ورودی تاریخ شمسی از UI (change یا Enter)
  onDateFilter(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = input.value?.trim() || '';
    this.filterDateJalali = raw ? this.normalizeJalali(raw) : null;
    this.applyFilterAndSort();
    this.resetViews();
    this.pushMore(1);
    this.pushMore(2);
    this.cdr.detectChanges();
    this.attachObservers();
  }
  clearDateFilter() {
    this.filterDateJalali = null;
    this.applyFilterAndSort();
    this.resetViews();
    this.pushMore(1);
    this.pushMore(2);
    this.cdr.detectChanges();
    this.attachObservers();
  }

  // مرتب‌سازی بر اساس تاریخ شمسی (datep)
  toggleSort(direction: 1 | 2) {
    if (direction === 1) this.sortAsc1 = !this.sortAsc1;
    else this.sortAsc2 = !this.sortAsc2;

    this.applyFilterAndSort(direction);
    this.resetViews();
    this.pushMore(1);
    this.pushMore(2);
    this.cdr.detectChanges();
    this.attachObservers();
  }

  // بارگذاری
  reload() {
    this.loading = true;
    this.api.getRecords().subscribe({
      next: (rows) => {
        this.all = rows ?? [];

        this.dir1All = this.all.filter(r => (r.direction ?? r.Direction) === 1);
        this.dir2All = this.all.filter(r => (r.direction ?? r.Direction) === 2);

        this.dir1Keys = this.buildKeys(this.dir1All[0]);
        this.dir2Keys = this.buildKeys(this.dir2All[0]);

        if (!this.visibleKeysTable1?.length) this.visibleKeysTable1 = [...this.dir1Keys];
        if (!this.visibleKeysTable2?.length) this.visibleKeysTable2 = [...this.dir2Keys];

        this.dir1Src = [...this.dir1All];
        this.dir2Src = [...this.dir2All];

        this.applyFilterAndSort();

        this.resetViews();

        // ابتدا یک برش بده تا sentinel رندر شود
        this.pushMore(1);
        this.pushMore(2);

        // سپس Observerها را وصل کن
        this.cdr.detectChanges();
        this.attachObservers();

        this.loading = false;
      },
      error: (e) => {
        console.error(e);
        this.all = [];
        this.dir1All = []; this.dir2All = [];
        this.dir1Src = []; this.dir2Src = [];
        this.dir1Keys = []; this.dir2Keys = [];
        this.resetViews();
        this.disconnectObservers();
        this.loading = false;
      }
    });
  }

  // فیلتر/سورت روی منابع رندر (براساس datep/DateP)
  private applyFilterAndSort(target?: 1 | 2) {
    const byDate = (r: any) => {
      if (!this.filterDateJalali) return true;
      const v = this.getDateValue(r);           // مثل "1404/06/21"
      if (!v) return false;
      // نرمال‌سازی برای مقایسه‌ی بی‌دردسر
      const lhs = this.normalizeJalali(v);
      const rhs = this.filterDateJalali!;
      return lhs === rhs;
    };

    if (!target || target === 1) {
      this.dir1Src = this.dir1All.filter(byDate);
      this.dir1Src.sort((a, b) => this.compareDate(a, b, this.sortAsc1));
    }
    if (!target || target === 2) {
      this.dir2Src = this.dir2All.filter(byDate);
      this.dir2Src.sort((a, b) => this.compareDate(a, b, this.sortAsc2));
    }
  }

  // مقایسه تاریخ شمسی (رشته "YYYY/MM/DD") با تبدیل به عدد yyyymmdd
  private compareDate(a: any, b: any, asc: boolean) {
    const toNum = (v?: string) => {
      if (!v) return 0;
      const s = this.normalizeJalali(v); // "1404/06/21"
      return Number(s.replace(/\D+/g, '')); // "14040621" → 14040621
    };
    const at = toNum(this.getDateValue(a));
    const bt = toNum(this.getDateValue(b));
    return asc ? at - bt : bt - at;
  }

  // گرفتن مقدار تاریخ از رکورد (datep/DateP)
  private getDateValue(r: any): string | undefined {
   return ( r?.dateP) as string | undefined;
  }

  // نرمال‌سازی تاریخ شمسی:
  // - تبدیل ارقام فارسی/عربی به انگلیسی
  // - جایگزینی جداکننده‌ها با "/"
  // - حذف فاصله‌های اضافه
  private normalizeJalali(s: string): string {
    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arDigits = '٠١٢٣٤٥٦٧٨٩';
    const enDigits = '0123456789';
    const mapDigit = (ch: string) => {
      const iFa = faDigits.indexOf(ch);
      if (iFa >= 0) return enDigits[iFa];
      const iAr = arDigits.indexOf(ch);
      if (iAr >= 0) return enDigits[iAr];
      return ch;
    };
    // تبدیل رقم‌ها
    let out = Array.from(s).map(mapDigit).join('');
    // یکدست کردن جداکننده
    out = out.replace(/[-_.]/g, '/');
    // حذف فاصله‌های اطراف
    out = out.trim();
    // اگر کاربر بدون صفر پیشرو بنویسه، همون‌طور می‌مونه (مثلاً 1404/6/2)
    // می‌تونی بخوای صفرگذاری هم بکنی؛ در صورت نیاز:
    const m = out.match(/^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/);
    if (m) {
      const y = m[1];
      const mo = m[2].padStart(2, '0');
      const d = m[3].padStart(2, '0');
      return `${y}/${mo}/${d}`;
    }
    return out;
  }

  private resetViews() {
    this.dir1Shown = []; this.dir1Index = 0;
    this.dir1HasMore = this.dir1Src.length > 0; this.dir1Loading = false;

    this.dir2Shown = []; this.dir2Index = 0;
    this.dir2HasMore = this.dir2Src.length > 0; this.dir2Loading = false;
  }

  private attachObservers() {
    if (!this.root1 || !this.root2 || !this.sentinel1 || !this.sentinel2) return;

    // هر بار قبل از ساخت جدید، قبلی‌ها را قطع کن
    this.disconnectObservers();

    const opts1: IntersectionObserverInit = { root: this.root1.nativeElement, rootMargin: '0px 0px 300px 0px' };
    const opts2: IntersectionObserverInit = { root: this.root2.nativeElement, rootMargin: '0px 0px 300px 0px' };

    this.io1 = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) this.pushMore(1);
    }, opts1);

    this.io2 = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) this.pushMore(2);
    }, opts2);

    this.io1.observe(this.sentinel1.nativeElement);
    this.io2.observe(this.sentinel2.nativeElement);
  }

  private disconnectObservers() {
    this.io1?.disconnect();
    this.io2?.disconnect();
    this.io1 = undefined;
    this.io2 = undefined;
  }

  private buildKeys(sample: any): string[] {
    if (!sample) return [];
    const all = Object.keys(sample);
    const drop = new Set([
      'id','ID','dataType','headway','dayType',
      'direction','Direction','isDeleted',
      'updatedDateTime','updatedUserId','detail',
      'deletedUserId','deletedDateTime','createdUserId','createdDateTime'
    ]);
    const filtered = all.filter(k => !drop.has(k));
    const idx = filtered.findIndex(k => ['trainNo','TrainNo'].includes(k));
    if (idx > 0) { const [k] = filtered.splice(idx, 1); filtered.unshift(k); }
    return filtered;
  }

  private pushMore(direction: 1 | 2) {
    if (direction === 1) {
      if (!this.dir1HasMore || this.dir1Loading) return;
      this.dir1Loading = true;
      const slice = this.dir1Src.slice(this.dir1Index, this.dir1Index + this.chunkSize);
      this.dir1Shown = this.dir1Shown.concat(slice);
      this.dir1Index += slice.length;
      this.dir1HasMore = this.dir1Index < this.dir1Src.length;
      this.dir1Loading = false;
    } else {
      if (!this.dir2HasMore || this.dir2Loading) return;
      this.dir2Loading = true;
      const slice = this.dir2Src.slice(this.dir2Index, this.dir2Index + this.chunkSize);
      this.dir2Shown = this.dir2Shown.concat(slice);
      this.dir2Index += slice.length;
      this.dir2HasMore = this.dir2Index < this.dir2Src.length;
      this.dir2Loading = false;
    }
  }

  trackByIndex = (i: number) => i;
}
