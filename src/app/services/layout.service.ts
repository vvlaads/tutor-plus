import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private isHide = new BehaviorSubject<boolean>(false);

  public isHide$ = this.isHide.asObservable();

  public toggleNavigation(): void {
    this.isHide.next(!this.isHide.value);
  }
}
