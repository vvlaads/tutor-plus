import { Component } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { PAGE_MARGIN_LEFT_PERCENTAGE, PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN } from '../../app.constants';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public pageMarginLeftPercentage: number = PAGE_MARGIN_LEFT_PERCENTAGE;

  public constructor(private layoutService: LayoutService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.pageMarginLeftPercentage = isHide ? PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN : PAGE_MARGIN_LEFT_PERCENTAGE
    })
  }
}
