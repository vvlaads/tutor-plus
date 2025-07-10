import { Component, inject } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { DeviceService } from '../../services/device.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public pageMarginLeftPercentage: number = 0;
  private deviceService = inject(DeviceService);
  public deviceType$ = this.deviceService.deviceType$;

  public constructor(private layoutService: LayoutService) {
    this.layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => {
      this.pageMarginLeftPercentage = pageMarginLeftPercentage;
    })
  }
}
