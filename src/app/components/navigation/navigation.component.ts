import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ProfileIconComponent } from "../profile-icon/profile-icon.component";
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';
import { Section } from '../../app.enums';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [ProfileIconComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit, OnDestroy {
  public selectedSection = Section.Home;
  public isHide = false;
  private subscriptions: Subscription[] = [];

  public constructor(
    private router: Router,
    private authService: AuthService,
    private layoutService: LayoutService
  ) { }

  public ngOnInit(): void {
    this.subscriptions.push(
      this.layoutService.isHide$.subscribe(isHide => {
        this.isHide = isHide;
      })
    );

    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.updateSelectedSection(event.urlAfterRedirects);
      })
    );

    this.updateSelectedSection(this.router.url);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateSelectedSection(url: string): void {
    if (url.startsWith('/student') || url.includes('/student/')) {
      this.selectedSection = Section.Students;
    } else if (url.startsWith('/schedule') || url.includes('/schedule/')) {
      this.selectedSection = Section.Schedule;
    } else {
      this.selectedSection = Section.Home;
    }
  }

  public redirectToTarget(target: string): void {
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

  public logout(): void {
    this.authService.signOut();
  }

  public clickToHideButton(): void {
    this.layoutService.toggleNavigation();
  }

  public targetIsSelected(target: string): boolean {
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