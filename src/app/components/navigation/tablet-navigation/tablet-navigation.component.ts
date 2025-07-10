import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PAGE_MARGIN_LEFT_PERCENTAGE, PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN } from '../../../app.constants';
import { LayoutService } from '../../../services/layout.service';
import { Section } from '../../../app.enums';
import { ProfileIconComponent } from "../../profile-icon/profile-icon.component";

@Component({
  selector: 'app-tablet-navigation',
  imports: [ProfileIconComponent],
  templateUrl: './tablet-navigation.component.html',
  styleUrl: './tablet-navigation.component.css'
})
export class TabletNavigationComponent {
  public isHide: boolean = false;
  @Input() selectedSection: Section | null = null;

  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Input() targetIsSelected!: (target: string) => boolean;

  private pageMarginLeftPercentage = PAGE_MARGIN_LEFT_PERCENTAGE;

  constructor(private layoutService: LayoutService) {
    layoutService.setPageMarginLeft(PAGE_MARGIN_LEFT_PERCENTAGE);
  }

  public clickToHideButton(): void {
    this.isHide = !this.isHide;
    if (this.isHide) {
      this.pageMarginLeftPercentage = PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN
    } else {
      this.pageMarginLeftPercentage = PAGE_MARGIN_LEFT_PERCENTAGE;
    }
    this.layoutService.setPageMarginLeft(this.pageMarginLeftPercentage);
  }
}
