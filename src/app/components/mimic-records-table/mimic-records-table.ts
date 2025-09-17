import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MimicLine4Service } from '../../services/mimic-records-line4.service';
import { displayNames, visibleKeysTable1, visibleKeysTable2 } from '../../config/columns.config';
import { buildDisplayKeys } from '../../utils/table.util';
import { compareJalali, normalizeJalali } from '../../utils/jalali-date.util';
import { CHUNK_SIZE } from '../../config/pagination.config';

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

  // UI Config
  visibleKeysTable1 = [...visibleKeysTable1];
  visibleKeysTable2 = [...visibleKeysTable2];
  displayNames = displayNames;
  labelOf = (k: string) => this.displayNames[k] ?? k;


  // فیلتر/سورت تاریخ (شمسی)
  // مقدار ورودی جستجو: مانند 1404/06/21
  filterDateJalali: string | null = null;
  sortAsc1 = true;
  sortAsc2 = true;
  filterTime: string | null = null;
  trainNoFilter: number | null = null;


  ngAfterViewInit(): void {
    this.reload();
  }
  // ontimeFilter(e: Event) {
  //   const input = e.target as HTMLInputElement;

  // }
  onTrainNoFilter(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = (input.value ?? "").trim();
    this.trainNoFilter = raw ? Number(raw) : null;
    this.applyFilterAndSort();
    this.resetViews();
    this.pushMore(1);
    this.pushMore(2);
    this.cdr.detectChanges();
    this.attachObservers();
  }
  private getTrainNoValue(r: any): number | undefined {
    const v = r?.trainNo;
    if(v==null) return undefined;
    const s= String(v);
  const n = Number(this.toEnDigits(s));
    return Number.isFinite(n) ? n : undefined;
  }
  // ورودی تاریخ شمسی از UI (change یا Enter)
  onDateFilter(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = input.value?.trim() || '';
    this.filterDateJalali = raw ? normalizeJalali(raw) : null;
    this.applyFilterAndSort();
    this.resetViews();
    this.pushMore(1);
    this.pushMore(2);
    this.cdr.detectChanges();
    this.attachObservers();
  }
  private toEnDigits(s: string): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩', en = '0123456789';
  return Array.from(s).map(ch => {
    const iFa = fa.indexOf(ch); if (iFa >= 0) return en[iFa];
    const iAr = ar.indexOf(ch); if (iAr >= 0) return en[iAr];
    return ch;
  }).join('');
}
  // گرفتن مقدار تاریخ از رکورد (datep/DateP)
  private getDateValue(r: any): string | undefined {
    return (r?.dateP ?? r?.DateP) as string | undefined;
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
    this.api.getRecords(1).subscribe({
      next: (rows) => {
        this.all = rows ?? [];

        this.dir1All = this.all.filter(r => (r.direction ?? r.Direction) === 1);
        //this.dir2All = this.all.filter(r => (r.direction ?? r.Direction) === 2);

        this.dir1Keys = buildDisplayKeys(this.dir1All[0]);
        //this.dir2Keys = buildDisplayKeys(this.dir2All[0]);

        if (!this.visibleKeysTable1?.length) this.visibleKeysTable1 = [...this.dir1Keys];
        //if (!this.visibleKeysTable2?.length) this.visibleKeysTable2 = [...this.dir2Keys];

        this.dir1Src = [...this.dir1All];
        //this.dir2Src = [...this.dir2All];

        this.applyFilterAndSort();

        this.resetViews();

        // ابتدا یک برش بده تا sentinel رندر شود
        this.pushMore(1);
        //this.pushMore(2);

        // سپس Observerها را وصل کن
        this.cdr.detectChanges();
        this.attachObservers();

        this.loading = false;
      },
      error: (e) => {
        console.error(e);
        this.all = [];
        this.dir1All = []; //this.dir2All = [];
        this.dir1Src = []; //this.dir2Src = [];
        this.dir1Keys = []; //this.dir2Keys = [];
        this.resetViews();
        this.disconnectObservers();
        this.loading = false;
      }
    });


    this.api.getRecords(2).subscribe({
      next: (rows) => {
        this.all = rows ?? [];

        //this.dir1All = this.all.filter(r => (r.direction ?? r.Direction) === 1);
        this.dir2All = this.all.filter(r => (r.direction ?? r.Direction) === 2);

        //this.dir1Keys = buildDisplayKeys(this.dir1All[0]);
        this.dir2Keys = buildDisplayKeys(this.dir2All[0]);

        //if (!this.visibleKeysTable1?.length) this.visibleKeysTable1 = [...this.dir1Keys];
        if (!this.visibleKeysTable2?.length) this.visibleKeysTable2 = [...this.dir2Keys];

        //this.dir1Src = [...this.dir1All];
        this.dir2Src = [...this.dir2All];

        this.applyFilterAndSort();

        this.resetViews();

        // ابتدا یک برش بده تا sentinel رندر شود
        //this.pushMore(1);
        this.pushMore(2);

        // سپس Observerها را وصل کن
        this.cdr.detectChanges();
        this.attachObservers();

        this.loading = false;
      },
      error: (e) => {
        console.error(e);
        this.all = [];
        /*this.dir1All = [];*/ this.dir2All = [];
        /*this.dir1Src = [];*/ this.dir2Src = [];
        /*this.dir1Keys = [];*/ this.dir2Keys = [];
        this.resetViews();
        this.disconnectObservers();
        this.loading = false;
      }
    });
    // this.api.getRecords().subscribe({

    //   next: (rows) => {
    //     this.all = rows ?? [];

    //     this.dir1All = this.all.filter(r => (r.direction ?? r.Direction) === 1);
    //     this.dir2All = this.all.filter(r => (r.direction ?? r.Direction) === 2);

    //     this.dir1Keys = buildDisplayKeys(this.dir1All[0]);
    //     this.dir2Keys = buildDisplayKeys(this.dir2All[0]);

    //     if (!this.visibleKeysTable1?.length) this.visibleKeysTable1 = [...this.dir1Keys];
    //     if (!this.visibleKeysTable2?.length) this.visibleKeysTable2 = [...this.dir2Keys];

    //     this.dir1Src = [...this.dir1All];
    //     this.dir2Src = [...this.dir2All];

    //     this.applyFilterAndSort();

    //     this.resetViews();

    //     // ابتدا یک برش بده تا sentinel رندر شود
    //     this.pushMore(1);
    //     this.pushMore(2);

    //     // سپس Observerها را وصل کن
    //     this.cdr.detectChanges();
    //     this.attachObservers();

    //     this.loading = false;
    //   },
    //   error: (e) => {
    //     console.error(e);
    //     this.all = [];
    //     this.dir1All = []; this.dir2All = [];
    //     this.dir1Src = []; this.dir2Src = [];
    //     this.dir1Keys = []; this.dir2Keys = [];
    //     this.resetViews();
    //     this.disconnectObservers();
    //     this.loading = false;
    //   }
    // });
  }
    clearTrainNoFilter() {
  this.trainNoFilter = null;
  this.applyFilterAndSort();
  this.resetViews();
  this.pushMore(1); this.pushMore(2);
  this.cdr.detectChanges();
  this.attachObservers();
}
  // فیلتر/سورت روی منابع رندر (براساس datep/DateP)
  private applyFilterAndSort(target?: 1 | 2) {
    const byDate = (r: any) => {
      if (!this.filterDateJalali) return true;
      const v = this.getDateValue(r);           // مثل "1404/06/21"
      if (!v) return false;
      // نرمال‌سازی برای مقایسه‌ی بی‌دردسر
      const lhs = normalizeJalali(v);
      const rhs = this.filterDateJalali!;
      return lhs === rhs;
    };

const byTrainNo = (r:any)=>{
  if(this.trainNoFilter==null) return true ;
  const tn= this.getTrainNoValue(r);
  return tn === this.trainNoFilter;
}
const predicate =(r:any)=> byDate(r);
    if (!target || target === 1) {
      this.dir1Src = this.dir1All.filter(predicate);
      this.dir1Src.sort((a, b) => compareJalali(this.getDateValue(a), this.getDateValue(b), this.sortAsc1));
    }
    if (!target || target === 2) {
      this.dir2Src = this.dir2All.filter(predicate);
      this.dir2Src.sort((a, b) => compareJalali(this.getDateValue(a), this.getDateValue(b), this.sortAsc2));
    }
  }



  private resetViews() {
    this.dir1Shown = []; this.dir1Index = 0;
    this.dir1HasMore = this.dir1Src.length > 0; this.dir1Loading = false;

    this.dir2Shown = []; this.dir2Index = 0;
    this.dir2HasMore = this.dir2Src.length > 0; this.dir2Loading = false;
  }

  private attachObservers() {
    this.disconnectObservers();
    if (this.activeDirection === 1) {
      if (!this.root1 || !this.sentinel1) return;
      const opts1: IntersectionObserverInit = { root: this.root1.nativeElement, rootMargin: '0px 0px 300px 0px' };
      this.io1 = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) this.pushMore(1);
      }, opts1);
      this.io1.observe(this.sentinel1.nativeElement);
    } else {
      if (!this.root2 || !this.sentinel2) return;
      const opts2: IntersectionObserverInit = { root: this.root2.nativeElement, rootMargin: '0px 0px 300px 0px' };
      this.io2 = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) this.pushMore(2);
      }, opts2);
      this.io2.observe(this.sentinel2.nativeElement);
    }
  }

  private disconnectObservers() {
    this.io1?.disconnect();
    this.io2?.disconnect();
    this.io1 = undefined;
    this.io2 = undefined;
  }



  private pushMore(direction: 1 | 2) {
    if (direction === 1) {
      if (!this.dir1HasMore || this.dir1Loading) return;
      this.dir1Loading = true;
      const slice = this.dir1Src.slice(this.dir1Index, this.dir1Index + CHUNK_SIZE);
      this.dir1Shown = this.dir1Shown.concat(slice);
      this.dir1Index += slice.length;
      this.dir1HasMore = this.dir1Index < this.dir1Src.length;
      this.dir1Loading = false;
    } else {
      if (!this.dir2HasMore || this.dir2Loading) return;
      this.dir2Loading = true;
      const slice = this.dir2Src.slice(this.dir2Index, this.dir2Index + CHUNK_SIZE);
      this.dir2Shown = this.dir2Shown.concat(slice);
      this.dir2Index += slice.length;
      this.dir2HasMore = this.dir2Index < this.dir2Src.length;
      this.dir2Loading = false;
    }
  }
  activeDirection: 1 | 2 = 1;
  toggleDirection() {
    this.activeDirection = this.activeDirection === 1 ? 2 : 1;
    if (this.activeDirection === 1 && this.dir1Shown.length === 0 && this.dir1Src.length) {
      this.pushMore(1);
    } if (this.activeDirection === 2 && this.dir2Shown.length === 0 && this.dir2Src.length) {
      this.pushMore(2);
    }
    this.cdr.detectChanges();
    this.attachObservers();
  }
  trackByIndex = (i: number) => i;
}
