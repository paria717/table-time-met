import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { MimicRecordsLine4Dto } from '../domain/mimic-record-line.dto';


@Injectable({ providedIn: 'root' })
export class MimicLine4Service {
  private http = inject(HttpClient);


  // private baseUrl = 'https://localhost:7209/MimicRecordsLine4?params={"sorting":{"conditions":[{"propertyName":"DataType","method":0},{"propertyName":"DeptRank","method":0},{"propertyName":"TrainNo","method":0}]}}';
  // private baseUrl = 'https://mis.metro.com/MimicRecordLine/api/MimicRecordsLine4';

  isLocal: boolean = true;

  private baseUrllocal1 = 'https://mis.metro.com/MimicRecordLine/api2/MimicRecordsLine4Dir1';
  private baseUrllocal2 = 'https://mis.metro.com/MimicRecordLine/api2/MimicRecordsLine4Dir2';
  private baseUrlserver1 = 'https://mis.metro.com/MimicRecordLine/api/MimicRecordsLine4Dir1';
  private baseUrlserver2 = 'https://mis.metro.com/MimicRecordLine/api/MimicRecordsLine4Dir2';
  //https://mis.metro.com/tccpermission/


  getRecords(dir: number): Observable<MimicRecordsLine4Dto[]> {
    if (dir == 1) {
      return this.http.get<any>(this.isLocal ? this.baseUrllocal1 : this.baseUrlserver1).pipe(
        map(res => Array.isArray(res?.result) ? res.result : [])
      );
    }
    else {
      return this.http.get<any>(this.isLocal ? this.baseUrllocal2 : this.baseUrlserver2).pipe(
        map(res => Array.isArray(res?.result) ? res.result : [])
      );
    }
  }


}
