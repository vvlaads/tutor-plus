import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { DialogMode, ScheduleObject } from '../../app.enums';
import { SCHEDULE_OBJECT_OPTIONS } from '../../app.constants';
import { TodayLessonsTableComponent } from "../../components/today-lessons-table/today-lessons-table.component";
import { DialogService } from '../../services/dialog.service';
import { convertStringToDate } from '../../functions/dates';
import { ScheduleTableComponent } from "../../components/schedule-table/schedule-table.component";

@Component({
  standalone: true,
  selector: 'app-schedule',
  imports: [CommonModule, TodayLessonsTableComponent, ScheduleTableComponent],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css'
})
export class ScheduleComponent {
  private oneDayFormat = true;

  public pageMarginLeftPercentage: number = 0;
  public currentDate = new Date();

  public constructor(private layoutService: LayoutService, private dialogService: DialogService) {
    this.layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => {
      this.pageMarginLeftPercentage = pageMarginLeftPercentage;
    })
    this.layoutService.oneDayFormat$.subscribe(oneDayFormat => {
      this.oneDayFormat = oneDayFormat;
    })
  }

  public setOneDayFormat(isOneDayFormat: boolean): void {
    this.layoutService.setOneDayFormat(isOneDayFormat);
  }

  public isOneDayFormat(): boolean {
    return this.oneDayFormat;
  }

  public resetCurrentDate(): void {
    this.currentDate = new Date();
  }

  public goPrev(): void {
    const newDate = new Date(this.currentDate);
    if (this.oneDayFormat) {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    this.currentDate = newDate;
  }

  public findDate(): void {
    const dialogRef = this.dialogService.openFindDateDialog();
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.currentDate = new Date(convertStringToDate(result));
      }
    });
  }

  public goNext(): void {
    const newDate = new Date(this.currentDate);
    if (this.oneDayFormat) {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    this.currentDate = newDate;
  }

  public addScheduleObject(): void {
    const dialogRef = this.dialogService.openChoiceDialog(SCHEDULE_OBJECT_OPTIONS);
    dialogRef.afterClosed().subscribe(result => {
      switch (result) {
        case ScheduleObject.Lesson:
          this.dialogService.openLessonDialog(DialogMode.Add, null);
          break;
        case ScheduleObject.Slot:
          this.dialogService.openSlotDialog(DialogMode.Add, null);
      }
    })
  }
}

