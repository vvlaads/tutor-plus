import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Section } from '../../app.enums';
import { DeviceService, DeviceType } from '../../services/device.service';
import { CommonModule } from '@angular/common';
import { DesktopNavigationComponent } from "./desktop-navigation/desktop-navigation.component";
import { MobileNavigationComponent } from "./mobile-navigation/mobile-navigation.component";
import { TabletNavigationComponent } from "./tablet-navigation/tablet-navigation.component";

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, DesktopNavigationComponent, MobileNavigationComponent, TabletNavigationComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  public selectedSection = Section.Home;
  public deviceType: DeviceType;

  public constructor(
    private router: Router,
    private authService: AuthService,
    private deviceService: DeviceService
  ) {
    this.deviceType = this.deviceService.currentDeviceType;
    this.deviceService.deviceType$.subscribe(type => {
      this.deviceType = type;
    })
  }

  public ngOnInit(): void {
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
    } else if (url.startsWith('/wait-list') || url.includes('/wait-list/')) {
      this.selectedSection = Section.WaitList;
    } else {
      this.selectedSection = Section.Home;
    }
  }

  public redirectToTarget(target: string): void {
    switch (target) {
      case 'home':
        this.selectedSection = Section.Home;
        break;
      case 'students':
        this.selectedSection = Section.Students;
        break;
      case 'schedule':
        this.selectedSection = Section.Schedule;
        break;
      case 'wait-list':
        this.selectedSection = Section.WaitList;
        break;
    }
    this.router.navigate([target]);
  }

  public logout(): void {
    this.authService.signOut();
  }

  public targetIsSelected(target: string): boolean {
    switch (target) {
      case 'home':
        return this.selectedSection === Section.Home;
      case 'students':
        return this.selectedSection === Section.Students;
      case 'schedule':
        return this.selectedSection === Section.Schedule;
      case 'wait-list':
        return this.selectedSection === Section.WaitList;
    }
    return false;
  }
}