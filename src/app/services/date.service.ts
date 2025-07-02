import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  currentDate: string = '';
  constructor() { }

  isDatesEquals(date1: Date, date2: Date): boolean {
    if (date1.getFullYear() === date2.getFullYear()) {
      if (date1.getMonth() === date2.getMonth()) {
        if (date1.getDate() === date2.getDate()) {
          return true;
        }
      }
    }
    return false;
  }
}
