
export class RecordItemsDto {
    rowNum2!: number;
    rowNum!: number;
    id!: number;
    dataType!: number | null;
    direction!: number | null;
    date!: string | null;
    trainNo!: number | null;
    headway!: number | null;
    dayType!: number | null;
    deptRank!: number | null;
    // enter time
    s118!: string | null; s119!: string | null; s120!: string | null; s121!: string | null;
    s122!: string | null; s123!: string | null; s124!: string | null; s125!: string | null;
    s126!: string | null; s127!: string | null; s128!: string | null; s129!: string | null;
    s130!: string | null; s131!: string | null; s132!: string | null; s133!: string | null;
    s134!: string | null; s135!: string | null; s136!: string | null; s137!: string | null;
    // exit time
    s118E!: string | null; s119E!: string | null; s120E!: string | null; s121E!: string | null;
    s122E!: string | null; s123E!: string | null; s124E!: string | null; s125E!: string | null;
    s126E!: string | null; s127E!: string | null; s128E!: string | null; s129E!: string | null;
    s130E!: string | null; s131E!: string | null; s132E!: string | null; s133E!: string | null;
    s134E!: string | null; s135E!: string | null; s136E!: string | null; s137E!: string | null;
    // planning time
    s118P!: string | null; s119P!: string | null; s120P!: string | null; s121P!: string | null;
    s122P!: string | null; s123P!: string | null; s124P!: string | null; s125P!: string | null;
    s126P!: string | null; s127P!: string | null; s128P!: string | null; s129P!: string | null;
    s130P!: string | null; s131P!: string | null; s132P!: string | null; s133P!: string | null;
    s134P!: string | null; s135P!: string | null; s136P!: string | null; s137P!: string | null;
    dataTypeName!: string | null;
    dayTypeName!: string | null;
    dateP!: string | null;
    totalTirpTime!: number | null;
    totalStopTime!: number | null;
    totalArriveTime!: number | null;
    dispatchNo!: number | null
}
