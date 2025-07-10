import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Section } from '../../../app.enums';

@Component({
  selector: 'app-mobile-navigation',
  imports: [],
  templateUrl: './mobile-navigation.component.html',
  styleUrl: './mobile-navigation.component.css'
})
export class MobileNavigationComponent {
  @Input() isHide: boolean = false;
  @Input() selectedSection: Section | null = null;

  @Output() hideClick = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  targetIsSelected(target: string): boolean {
    switch (target) {
      case '': return this.selectedSection === Section.Home;
      case 'students': return this.selectedSection === Section.Students;
      case 'schedule': return this.selectedSection === Section.Schedule;
      default: return false;
    }
  }
}
