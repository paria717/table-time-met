export class RequestParams {
    paging?: RequestPaging;
    filtering?: RequestFiltering;
    sorting?: RequestSorting;
    public constructor(init?: Partial<RequestParams>) {
        Object.assign(this, init);
    }
}

export class RequestPaging {
    pageNumber?: number;
    pageSize?: number;
    public constructor(init?: Partial<RequestPaging>) {
        Object.assign(this, init);
    }
}

export enum FilterMethod {
    Equal = 0,
    GreaterThan = 1,
    GreaterThanOrEqual = 2,
    LessThan = 3,
    LessThanOrEqual = 4,
    Contains = 5,
    NotContains = 8,
    StartsWith = 6,
    EndsWith = 7
}

export class RequestFiltering {
    conditions: FilterCondition[] = [];
    public constructor(init?: Partial<RequestFiltering>) {
        Object.assign(this, init);
    }
}

export class FilterCondition {
    propertyName!: string;
    propertyValue!: any;
    method!: FilterMethod;
    group?: number;
    public constructor(init?: Partial<FilterCondition>) {
        Object.assign(this, init);
    }
}

export enum SortMethod {
    Aascending = 0,
    Descending = 1,
}

export class RequestSorting {
    conditions: SortCondition[] = [];
}

export class SortCondition {
    propertyName!: string;
    method!: SortMethod;
}