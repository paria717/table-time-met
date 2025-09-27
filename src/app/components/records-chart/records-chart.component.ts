import { Component, inject, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import Highcharts from 'highcharts';

import Accessibility from 'highcharts/modules/accessibility';

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
  chartOptions: Highcharts.Options = {};
  // private yMode = 'distance'; // پیش‌فرض: واقعی. می‌تونی 'index' یا 'distanceCompressed' هم بذاری.

  private route = inject(ActivatedRoute);
  // private api = inject(RecordsService);

  record = signal<any | null>(null);
  records = signal<any[]>([]);
  id = signal<number | string | null>(null);

  private segmentLenDir1: number[] = [
    1340, 984, 897, 1055, 764, 1312, 1151, 630, 1253, 1274, 1089, 1418, 219, 955, 1661, 650, 1677, 1596, 1250
  ];
  // برای جهت ۲ دقیقاً هم‌ردیف با stationTitlesDir2
  private segmentLenDir2: number[] = [
    1250, 1596, 1677, 650, 1661, 955, 219, 1418, 1089, 1274, 1253, 630, 1151, 1312, 764, 1055, 897, 984, 1340
  ];

  @ViewChild('chartContainer2') chartEl2?: ElementRef<HTMLDivElement>;
  constructor() {
    const st = history.state as any;

    if (Array.isArray(st?.records) && st.records.length) {
      this.records.set(st.records);
      this.record.set(st.records[0]);
      queueMicrotask(() => this.tryRenderChart());
    } else if (st?.record) {
      this.record.set(st.record);
      this.records.set([st.record]);
      queueMicrotask(() => this.tryRenderChart());
    }

    this.route.paramMap.subscribe(() => {
      if (!this.record()) {
        // لود اگر لازم
      } else {
        this.tryRenderChart();
      }
    });

    // (window as any).setYMode = (m: YMode) => { this.yMode = m; this.tryRenderChart(); };
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
      const planningMs = this.timeToMsWithDay(rec[key + 'p']);

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
          marker: { symbol: 'triangle-down' }
        });
      }
      if (planningMs !== null) {
        points.push({
          x: planningMs,
          y: yVal,
          _xStationDist: yCumVisual[i],
          name: titles[i],
          timeType: 'زمان برنامه ریزی شده',
          stationKey: key + 'p',
          dwell: dwell,
          marker: { symbol: 'triangle-down' }
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
    const segsReal = dir === 1 ? this.segmentLenDir1 : this.segmentLenDir2; // فاصله واقعی

    const container = this.chartEl?.nativeElement;
    if (!container) return null;

    const MIN_GAP_M = this.calcMinGapMetersAdaptive(segsReal, container, 22);
    const yCumVisual = this.hybridCumulativeFromSegments(segsReal, MIN_GAP_M); // visual برای قرارگیری

    const meta = titlesMeta.map((m, i) => ({ key: m.key, title: m.title, yVal: yCumVisual[i] }));

    return {
      dir,
      titles: meta.map(m => m.title),
      yTicks: meta.map(m => m.yVal),
      yCumVisual,
      titlesMeta: titlesMeta,
      segsReal // اضافه شده: برای استفاده در لیبل‌ها
    };
  }

  private DEFAULT_MIN_GAP_M = 200;
  private calcMinGapMetersAdaptive(segs: number[], chartEl: HTMLElement, desiredPx = 22): number {
    const plotH = chartEl?.clientHeight || 600;
    const totalMeters = segs.reduce((a, b) => a + (b || 0), 0) || 1;

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
    const tn = recordsr.map(r => r.trainNo ?? '—').filter(tn => tn !== '—').join(', ');
    return `قطار ${tn}  `;
  });

  ngAfterViewInit(): void {
    this.tryRenderChart();
  }

  private tryRenderChart() {
    if (!this.chartEl?.nativeElement) return;
    const recs = this.records();

    if (!recs.length) return;

    const axis = this.buildAxisMetaForFirstRecord();
    if (!axis) return;

    const { titles, yTicks, segsReal } = axis; // segsReal اضافه شده

    console.log('yTicks', yTicks);

    const seriesList: Highcharts.SeriesOptionsType[] = [];
    recs.forEach((rec) => {
      const points = this.pointsForRecord(rec, axis);

      const tn = rec?.trainNo ?? '—';
      const dp = rec?.dateP ?? '';
      const baseName = `قطار ${tn} - ${dp}`;

      // تفکیک نقاط
      const actualPoints = points.filter(p => p.timeType !== 'زمان برنامه ریزی شده').sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
      console.log('actualPoints', actualPoints);

      const plannedPoints = points
        .filter(p => p.timeType === 'زمان برنامه ریزی شده')
        .sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
      console.log('plannedPoints', plannedPoints);

      // سری Actual (ورود/خروج)
      seriesList.push({
        type: 'line',
        name: `${baseName} | Actual`,
        data: actualPoints.map(p => ({
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
              const d = this.point.dwell;
              return d == null ? '' : Math.floor(d / 1000).toString(); // ثانیه
            },
            style: { fontSize: '14px' }
          }
        })),
        marker: { enabled: true, radius: 4 },
        zIndex: 2,            // بالاتر از planned
        lineWidth: 2
      } as Highcharts.SeriesLineOptions);

      // سری Planned (فقط زمان‌های برنامه‌ریزی‌شده) — خط‌چین قرمز
      if (plannedPoints.length && this.showPlannedMain()) {
        seriesList.push({
          type: 'line',
          name: `${baseName} | Planned`,
          dashStyle: 'ShortDash',
          color: '#ef4444',    // قرمز (tailwind red-500)؛ می‌تونی 'red' هم بذاری
          data: plannedPoints.map(p => ({
            x: p.x,
            y: p.y,
            name: p.name,
            timeType: p.timeType,
            marker: { symbol: 'triangle-down' } // متمایز از ورود/خروج
          })),
          marker: { enabled: true, radius: 4 },
          zIndex: 1,
          lineWidth: 2
        } as Highcharts.SeriesLineOptions);
      }
    });

    const totalRealM = segsReal.reduce((a, b) => a + b, 0); // مجموع واقعی

    Highcharts.chart(this.chartEl.nativeElement, {
      chart: { type: 'line', style: { fontFamily: 'Yekan Bakh' } },
      title: { text: 'مقایسهٔ 5 سفر — ' + this.chartTitle() },
      xAxis: {
        type: 'datetime',
        title: { text: 'زمان' },
        labels: { format: '{value:%H:%M:%S}' }
      },
      yAxis: {
        title: { text: 'ایستگاه  ' + `(${totalRealM} M)` },
        tickPositions: yTicks,
        gridLineWidth: 1,
        labels: {
          useHTML: true,
          formatter: function (this: any) {
            const idx = yTicks.indexOf(this.value);
            const segM = idx === 0 ? 0 : segsReal[idx - 1];
            let label = idx >= 0 ? `${titles[idx]}  (${segM}M) ` : '';
            if (segM < 300) label; // نشانه برای فاصله‌های کم، بدون تغییر مقدار
            return label;
          }
        }
      },
      tooltip: {
        useHTML: true,
        shared: false,
        formatter: function (this: any) {
          const p = this.point;
          const t = p?.x ? Highcharts.dateFormat('%H:%M:%S', p.x) : '—';
          let html = `<b>${p?.name ?? '—'}</b><br/>${p?.timeType ?? ''}: ${t}`;
          if (p?.dwell != null) html += `<br/>مدت توقف: ${Math.floor(p.dwell / 1000)}`;
          if (p?.travelFromPrev != null) html += `<br/>مدت مسیر: ${Math.floor(p.travelFromPrev / 1000)}`;
          return html;
        }
      },
      plotOptions: {
        line: { connectNulls: true, marker: { enabled: true, radius: 4 } }
      },
      series: seriesList,
      credits: { enabled: false },
      legend: { enabled: true }
    } as Highcharts.Options);

    this.renderStationsOnXMulti(recs, axis);
  }

  private renderStationsOnXMulti(recs: any[], axis: { titles: string[], yCumVisual: number[], segsReal: number[] }) { // segsReal اضافه شده
    if (!this.chartEl2?.nativeElement) return;

    const { titles, yCumVisual, segsReal } = axis;

    const xTicksNumeric = yCumVisual.slice();

    const seriesList: Highcharts.SeriesOptionsType[] = [];

    recs.forEach((rec) => {
      console.log('rec', rec);

      const titlesMeta = (Number(rec.direction) === 1 ? stationTitlesDir1 : stationTitlesDir2);
      const points = this.pointsForRecord(rec, { ...axis, titlesMeta });

      const tn = rec?.trainNo ?? '—';
      const dp = rec?.dateP ?? '';
      const baseName = `قطار ${tn} - ${dp}`;

      // تفکیک Actual vs Planned
      const actualPoints = points
        .filter(p => p.timeType !== 'زمان برنامه ریزی شده')
        .sort((a, b) => (a._xStationDist ?? 0) - (b._xStationDist ?? 0));

      const plannedPoints = points
        .filter(p => p.timeType === 'زمان برنامه ریزی شده')
        .sort((a, b) => (a._xStationDist ?? 0) - (b._xStationDist ?? 0));

      // سری Actual
      seriesList.push({
        type: 'line',
        name: `${baseName} | Actual`,
        data: actualPoints.map(p => ({
          x: p._xStationDist,         // ایستگاه/فاصله تجمعی روی محور X
          y: p.x,                      // زمان (ms) روی محور Y
          name: p.name,
          timeType: p.timeType,
          dwell: p.dwell,
          travelFromPrev: p.travelFromPrev,
          marker: p.marker,
          dataLabels: {
            x: -22, y: -5,
            enabled: true, align: 'left',
            formatter: function (this: any) {
              const d = this.point.dwell;
              return d == null ? '' : Math.floor(d / 1000).toString();
            },
            style: { fontSize: '14px' }
          }
        })),
        marker: { enabled: true, radius: 4 },
        zIndex: 2,
        lineWidth: 2
      } as Highcharts.SeriesLineOptions);

      // سری Planned (خط‌چین/قرمز)
      if (plannedPoints.length && this.showPlannedMain()) {
        seriesList.push({
          type: 'line',
          name: `${baseName} | Planned`,
          dashStyle: 'ShortDash',
          color: '#ef4444',
          data: plannedPoints.map(p => ({
            x: p._xStationDist,
            y: p.x,                    // حتماً ms باشه
            name: p.name,
            timeType: p.timeType,
            marker: { symbol: 'triangle-down' }
          })),
          marker: { enabled: true, radius: 4 },
          zIndex: 1,
          lineWidth: 2
        } as Highcharts.SeriesLineOptions);
      }
    });

    // 1) ساخت آرایهٔ یکتای زمان‌ها (ms) از داده‌ها
    const allYTimes = Array.from(new Set(
      seriesList.flatMap(s => (s as any).data.map((p: any) => p.y).filter((v: any) => v != null))
    )).sort((a: number, b: number) => a - b);

    // 2) اگر خیلی زیاد بودن، می‌تونی کمی کم‌تراکم‌شون کنی (اختیاری):
    const maxTicks = 40;
    const yTickPositions = allYTimes.length > maxTicks
      ? allYTimes.filter((_, i) => i % Math.ceil(allYTimes.length / maxTicks) === 0)
      : allYTimes;

    Highcharts.chart(this.chartEl2.nativeElement, {
      chart: { type: 'line', style: { fontFamily: 'Yekan Bakh' } },
      title: { text: 'مقایسهٔ 5 سفر — ' + this.chartTitle() },
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
      yAxis: {
        type: 'datetime',
        title: { text: 'زمان' },
        labels: { format: '{value:%H:%M:%S}' },
        tickPositions: yTickPositions
      },
      tooltip: {
        useHTML: true,
        formatter: function (this: any) {
          const p = this.point;
          const t = p?.y ? Highcharts.dateFormat('%H:%M:%S', p.y) : '—';
          let html = `<b>${p?.name ?? '—'}</b><br/>${p?.timeType ?? ''}: ${t}`;
          if (p?.dwell != null) html += `<br/>مدت توقف: ${Math.floor(p.dwell / 1000)}`;
          if (p?.travelFromPrev != null) html += `<br/>مدت مسیر: ${Math.floor(p.travelFromPrev / 1000)}`;
          return html;
        }
      },
      plotOptions: { line: { connectNulls: true, marker: { enabled: true, radius: 4 } } },
      series: seriesList,
      credits: { enabled: false },
      legend: { enabled: true }
    } as Highcharts.Options);
  }

  private timeToMs(t?: string | null): number | null {
    if (!t) return null;
    const m = String(t).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const h = +m[1], min = +m[2], s = +(m[3] ?? 0);
    if (h > 47 || min > 59 || s > 59) return null;
    return ((h * 60 + min) * 60 + s) * 1000;
  }

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

  showPlannedMain = signal<boolean>(false);

  togglePlannedMain() {
    this.showPlannedMain.update(v => !v);
    this.tryRenderChart();
  }
}