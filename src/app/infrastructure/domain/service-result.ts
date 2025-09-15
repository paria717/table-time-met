export class ServiceResult<T = undefined> {
    result?: T;
    pageNumber?: number;
    pageSize?: number;
    count?: number;
    isSuccess!: boolean;
    message?: string;
    statusCode!: number;
}