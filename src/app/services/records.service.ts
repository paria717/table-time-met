import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Query, RecordItemsDto } from '../domain/index';






@Injectable({ providedIn: 'root' })
export class RecordsService {
    private http = inject(HttpClient);

    isLocal: boolean = false;
    private baseUrllocal1 = 'https://mis.metro.com/MimicRecordLine/api2/MimicRecordsLine4Dir1';
    private baseUrllocal2 = 'https://mis.metro.com/MimicRecordLine/api2/MimicRecordsLine4Dir2';
    private baseUrlserver1 = 'https://mis.metro.com/MimicRecordLine/api/MimicRecordsLine4Dir1';
    private baseUrlserver2 = 'https://mis.metro.com/MimicRecordLine/api/MimicRecordsLine4Dir2';

    private pickBaseUrl(direction: 1 | 2) {
        if (this.isLocal) {
            return direction === 1 ? this.baseUrllocal1 : this.baseUrllocal2;
        }
        else {
            return direction === 1 ? this.baseUrlserver1 : this.baseUrlserver2;
        }
    }
    // getRecords(
    //   direction: 1 | 2,
    //   q: { pageNumber: number; pageSize: number; filters?: Record<string, string | number>;
    //        sorting?: { conditions: { propertyName: string; method: 0 | 1 }[] } }
    // ) {
    //   const body: any = {
    //     paging: { pageNumber: q.pageNumber, pageSize: q.pageSize },
    //   };
    //   if (q.filters && Object.keys(q.filters).length) {
    //     body.filtering = {
    //       conditions: Object.entries(q.filters).map(([propertyName, propertyValue]) => ({
    //         propertyName, propertyValue, method: 0
    //       })),
    //     };
    //   }
    //   if (q.sorting && q.sorting.conditions?.length) {
    //     body.sorting = q.sorting;
    //   }

    //   return this.http.post<PagedResult<RecordItemsDto>>(
    //     `/api/records/${direction}`,
    //     body
    //   );
    // }



    getRecords(direction: 1 | 2, q: Query): Observable<ApiResponse> {

        const numericKeys = new Set(['dataType', 'trainNo']);


        const filteringConds = Object.entries(q.filters ?? {})
            .filter(([, v]) => v !== undefined && v !== null && String(v).trim().length > 0)
            .map(([k, v]) => ({
                propertyName: k,
                propertyValue: numericKeys.has(k) ? Number(v) : v,
                method: 0, // equals
            }));

        const sortingConds = (q.sorting?.conditions ?? []).map(sc => ({
            propertyName: sc.propertyName,
            method: sc.method, // 0=Asc, 1=Desc
        }));

        const payload = {
            paging: { pageNumber: q.pageNumber, pageSize: q.pageSize },
            filtering: { conditions: filteringConds },
            sorting: { conditions: sortingConds },
        } as const;


        const params = new HttpParams().set('Params', JSON.stringify(payload));
        const url = this.pickBaseUrl(direction);
        return this.http.get<ApiResponse>(url, { params });

    }
}