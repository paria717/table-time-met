import { Routes } from '@angular/router';

export const routes: Routes = [
  // {
  //   path: '',
  //   loadComponent: () =>
  //     import('./components/mimic-records-table/mimic-records-table')
  //       .then(m => m.MimicLine4TableComponent)
  // },
    {
    path: '',
    loadComponent: () =>
      import('./components/records-table/records-table.component')
        .then(m => m.RecordsTableComponent)
  },
];
