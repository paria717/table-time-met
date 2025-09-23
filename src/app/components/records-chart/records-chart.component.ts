
import { Component, inject, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import Highcharts, { color } from 'highcharts';
import { DATA_TYPE_OPTIONS_FIXED, stationTitlesDir1, stationTitlesDir2 } from '../../constants/index';
// import { RecordsService } from '../../services/records.service'; // اگر خواستی fallback API

type KV = { label: string; value: string | number | null };
type YMode = 'index' | 'distance' | 'distanceCompressed';

@Component({
  standalone: true,
  selector: 'app-records-chart',
  imports: [CommonModule],

  templateUrl: 'records-chart.component.html'
})
export class RecordsChartComponent {
  Highcharts: typeof Highcharts = Highcharts;
  @ViewChild('chartContainer') chartEl?: ElementRef<HTMLDivElement>;
  chartOptions: Highcharts.Options = {
  }
  private yMode = 'distance'; // پیش‌فرض: واقعی. می‌تونی 'index' یا 'distanceCompressed' هم بذاری.

  private route = inject(ActivatedRoute);
  // private api = inject(RecordsService);

  record = signal<any | null>(null);
  records = signal<any[]>([]);
  id = signal<number | string | null>(null);

  private segmentLenDir1: number[] = [
    0, 1340, 984, 897, 1055, 764, 1312, 1151, 630, 1253, 1274, 1089, 1418, 219, 955, 1661, 650, 1677, 1596, 1250
  ];
  // برای جهت ۲ دقیقاً هم‌ردیف با stationTitlesDir2
  private segmentLenDir2: number[] = [...this.segmentLenDir1].reverse();

  @ViewChild('chartContainer2') chartEl2?: ElementRef<HTMLDivElement>;

  // constructor() {
  //   // 1) از state بخوان
  //   const st = history.state as any;

  //   if (st?.record) {
  //     this.record.set(st.record);

  //     this.id.set(st.record.id ?? st.record.Id ?? null);
  //     queueMicrotask(() => this.tryRenderChart());
  //   }

  //   this.route.paramMap.subscribe(() => {
  //     if (!this.record()) {
  //       // this.api.getById(+pid!).subscribe(r => { this.record.set(r); this.tryRenderChart(); });
  //     } else {
  //       console.log('record', this.record());

  //       this.tryRenderChart();
  //     }
  //   });
  //   (window as any).setYMode = (m: YMode) => { this.yMode = m; this.tryRenderChart(); };
  // }
  constructor() {
    const st = history.state as any;

    // حالت جدید: آرایه از رکوردها
    if (Array.isArray(st?.records) && st.records.length) {
      this.records.set(st.records);
      this.record.set(st.records[0]); // برای محاسبات عنوان و جهت پایه
      queueMicrotask(() => this.tryRenderChart());
    } else if (st?.record) {
      // سازگاری با حالت قبلی
      this.record.set(st.record);
      this.records.set([st.record]);
      queueMicrotask(() => this.tryRenderChart());
    }

    this.route.paramMap.subscribe(() => {
      if (!this.record()) {
        // اگر لازم شد از API بگیری...
      } else {
        this.tryRenderChart();
      }
    });

    (window as any).setYMode = (m: YMode) => { this.yMode = m; this.tryRenderChart(); };
  }
  private pointsForRecord(rec: any, axisMeta: { titlesMeta: any[], yCumVisual: number[], titles: string[] }) {
    const { titlesMeta, yCumVisual, titles } = axisMeta;

    // فقط رکوردهایی که جهت‌شان با محور سازگار است
    const recDir = Number(rec.direction) === 1 ? 1 : 2;
    const axisDir = Number(this.records()[0]?.direction) === 1 ? 1 : 2;
    if (recDir !== axisDir) return []; // می‌تونی اینجا map تطبیقی هم انجام بدی

    const points: any[] = [];
    for (let i = 0; i < titlesMeta.length; i++) {
      const key = titlesMeta[i].key;
      const prevExit = i > 0 ? this.timeToMsWithDay(rec[titlesMeta[i - 1].key + 'e']) : null;

      const entryMs = this.timeToMsWithDay(rec[key], prevExit);
      const exitMs = this.timeToMsWithDay(rec[key + 'e'], entryMs);

      let dwell: number | null = null;
      if (entryMs !== null && exitMs !== null) {
        dwell = exitMs - entryMs;
        if (dwell < 0) dwell += 24 * 60 * 60 * 1000;
      }
      const travel = prevExit !== null && entryMs !== null ? entryMs - prevExit : null;
      const yVal = axisMeta.yCumVisual[i];

      if (entryMs !== null) {
        points.push({
          x: entryMs,
          y: yVal,
          _xStationDist: yCumVisual[i],
          name: titles[i],
          timeType: 'ورود',
          travelFromPrev: travel,
          stationKey: key,
          marker: { symbol: 'circle' }
        });
      }
      if (exitMs !== null) {
        points.push({
          x: exitMs,
          y: yVal,
          _xStationDist: yCumVisual[i],
          name: titles[i],
          timeType: 'خروج',
          stationKey: key + 'e',
          dwell: dwell,
          marker: { symbol: 'square' }
        });
      }
    }
    points.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    return points;
  }

  private buildAxisMetaForFirstRecord() {
    const r0 = this.records()[0];
    if (!r0) return null;

    const dir = Number(r0.direction) === 1 ? 1 : 2;
    const titlesMeta = dir === 1 ? stationTitlesDir1 : stationTitlesDir2;
    const segs = dir === 1 ? this.segmentLenDir1 : this.segmentLenDir2;

    const container = this.chartEl?.nativeElement;
    if (!container) return null;

    const MIN_GAP_M = this.calcMinGapMetersAdaptive(segs, container, 22);
    const yCumVisual = this.hybridCumulativeFromSegments(segs, MIN_GAP_M);
    const meta = titlesMeta.map((m, i) => ({ key: m.key, title: m.title, yVal: yCumVisual[i] }));

    return {
      dir,
      titles: meta.map(m => m.title),
      yTicks: meta.map(m => m.yVal),
      yCumVisual,
      titlesMeta: titlesMeta
    };
  }

  private renderStationsOnX(points: any[], titles: string[], xTicksNumeric: number[]) {
    if (!this.chartEl2?.nativeElement) return;

    Highcharts.chart(this.chartEl2.nativeElement, {
      chart: { type: 'line', style: { fontFamily: 'Yekan Bakh' } },
      title: { text: this.chartTitle() + ' (ایستگاه روی X / زمان روی Y)' },

      // محور X: عددی بر اساس فاصلهٔ تجمعی (واقعی یا Hybrid)
      xAxis: {
        tickPositions: xTicksNumeric,
        gridLineWidth: 1,
        title: { text: 'ایستگاه' },
        labels: {
          formatter: function () {
            const val = (this as any).value;
            const idx = xTicksNumeric.indexOf(val);
            return idx >= 0 ? titles[idx] : '';
          }
        }
      },

      // محور Y: زمان
      yAxis: {
        type: 'datetime',
        title: { text: 'زمان' },
        labels: { format: '{value:%H:%M:%S}' }
      },

      tooltip: {
        useHTML: true,
        formatter: function (this: any) {
          const p = this.point;
          const t = p?.y ? Highcharts.dateFormat('%H:%M:%S', p.y) : '—';
          let html = `<b>${p?.name ?? '—'}</b><br/>${p?.timeType ?? ''}: ${t}`;
          if (p?.dwell != null) html += `<br/>مدت توقف: ${Math.floor(p.dwell / 1000)}s`;
          if (p?.travelFromPrev != null) html += `<br/>مدت مسیر: ${Math.floor(p.travelFromPrev / 1000)}s`;
          return html;
        }
      },

      plotOptions: { line: { connectNulls: true, marker: { enabled: true, radius: 4 } } },

      series: [{
        type: 'line',
        name: 'Stations→X, Time→Y',
        data: points.map(p => ({
          x: p._xStationDist,  // فاصلهٔ تجمعی (نمایشی/واقعی)
          y: p.x,              // زمان (ms)
          name: p.name,
          timeType: p.timeType,
          dwell: p.dwell,
          travelFromPrev: p.travelFromPrev,
          marker: p.marker
        }))
      }],

      credits: { enabled: false },
      legend: { enabled: false }
    } as Highcharts.Options);
  }

  private DEFAULT_MIN_GAP_M = 200;
  private calcMinGapMetersAdaptive(segs: number[], chartEl: HTMLElement, desiredPx = 22): number {
    const plotH = chartEl?.clientHeight || 600;              // تخمینی
    const totalMeters = segs.reduce((a, b) => a + (b || 0), 0) || 1;
    // این تبدیل تضمین می‌کند ~desiredPx بین تیک‌های خیلی کم فاصله بیفتد (تخمینی)
    const pxToMeter = totalMeters / plotH;
    const adaptive = Math.ceil(pxToMeter * desiredPx);
    return Math.max(this.DEFAULT_MIN_GAP_M, adaptive);
  }

  private hybridCumulativeFromSegments(segs: number[], minGapM: number): number[] {
    const cum: number[] = [0];
    for (let i = 0; i < segs.length; i++) {
      const real = segs[i] ?? 0;
      const visual = Math.max(real, minGapM);
      cum.push(cum[i] + visual);

    }

    return cum;
  }

  categories = computed<string[]>(() => {
    const r = this.record();
    if (!r) return [];
    const dir = Number(r.direction) === 1 ? 1 : 2;
    const titles = dir === 1 ? stationTitlesDir1 : stationTitlesDir2;
    let t = titles.map(t => t.title);
    console.log('t', t);
    return t;
  });
  seriesData = computed<(number | null)[]>(() => {
    const r = this.record();
    if (!r) return [];
    const dir = Number(r.direction) === 1 ? 1 : 2;
    const titles = dir === 1 ? stationTitlesDir1 : stationTitlesDir2;
    return titles.map(t => this.timeToMs(r[t.key] as any));
  });
  chartTitle = computed<string>(() => {
    const recordsr = this.records();
    const tn = recordsr.map(r=>r.trainNo ?? '—').filter(tn => tn !== '—').join(', ');
    // const tn = r?.trainNo ?? '—';
    // const tp = DATA_TYPE_OPTIONS_FIXED[r?.dataType] ?? '';
    // const multi = this.records().length > 1 ? ' | مقایسه' : '';
    return `قطار ${tn}  `;
  });

  // chartTitle = computed<string>(() => {
  //   const r = this.record();
  //   const tn = r?.trainNo ?? '—';
  //   const tp = DATA_TYPE_OPTIONS_FIXED[r?.dataType] ?? '';
  //     const multi = this.records().length > 1 ? ' | مقایسه' : '';
  //   return `قطار ${tn} - ${tp}`;
  // });
  ngAfterViewInit(): void {

    this.tryRenderChart();
  }
  private tryRenderChart() {
    if (!this.chartEl?.nativeElement) return;
    const recs = this.records();
    if (!recs.length) return;

    const axis = this.buildAxisMetaForFirstRecord();
    if (!axis) return;

    const { titles, yTicks, yCumVisual } = axis;

    // برای هر رکورد یک سری بساز
    const seriesList: Highcharts.SeriesLineOptions[] = recs.map((rec) => {
      const points = this.pointsForRecord(rec, axis);

      // اسم سری: قطار + تاریخ
      const tn = rec?.trainNo ?? '—';
      // const tp = DATA_TYPE_OPTIONS_FIXED[rec?.dataType] ?? '';
      const dp = rec?.dateP ?? '';
      const sname = `قطار ${tn} - ${dp} `;

      return {
        type: 'line',
        name: sname,
        data: points.map(p => ({
          x: p.x, y: p.y, name: p.name, timeType: p.timeType,
          dwell: p.dwell, travelFromPrev: p.travelFromPrev, marker: p.marker,
          dataLabels: {
            x: -22, y: -5, enabled: true, align: 'left',
            formatter: function (this: any) {
              const d = this.point.dwell;
              if (d == null) return '';
              return Math.floor(d / 1000).toString(); // ثانیه
            },
            style: { fontSize: '14px' }
          }
        })),
        marker: { enabled: true, radius: 4 }
      };
    });

    Highcharts.chart(this.chartEl.nativeElement, {
      chart: { type: 'line', style: { fontFamily: 'Yekan Bakh' } },
      title: { text:  ' مقایسهٔ ۳ سفر  —'  + this.chartTitle()},
      xAxis: { type: 'datetime', title: { text: 'زمان' }, labels: { format: '{value:%H:%M:%S}' } },
      yAxis: {
        title: { text: 'ایستگاه' },
        tickPositions: yTicks,
        gridLineWidth: 1,
        labels: {
          formatter: function (this: any) {
            const idx = yTicks.indexOf(this.value);
            return idx >= 0 ? titles[idx] : '';
          }
        }
      },
      tooltip: {
        useHTML: true,
        shared: false, // هر نقطه جدا
        formatter: function (this: any) {
          const p = this.point;
          const t = p?.x ? Highcharts.dateFormat('%H:%M:%S', p.x) : '—';
          let html = `<b>${p?.name ?? '—'}</b><br/>${p?.timeType ?? ''}: ${t}`;
          if (p?.dwell != null) html += `<br/>مدت توقف: ${Math.floor(p.dwell / 1000)}s`;
          if (p?.travelFromPrev != null) html += `<br/>مدت مسیر: ${Math.floor(p.travelFromPrev / 1000)}s`;
          return html;
        }
      },
      plotOptions: { line: { connectNulls: true } },
      series: seriesList,
      credits: { enabled: false },
      legend: { enabled: true } // ⟵ برای تمایز سری‌ها
    } as Highcharts.Options);

    // چارت دوم (ایستگاه روی X / زمان روی Y) با چند سری
    this.renderStationsOnXMulti(recs, axis);
  } private renderStationsOnXMulti(recs: any[], axis: { titles: string[], yCumVisual: number[] }) {
    if (!this.chartEl2?.nativeElement) return;

    const { titles, yCumVisual } = axis;
    const xTicksNumeric = yCumVisual.slice();

    const seriesList = recs.map(rec => {
      const points = this.pointsForRecord(rec, { ...axis, titlesMeta: (Number(rec.direction) === 1 ? stationTitlesDir1 : stationTitlesDir2) });
      const tn = rec?.trainNo ?? '—';
      const dp = rec?.dateP ?? '';
      return {
        type: 'line',
        name: `قطار ${tn} - ${dp}`,
        data: points.map(p => ({
          x: p._xStationDist,  // فاصلهٔ تجمعی
          y: p.x,              // زمان
          name: p.name,
          timeType: p.timeType,
          dwell: p.dwell,
          travelFromPrev: p.travelFromPrev,
          marker: p.marker
        })),
        marker: { enabled: true, radius: 4 }
      } as Highcharts.SeriesLineOptions;
    });

    Highcharts.chart(this.chartEl2.nativeElement, {
      chart: { type: 'line', style: { fontFamily: 'Yekan Bakh' } },
      title:{ text:  ' مقایسهٔ ۳ سفر  —'  + this.chartTitle()},
      xAxis: {
        tickPositions: xTicksNumeric,
        gridLineWidth: 1,
        title: { text: 'ایستگاه' },
        labels: {
          formatter: function () {
            const val = (this as any).value;
            const idx = xTicksNumeric.indexOf(val);
            return idx >= 0 ? titles[idx] : '';
          }
        }
      },
      yAxis: { type: 'datetime', title: { text: 'زمان' }, labels: { format: '{value:%H:%M:%S}' } },
      tooltip: {
        useHTML: true,
        formatter: function (this: any) {
          const p = this.point;
          const t = p?.y ? Highcharts.dateFormat('%H:%M:%S', p.y) : '—';
          let html = `<b>${p?.name ?? '—'}</b><br/>${p?.timeType ?? ''}: ${t}`;
          if (p?.dwell != null) html += `<br/>مدت توقف: ${Math.floor(p.dwell / 1000)}s`;
          if (p?.travelFromPrev != null) html += `<br/>مدت مسیر: ${Math.floor(p.travelFromPrev / 1000)}s`;
          return html;
        }
      },
      plotOptions: { line: { connectNulls: true, marker: { enabled: true, radius: 4 } } },
      series: seriesList,
      credits: { enabled: false },
      legend: { enabled: true }
    } as Highcharts.Options);
  }


  // private tryRenderChart() {
  //   if (!this.chartEl?.nativeElement) return;
  //   const r = this.record();
  //   if (!r) return;
  //   // const meta = this.getStationsWithY();
  //   // const titles = meta.map(m => m.title);
  //   // const yTicks = meta.map(m => m.yVal);
  //   const dir = Number(r.direction) === 1 ? 1 : 2;
  //   const titlesMeta = dir === 1 ? stationTitlesDir1 : stationTitlesDir2;
  //   const segs = dir === 1 ? this.segmentLenDir1 : this.segmentLenDir2;
  //   const MIN_GAP_M = this.calcMinGapMetersAdaptive(segs, this.chartEl!.nativeElement, 22); // تطبیقی نسبت به ارتفاع
  //   const yCumVisual = this.hybridCumulativeFromSegments(segs, MIN_GAP_M);
  //   const meta = titlesMeta.map((m, i) => ({ key: m.key, title: m.title, yVal: yCumVisual[i] }));
  //   const titles = meta.map(m => m.title);
  //   const yTicks = meta.map(m => m.yVal);
  //   const xTicksNumeric = yCumVisual.slice();
  //   // const dir = Number(r.direction) === 1 ? 1 : 2;
  //   // const titlesMeta = dir === 1 ? this.stationTitlesDir1 : this.stationTitlesDir2;

  //   const points: any[] = [];

  //   for (let i = 0; i < meta.length; i++) {
  //     const key = meta[i].key;
  //     const prevExit = i > 0 ? this.timeToMsWithDay(r[meta[i - 1].key + 'e']) : null;

  //     // زمان ورود و خروج با احتساب روز بعد
  //     const entryMs = this.timeToMsWithDay(r[key], prevExit);
  //     const exitMs = this.timeToMsWithDay(r[key + 'e'], entryMs);

  //     // محاسبه مدت توقف (dwell) مطمئن
  //     let dwell: number | null = null;
  //     if (entryMs !== null && exitMs !== null) {
  //       dwell = exitMs - entryMs;
  //       if (dwell < 0) dwell += 24 * 60 * 60 * 1000; // اطمینان از مثبت بودن
  //     }

  //     // محاسبه زمان سفر از ایستگاه قبلی
  //     const travel = prevExit !== null && entryMs !== null ? entryMs - prevExit : null;
  //     const yVal = meta[i].yVal;
  //     if (entryMs !== null) {
  //       points.push({
  //         x: entryMs,
  //         y: yVal,
  //         _xStationDist: yCumVisual[i],
  //         name: titles[i],
  //         timeType: 'ورود',
  //         travelFromPrev: travel,
  //         stationKey: key,
  //         marker: { symbol: 'circle', color: 'red' }
  //       });
  //     }

  //     if (exitMs !== null) {
  //       points.push({
  //         x: exitMs,
  //         y: yVal,
  //         _xStationDist: yCumVisual[i],
  //         name: titles[i],
  //         timeType: 'خروج',
  //         stationKey: key + 'e',
  //         dwell: dwell,
  //         // travelFromPrev: travel,
  //         marker: { symbol: 'square' }
  //       });
  //     }
  //   }

  //   points.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

  //   const formatDuration = (ms: number | null): string => {
  //     if (ms === null || ms === undefined) return '—';
  //     let totalSec = Math.floor(ms / 1000);
  //     const h = Math.floor(totalSec / 3600);
  //     const m = Math.floor(totalSec / 60) % 60;
  //     const s = totalSec % 60;
  //     const pad = (n: number) => n.toString().padStart(2, '0');
  //     return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  //   };

  //   const formatDurationInSeconds = (ms: number | null): string => {
  //     if (ms === null || ms === undefined) return '';
  //     return Math.floor(ms / 1000).toString();
  //   };

  //   Highcharts.chart(this.chartEl.nativeElement, {
  //     chart: { type: 'line', style: { fontFamily: 'Yekan Bakh' } },
  //     title: { text: this.chartTitle() },
  //     xAxis: { type: 'datetime', title: { text: 'زمان' }, labels: { format: '{value:%H:%M:%S}' }, },
  //     yAxis: {
  //       title: { text: 'ایستگاه' },          // بدون واحد
  //       tickPositions: yTicks,              // دقیقاً روی ایستگاه‌ها
  //       gridLineWidth: 1,
  //       labels: {
  //         formatter: function (this: any) {
  //           const idx = yTicks.indexOf(this.value);
  //           return idx >= 0 ? titles[idx] : ''; // فقط نام ایستگاه
  //         },
  //         useHTML: false
  //       }
  //     },
  //     minPadding: 5,
  //     maxPadding: 5,
  //     tooltip: {
  //       useHTML: true,
  //       formatter: function (this: any) {
  //         const p = this.point ?? (this.points && this.points[0] && this.points[0].point) ?? null;
  //         if (!p) return '';
  //         const timeStr = p.x ? Highcharts.dateFormat('%H:%M:%S', p.x) : '—';
  //         let html = `<b>${p.name ?? '—'}</b><br/>${p.timeType ?? ''}: ${timeStr}`;
  //         if (p.dwell != null) html += `<br/>مدت توقف: ${formatDuration(p.dwell)}`;
  //         if (p.travelFromPrev != null) html += `<br/>مدت مسیر: ${formatDuration(p.travelFromPrev)}`;
  //         return html;
  //       }
  //     },
  //     plotOptions: {
  //       line: { connectNulls: true, marker: { enabled: true, radius: 4 } }
  //     },
  //     series: [{
  //       type: 'line',
  //       name: `مسیر (ورود/خروج) - قطار ${r.trainNo ?? '—'}`,
  //       data: points.map(p => ({
  //         x: p.x,
  //         y: p.y,
  //         name: p.name,
  //         timeType: p.timeType,
  //         dwell: p.dwell,
  //         travelFromPrev: p.travelFromPrev,
  //         marker: p.marker,
  //         dataLabels: {
  //           x: -22,
  //           y: -5,
  //           enabled: true,
  //           align: 'left',
  //           formatter: function (this: any) {
  //             const dwell = this.point.dwell;
  //             // const travel = this.point.travelFromPrev;
  //             // if (this.point.timeType === 'خروج' && travel != null) return `⟵ ${formatDuration(travel)}`;
  //             return dwell != null ? formatDurationInSeconds(dwell) : '';
  //           },
  //           style: { fontSize: '14px' }
  //         }
  //       }))
  //     }],
  //     credits: { enabled: false },
  //     legend: { enabled: false }
  //   } as Highcharts.Options);
  //   this.renderStationsOnX(points, titles, xTicksNumeric);
  // }

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
    const titles = dir === 1 ? stationTitlesDir1 : stationTitlesDir2;

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
