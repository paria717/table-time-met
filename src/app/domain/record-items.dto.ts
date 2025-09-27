
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
    // movement duration(arrive)
    s118a!: number | null; s119a!: number | null; s120a!: number | null; s121a!: number | null;
    s122a!: number | null; s123a!: number | null; s124a!: number | null; s125a!: number | null;
    s126a!: number | null; s127a!: number | null; s128a!: number | null; s129a!: number | null;
    s130a!: number | null; s131a!: number | null; s132a!: number | null; s133a!: number | null;
    s134a!: number | null; s135a!: number | null; s136a!: number | null; s137a!: number | null;
    //Stop time
    s118stop!: number | null; s119stop!: number | null; s120stop!: number | null; s121stop!: number | null;
    s122stop!: number | null; s123stop!: number | null; s124stop!: number | null; s125stop!: number | null;
    s126stop!: number | null; s127stop!: number | null; s128stop!: number | null; s129stop!: number | null;
    s130stop!: number | null; s131stop!: number | null; s132stop!: number | null; s133stop!: number | null;
    s134stop!: number | null; s135stop!: number | null; s136stop!: number | null; s137stop!: number | null;
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
