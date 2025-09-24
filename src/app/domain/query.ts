export type SortMethod = 0 | 1; // 0=Asc, 1=Desc
export type SortCondition = { propertyName: string; method: SortMethod };
export interface Query {
    pageNumber: number; // 1-based
    pageSize: number;
    filters?: Record<string, string | number>;
    // sorting?:Record<string, string | number>;
    sorting?: { conditions: SortCondition[] };
}
