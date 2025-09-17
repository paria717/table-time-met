import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface ApiItem {
rowNum2: number;
rowNum:number;
id: number;
dataType: number | null;
direction: number | null;
date: string | null;
trainNo: number | null;
headway: number | null;
dayType: number | null;
deptRank: number | null;
s118: string | null; s119: string | null; s120: string | null; s121: string | null;
s122: string | null; s123: string | null; s124: string | null; s125: string | null;
s126: string | null; s127: string | null; s128: string | null; s129: string | null;
s130: string | null; s131: string | null; s132: string | null; s133: string | null;
s134: string | null; s135: string | null; s136: string | null; s137: string | null;
dataTypeName: string | null;
dayTypeName: string | null;
dateP: string | null;
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


private baseUrllocal1 = 'https://mis.metro.com/MimicRecordLine/api2/MimicRecordsLine4Dir1';
private baseUrllocal2 = 'https://mis.metro.com/MimicRecordLine/api2/MimicRecordsLine4Dir2';


private pickBaseUrl(direction: 1 | 2) {
return direction === 1 ? this.baseUrllocal1 : this.baseUrllocal2;
}


getRecords(direction: 1 | 2, q: Query): Observable<ApiResponse> {

const numericKeys = new Set(['dataType', 'trainNo']);


const conditions = Object.entries(q.filters ?? {})
.filter(([, v]) => v !== undefined && v !== null && String(v).trim().length > 0)
.map(([k, v]) => ({
propertyName: k, // اگر بک‌اند بجای dateP، کلید دیگری مثل date می‌خواهد، همین‌جا map کن
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