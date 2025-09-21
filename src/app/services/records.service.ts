import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface ApiItem {
    rowNum2: number;
    rowNum: number;
    id: number;
    dataType: number | null;
    direction: number | null;
    date: string | null;
    trainNo: number | null;
    headway: number | null;
    dayType: number | null;
    deptRank: number | null;
    s118E: string | null; s119E: string | null; s120E: string | null; s121E: string | null;
    s122E: string | null; s123E: string | null; s124E: string | null; s125E: string | null;
    s126E: string | null; s127E: string | null; s128E: string | null; s129E: string | null;
    s130E: string | null; s131E: string | null; s132E: string | null; s133E: string | null;
    s134E: string | null; s135E: string | null; s136E: string | null; s137E: string | null;
    s118: string | null; s119: string | null; s120: string | null; s121: string | null;
    s122: string | null; s123: string | null; s124: string | null; s125: string | null;
    s126: string | null; s127: string | null; s128: string | null; s129: string | null;
    s130: string | null; s131: string | null; s132: string | null; s133: string | null;
    s134: string | null; s135: string | null; s136: string | null; s137: string | null;
    dataTypeName: string | null;
    dayTypeName: string | null;
    dateP: string | null;
    totalTirpTime: number | null;
}


export interface ApiResponse {
    pageNumber: number | null;
    pageSize: number | null;
    count: number; // total rows across all pages for the server query
    result: ApiItem[];
    isSuccess: boolean;
    message: string | null;
    statusCode: number;
}


export interface Query {
    pageNumber: number; // 1-based
    pageSize: number;
    filters?: Record<string, string | number>;
}


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


    getRecords(direction: 1 | 2, q: Query): Observable<ApiResponse> {

        const numericKeys = new Set(['dataType', 'trainNo']);


        const conditions = Object.entries(q.filters ?? {})
            .filter(([, v]) => v !== undefined && v !== null && String(v).trim().length > 0)
            .map(([k, v]) => ({
                propertyName: k,
                propertyValue: numericKeys.has(k) ? Number(v) : v,
                method: 0, // equals
            }));


        const payload = {
            paging: { pageNumber: q.pageNumber, pageSize: q.pageSize },
            filtering: { conditions },
        } as const;


        const params = new HttpParams().set('Params', JSON.stringify(payload));
        const url = this.pickBaseUrl(direction);
        return this.http.get<ApiResponse>(url, { params });

    }
}