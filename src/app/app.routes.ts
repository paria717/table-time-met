import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/mimic-records-table/mimic-records-table')
        .then(m => m.MimicLine4TableComponent)
  },
];
