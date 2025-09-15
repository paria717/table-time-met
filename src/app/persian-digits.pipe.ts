import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'persianDigits', standalone: true })
export class PersianDigitsPipe implements PipeTransform {
  private mapEnToFa = new Map<string, string>([
    ['0','۰'],['1','۱'],['2','۲'],['3','۳'],['4','۴'],
    ['5','۵'],['6','۶'],['7','۷'],['8','۸'],['9','۹']
  ]);

  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return s.replace(/[0-9]/g, d => this.mapEnToFa.get(d) ?? d);
  }
}
