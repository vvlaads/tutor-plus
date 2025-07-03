import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ProfileIconComponent } from "../profile-icon/profile-icon.component";
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';
import { Section } from '../../app.enums';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [ProfileIconComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnInit {
  isHide = false;
  selectedSection = Section.Home;

  constructor(private router: Router, private authService: AuthService, private layoutService: LayoutService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.isHide = isHide;
    });
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const fullUrl = event.urlAfterRedirects;
      console.log(fullUrl);
      if (fullUrl.includes('student')) {
        this.selectedSection = Section.Students;
      } else if (fullUrl.includes('schedule')) {
        this.selectedSection = Section.Schedule;
      } else {
        this.selectedSection = Section.Home;
      }
    });
  }

  redirectToTarget(target: string) {
    switch (target) {
      case '':
        this.selectedSection = Section.Home;
        break;
      case 'students':
        this.selectedSection = Section.Students;
        break;
      case 'schedule':
        this.selectedSection = Section.Schedule;
        break;
    }
    this.router.navigate([target]);
  }

  logout() {
    this.authService.signOut();
  }

  clickToHideButton() {
    this.layoutService.toggleNavigation();
  }

  targetIsSelected(target: string): boolean {
    switch (target) {
      case '':
        return this.selectedSection === Section.Home;
      case 'students':
        return this.selectedSection === Section.Students;
      case 'schedule':
        return this.selectedSection === Section.Schedule;
    }
    return false;
  }
}
