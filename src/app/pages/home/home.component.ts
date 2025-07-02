import { Component } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { NavigationComponent } from '../../components/navigation/navigation.component';

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
