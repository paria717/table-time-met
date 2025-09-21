
import { Component, inject, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import Highcharts, { color } from 'highcharts';
// import { RecordsService } from '../../services/records.service'; // اگر خواستی fallback API

type KV = { label: string; value: string | number | null };

@Component({
  standalone: true,
  selector: 'app-records-chart',
  imports: [CommonModule],

  template: `
 <section class="w-screen h-screen p-10 m-0" dir="rtl">
  <div class="flex items-center justify-between mb-4">
  
    <h3 class="text-lg" style="font-family: 'Yekan Bakh'">نمودار زمان بر حسب ایستگاه</h3>
      <button class="px-3 h-9 border rounded-md hover:bg-gray-50"
            (click)="goBack()">بازگشت</button>
  </div>

  <div class="w-full h-full" >
    <div #chartContainer class="w-full h-full"></div>
  </div>
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
    dataType: ' نوع',
    dataTypeName: 'عنوان نوع',
    direction: 'جهت',
    date: 'تاریخ (میلادی)',
    dateP: 'تاریخ (شمسی)',
    trainNo: 'شماره قطار',
    headway: 'فاصله سیر (Headway)',
    dayType: ' نوع روز',
    dayTypeName: 'عنوان نوع روز',
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

  DATA_TYPE_MAP: Record<number, string> = {
    1: 'زمان ورود',
    2: 'زمان خروج',
    3: 'میانگین',
    4: 'تاخير',
    5: 'تعجيل',
    6: 'زمان ورود + خروج',
  };


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
        console.log('record', this.record());

        this.tryRenderChart();
      }
    });
  }

  // اطلاعات اصلی به صورت لیست Key-Value
  // meta = computed<KV[]>(() => {
  //   const r = this.record();
  //   if (!r) return [];

  //   const keys: string[] = [
  //     'id', 'rowNum', 'rowNum2', 'dataType', 'dataTypeName',
  //     'direction', 'date', 'dateP', 'trainNo', 'headway',
  //     'dayType', 'dayTypeName', 'deptRank',
  //     'detail', 'createdUserId', 'createdDateTime',
  //     'updatedUserId', 'updatedDateTime',
  //     'deletedUserId', 'deletedDateTime', 'isDeleted'
  //   ].filter(k => k in r);

  //   return keys.map(k => ({
  //     label: this.metaLabels[k] ?? k,
  //     value: r[k]
  //   }));
  // });

  categories = computed<string[]>(() => {
    const r = this.record();
    if (!r) return [];
    const dir = Number(r.direction) === 1 ? 1 : 2;
    const titles = dir === 1 ? this.stationTitlesDir1 : this.stationTitlesDir2;
    let t = titles.map(t => t.title);
    console.log('t', t);
    return t;
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
    const tp = this.DATA_TYPE_MAP[r?.dataType] ?? '';
    return `قطار ${tn} - ${tp}`;
  });
  ngAfterViewInit(): void {

    this.tryRenderChart();
  }
  private tryRenderChart() {
    if (!this.chartEl?.nativeElement) return;
    const r = this.record();
    if (!r) return;

    const titles = this.categories(); // نام ایستگاه‌ها
    const dir = Number(r.direction) === 1 ? 1 : 2;
    const titlesMeta = dir === 1 ? this.stationTitlesDir1 : this.stationTitlesDir2;

    const points: any[] = [];

    for (let i = 0; i < titlesMeta.length; i++) {
      const key = titlesMeta[i].key;
      const prevExit = i > 0 ? this.timeToMsWithDay(r[titlesMeta[i - 1].key + 'e']) : null;

      // زمان ورود و خروج با احتساب روز بعد
      const entryMs = this.timeToMsWithDay(r[key], prevExit);
      const exitMs = this.timeToMsWithDay(r[key + 'e'], entryMs);

      // محاسبه مدت توقف (dwell) مطمئن
      let dwell: number | null = null;
      if (entryMs !== null && exitMs !== null) {
        dwell = exitMs - entryMs;
        if (dwell < 0) dwell += 24 * 60 * 60 * 1000; // اطمینان از مثبت بودن
      }

      // محاسبه زمان سفر از ایستگاه قبلی
      const travel = prevExit !== null && entryMs !== null ? entryMs - prevExit : null;

      if (entryMs !== null) {
        points.push({
          x: entryMs,
          y: i,
          name: titles[i],
          timeType: 'ورود',
          travelFromPrev: travel,
          stationKey: key,
          marker: { symbol: 'circle', color: 'red' }
        });
      }

      if (exitMs !== null) {
        points.push({
          x: exitMs,
          y: i,
          name: titles[i],
          timeType: 'خروج',
          stationKey: key + 'e',
          dwell: dwell,
          // travelFromPrev: travel,
          marker: { symbol: 'square' }
        });
      }
    }

    points.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

    const formatDuration = (ms: number | null): string => {
      if (ms === null || ms === undefined) return '—';
      let totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor(totalSec / 60) % 60;
      const s = totalSec % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    };

    const formatDurationInSeconds = (ms: number | null): string => {
      if (ms === null || ms === undefined) return '';
      return Math.floor(ms / 1000).toString();
    };

    Highcharts.chart(this.chartEl.nativeElement, {
      chart: { type: 'line', style: { fontFamily: 'Yekan Bakh' } },
      title: { text: this.chartTitle() },
      xAxis: { type: 'datetime', title: { text: 'زمان' }, labels: { format: '{value:%H:%M:%S}' }, },
      yAxis: { title: { text: 'ایستگاه' }, categories: titles, reversed: false },
      tooltip: {
        useHTML: true,
        formatter: function (this: any) {
          const p = this.point ?? (this.points && this.points[0] && this.points[0].point) ?? null;
          if (!p) return '';
          const timeStr = p.x ? Highcharts.dateFormat('%H:%M:%S', p.x) : '—';
          let html = `<b>${p.name ?? '—'}</b><br/>${p.timeType ?? ''}: ${timeStr}`;
          if (p.dwell != null) html += `<br/>مدت توقف: ${formatDuration(p.dwell)}`;
          if (p.travelFromPrev != null) html += `<br/>مدت مسیر: ${formatDuration(p.travelFromPrev)}`;
          return html;
        }
      },
      plotOptions: {
        line: { connectNulls: true, marker: { enabled: true, radius: 4 } }
      },
      series: [{
        type: 'line',
        name: `مسیر (ورود/خروج) - قطار ${r.trainNo ?? '—'}`,
        data: points.map(p => ({
          x: p.x,
          y: p.y,
          name: p.name,
          timeType: p.timeType,
          dwell: p.dwell,
          travelFromPrev: p.travelFromPrev,
          marker: p.marker,
          dataLabels: {
            x: -22,
            y: -5,
            enabled: true,
            align: 'left',
            formatter: function (this: any) {
              const dwell = this.point.dwell;
              // const travel = this.point.travelFromPrev;
              // if (this.point.timeType === 'خروج' && travel != null) return `⟵ ${formatDuration(travel)}`;
              return dwell != null ? formatDurationInSeconds(dwell) : '';
            },
            style: { fontSize: '14px' }
          }
        }))
      }],
      credits: { enabled: false },
      legend: { enabled: false }
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
  private timeToMsWithDay(t?: string | null, prevMs?: number | null): number | null {
    if (!t) return null;
    const m = String(t).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const h = +m[1], min = +m[2], s = +(m[3] ?? 0);
    if (h > 47 || min > 59 || s > 59) return null;
    let ms = ((h * 60 + min) * 60 + s) * 1000;

    // اگر prevMs مشخص باشد و ms کمتر باشد، یعنی زمان به روز بعد منتقل شده
    if (prevMs !== undefined && prevMs !== null && ms < prevMs) {
      ms += 24 * 60 * 60 * 1000; // اضافه کردن یک روز
    }

    return ms;
  }

  goBack() {
    history.length > 1 ? history.back() : window.close();

  }
}
