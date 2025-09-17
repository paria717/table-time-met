
import { Component, inject, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import Highcharts from 'highcharts';
// import { RecordsService } from '../../services/records.service'; // اگر خواستی fallback API

type KV = { label: string; value: string | number | null };

@Component({
  standalone: true,
  selector: 'app-records-chart',
  imports: [CommonModule],
  styles: [`
    .card { @apply bg-white rounded-2xl shadow p-4; }
    .kv  { @apply grid grid-cols-2 gap-y-2; }
    .k   { @apply text-gray-500 font-medium; }
    .v   { @apply font-semibold; }
    .tbl { @apply min-w-full text-[15px] table-auto; }
    .th  { @apply text-right bg-gray-50 sticky top-0 z-10 px-3 py-2; }
    .td  { @apply px-3 py-2 border-b; }
  `],
  template: `
    <section class="container max-w-[1000px] mx-auto p-4 space-y-5" dir="rtl">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">جزئیات رکورد</h2>
        <button class="px-3 h-9 border rounded-md hover:bg-gray-50"
                (click)="goBack()">بازگشت</button>
      </div>
<div class="card">
  <h3 class="text-lg font-semibold mb-3">نمودار زمان بر حسب ایستگاه</h3>
  <div #chartContainer class="w-full h-[420px]"></div>
</div>
      <!-- اطلاعات اصلی -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-3">اطلاعات اصلی</h3>
        <div class="kv">
          <ng-container *ngFor="let item of meta()">
            <div class="k">{{ item.label }}</div>
            <div class="v">{{ item.value ?? '—' }}</div>
          </ng-container>
        </div>
      </div>

      <!-- ایستگاه‌ها -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-3">ایستگاه‌ها (براساس جهت)</h3>
        <div class="overflow-x-auto rounded-2xl border">
          <table class="tbl">
            <thead>
              <tr>
                <th class="th w-1/2">ایستگاه</th>
                <th class="th w-1/2">زمان</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of stations()">
                <td class="td">{{ s.label }}</td>
                <td class="td">{{ s.value ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- JSON کامل برای دیباگ/نیازهای خاص -->
      <details class="card">
        <summary class="cursor-pointer select-none font-semibold">مشاهدهٔ JSON کامل</summary>
        <pre class="mt-3 overflow-auto">{{ record() | json }}</pre>
      </details>
    </section>
  `
})
export class RecordsChartComponent {
  Highcharts: typeof Highcharts = Highcharts;
  @ViewChild('chartContainer') chartEl?: ElementRef<HTMLDivElement>;
  chartOptions: Highcharts.Options = {
  }

  private route = inject(ActivatedRoute);
  // private api = inject(RecordsService);

  record = signal<any | null>(null);
  id = signal<number | string | null>(null);


  private metaLabels: Record<string, string> = {
    id: 'شناسه',
    rowNum: 'ردیف',
    rowNum2: 'ردیف',
    dataType: 'کد نوع',
    dataTypeName: 'نوع',
    direction: 'جهت',
    date: 'تاریخ (میلادی)',
    dateP: 'تاریخ (شمسی)',
    trainNo: 'شماره قطار',
    headway: 'فاصله سیر (Headway)',
    dayType: 'کد نوع روز',
    dayTypeName: 'نوع روز',
    deptRank: 'اولویت حرکت',
    detail: 'توضیحات',
    createdUserId: 'کاربر ایجاد',
    createdDateTime: 'زمان ایجاد',
    updatedUserId: 'کاربر ویرایش',
    updatedDateTime: 'زمان ویرایش',
    deletedUserId: 'کاربر حذف',
    deletedDateTime: 'زمان حذف',
    isDeleted: 'حذف‌شده؟'
  };

  // ایستگاه‌ها برای هر جهت (کلیدها دقیقاً با فیلدها بخواند)
  private stationTitlesDir1 = [
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
    { key: 's137', title: 'علامه جعفری' }
  ];
  private stationTitlesDir2 = [...this.stationTitlesDir1].reverse().map((x, i) => ({
    key: (['s137', 's136', 's135', 's134', 's133', 's132', 's131', 's130', 's129', 's128', 's127', 's126', 's125', 's124', 's123', 's122', 's121', 's120', 's119', 's118'][i]),
    title: x.title
  }));



  constructor() {
    // 1) از state بخوان
    const st = history.state as any;

    if (st?.record) {
      this.record.set(st.record);
      this.id.set(st.record.id ?? st.record.Id ?? null);
      queueMicrotask(() => this.tryRenderChart());
    }

    this.route.paramMap.subscribe(() => {
      if (!this.record()) {
        // this.api.getById(+pid!).subscribe(r => { this.record.set(r); this.tryRenderChart(); });
      } else {
        this.tryRenderChart();
      }
    });
  }

  // اطلاعات اصلی به صورت لیست Key-Value
  meta = computed<KV[]>(() => {
    const r = this.record();
    if (!r) return [];

    const keys: string[] = [
      'id', 'rowNum', 'rowNum2', 'dataType', 'dataTypeName',
      'direction', 'date', 'dateP', 'trainNo', 'headway',
      'dayType', 'dayTypeName', 'deptRank',
      'detail', 'createdUserId', 'createdDateTime',
      'updatedUserId', 'updatedDateTime',
      'deletedUserId', 'deletedDateTime', 'isDeleted'
    ].filter(k => k in r);

    return keys.map(k => ({
      label: this.metaLabels[k] ?? k,
      value: r[k]
    }));
  });

  categories = computed<string[]>(() => {
    const r = this.record();
    if (!r) return [];
    const dir = Number(r.direction) === 1 ? 1 : 2;
    const titles = dir === 1 ? this.stationTitlesDir1 : this.stationTitlesDir2;
    return titles.map(t => t.title);
  });
  seriesData = computed<(number | null)[]>(() => {
    const r = this.record();
    if (!r) return [];
    const dir = Number(r.direction) === 1 ? 1 : 2;
    const titles = dir === 1 ? this.stationTitlesDir1 : this.stationTitlesDir2;
    return titles.map(t => this.timeToMs(r[t.key] as any));
  });
  chartTitle = computed<string>(() => {
    const r = this.record();
    const tn = r?.trainNo ?? '—';
    const tp = r?.dataTypeName ?? '';
    return `قطار ${tn} - ${tp}`;
  });
  ngAfterViewInit(): void {

    this.tryRenderChart();
  }
  private tryRenderChart() {
    if (!this.chartEl?.nativeElement) return;
    const r = this.record();
    if (!r) return;

    const categories = this.categories();
    const data = this.seriesData();

    Highcharts.chart(this.chartEl.nativeElement, {
      chart: { type: 'line', height: 420, style: { fontFamily: 'iransans, sans-serif' } },
      title: { text: this.chartTitle() },
      xAxis: { categories, tickmarkPlacement: 'on', title: { text: 'ایستگاه' } },
      yAxis: {
        type: 'datetime',
        title: { text: 'زمان' },
        labels: { format: '{value:%H:%M}' }
      },
      tooltip: {
        useHTML: true,
        formatter: function () {
          const time = Highcharts.dateFormat('%H:%M:%S', Number(this.y));
          return `<b>${this.x}</b><br/>${time}`;
        }
      },
      plotOptions: {
        series: { connectNulls: true, marker: { enabled: true } }
      },
      series: [{
        type: 'line',
        name: 'زمان',
        data
      }],
      credits: { enabled: false }
    } as Highcharts.Options);
  }

  // ← اضافه: تبدیل "HH:mm[:ss]" به میلی‌ثانیه
  private timeToMs(t?: string | null): number | null {
    if (!t) return null;
    const m = String(t).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const h = +m[1], min = +m[2], s = +(m[3] ?? 0);
    if (h > 47 || min > 59 || s > 59) return null;
    return ((h * 60 + min) * 60 + s) * 1000;
  }
  // جدول ایستگاه‌ها بر اساس جهت رکورد
  stations = computed<KV[]>(() => {
    const r = this.record();
    if (!r) return [];
    const dir = Number(r.direction) === 1 ? 1 : 2;
    const titles = dir === 1 ? this.stationTitlesDir1 : this.stationTitlesDir2;

    return titles.map(t => ({
      label: t.title,
      value: r[t.key] ?? null
    }));
  });

  goBack() {
    history.length > 1 ? history.back() : window.close();
  }
}
