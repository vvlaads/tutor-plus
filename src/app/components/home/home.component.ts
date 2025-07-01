import { Component } from '@angular/core';
import { NavigationComponent } from "../navigation/navigation.component";
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-home',
  imports: [NavigationComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  marginLeft = '25%';

  constructor(private layoutService: LayoutService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.marginLeft = isHide ? '7%' : '25%'
    })
  }
}
