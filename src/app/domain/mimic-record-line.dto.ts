export class MimicRecordsLine4Dto {
  id!: number;
  dataType!: number;
  direction!: number;
  date!: string;
  trainNo!: number;
  headway!: number;
  dayType!: number;

  s118?: string; s119?: string; s120?: string; s121?: string; s122?: string;
  s123?: string; s124?: string; s125?: string; s126?: string; s127?: string;
  s128?: string; s129?: string; s130?: string; s131?: string; s132?: string;
  s133?: string; s134?: string; s135?: string; s136?: string; s137?: string;

  detail?: string;

  deletedUserId?: number;
  deletedDateTime?: string;
  createdUserId?: number;
  createdDateTime?: string;
  updatedUserId?: number;
  updatedDateTime?: string;
  isDeleted?: boolean;

  dataTypeName?: string;
  dayTypeName?: string;
}
