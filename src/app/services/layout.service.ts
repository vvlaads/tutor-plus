import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private pageMarginLeftPercentage = new BehaviorSubject<number>(0);

  public pageMarginLeftPercentage$ = this.pageMarginLeftPercentage.asObservable();

  public setPageMarginLeft(percentage: number): void {
    if (percentage < 100 && percentage >= 0) {
      this.pageMarginLeftPercentage.next(percentage);
    }
  }
}
