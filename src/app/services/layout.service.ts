import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private isHide = new BehaviorSubject<boolean>(false);
  isHide$ = this.isHide.asObservable();

  toggleNavigation() {
    this.isHide.next(!this.isHide.value);
  }
}
