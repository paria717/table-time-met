import { Routes } from '@angular/router';

export const routes: Routes = [
{ path: '', pathMatch: 'full', redirectTo: 'records-table' },
    {
    path:'records-table' ,
    loadComponent: () =>
      import('./components/records-table/records-table.component')
        .then(m => m.RecordsTableComponent)
  },
  {
    path:'records-chart',
    loadComponent: () =>
      import('./components/records-chart/records-chart.component')
        .then(m => m.RecordsChartComponent)
  },
    { path: '**', redirectTo: 'table' }
];
