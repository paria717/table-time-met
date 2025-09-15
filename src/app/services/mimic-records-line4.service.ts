import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { MimicRecordsLine4Dto } from '../domain/mimic-record-line.dto';


@Injectable({ providedIn: 'root' })
export class MimicLine4Service {
  private http = inject(HttpClient);

 
  // private baseUrl = 'https://localhost:7209/MimicRecordsLine4?params={"sorting":{"conditions":[{"propertyName":"DataType","method":0},{"propertyName":"DeptRank","method":0},{"propertyName":"TrainNo","method":0}]}}';
  private baseUrl = 'https://mis.metro.com/MimicRecordLine/api/MimicRecordsLine4';
  //private baseUrl = 'https://localhost:7209/MimicRecordsLine4';
  //https://mis.metro.com/tccpermission/

 
  getRecords(): Observable<MimicRecordsLine4Dto[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map(res => Array.isArray(res?.result) ? res.result : [])
    );
  }
  
}
