import { Component } from '@angular/core';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public pageMarginLeftPercentage = 0;

  public constructor(private layoutService: LayoutService) {
    layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => this.pageMarginLeftPercentage = pageMarginLeftPercentage);
  }
}
