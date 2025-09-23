
export interface Query {
    pageNumber: number; // 1-based
    pageSize: number;
    filters?: Record<string, string | number>;
}
