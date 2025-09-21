import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FilterService {
  private filterState = new BehaviorSubject<Record<string, any> | null>(null);
  filter$ = this.filterState.asObservable();

  setFilter(filter: Record<string, any> | null) {
    this.filterState.next(filter);
  }

  getFilter(): Record<string, any> | null {
    return this.filterState.value;
  }
}
