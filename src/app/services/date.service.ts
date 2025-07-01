import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  currentDate: string = '';
  constructor() { }
}
