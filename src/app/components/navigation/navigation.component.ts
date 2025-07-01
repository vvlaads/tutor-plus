import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileIconComponent } from "../profile-icon/profile-icon.component";
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [ProfileIconComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {
  isHide = false;

  constructor(private router: Router, private authService: AuthService, private layoutService: LayoutService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.isHide = isHide;
    });
  }

  redirectToTarget(target: string) {
    this.router.navigate([target]);
  }

  logout() {
    this.authService.signOut();
  }

  clickToHideButton() {
    this.layoutService.toggleNavigation();
  }
}
