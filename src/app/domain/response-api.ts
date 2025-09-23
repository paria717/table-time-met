import { RecordItemsDto } from "./record-items.dto";


export interface ApiResponse {
  pageNumber: number | null;
  pageSize: number | null;
  count: number;
  result: RecordItemsDto[];
  isSuccess: boolean;
  message: string | null;
  statusCode: number;
}
