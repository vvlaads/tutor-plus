import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private getDeviceType(width: number): DeviceType {
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  public get deviceType$(): Observable<DeviceType> {
    return fromEvent(window, 'resize').pipe(
      debounceTime(300),
      map(() => window.innerWidth),
      startWith(window.innerWidth),
      map(width => this.getDeviceType(width))
    );
  }

  public get currentDeviceType(): DeviceType {
    return this.getDeviceType(window.innerWidth);
  }
}