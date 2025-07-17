import { Component, inject, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { CommonModule } from '@angular/common';
import { HEADER_HEIGHT_IN_PIXELS, MONTH_NAMES, WEEKDAY_NAMES } from '../../app.constants';
import { DialogService } from '../../services/dialog.service';
import { Student, WaitingBlock } from '../../app.interfaces';
import { WaitingBlockService } from '../../services/waiting-block.service';
import { convertDateToString, convertStringToDate, convertTimeToMinutes, isDatesEquals } from '../../functions/dates';
import { DialogMode } from '../../app.enums';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-wait-list',
  imports: [CommonModule],
  templateUrl: './wait-list.component.html',
  styleUrl: './wait-list.component.css'
})
export class WaitListComponent implements OnInit {
  private dialogService = inject(DialogService);
  private waitingBlockService = inject(WaitingBlockService);
  private studentService = inject(StudentService);
  private waitingBlocks: WaitingBlock[] = []
  private students: Student[] = [];

  public pageMarginLeftPercentage: number = 0;
  public blockHeight = 150;
  public weekDayNames = WEEKDAY_NAMES;
  public headerHeight = HEADER_HEIGHT_IN_PIXELS;
  public monthNames = MONTH_NAMES;
  public currentDate: Date = new Date();
  public today: Date = new Date();
  public weekDates: Date[] = [];
  public blocksByDay: Map<number, WaitingBlock[]> = new Map();

  public constructor(private layoutService: LayoutService) {
    this.layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => {
      this.pageMarginLeftPercentage = pageMarginLeftPercentage;
    })
  }

  public ngOnInit(): void {
    this.updateCurrentWeek();
    this.subscribeToWaitingBlocks();
    this.subscribeToStudents();
  }

  private updateCurrentDate(newDate: Date) {
    this.currentDate = new Date(newDate);
    this.updateCurrentWeek();
    this.updateWaitingBlocks();
  }

  private updateCurrentWeek(): void {
    const monday = new Date(this.currentDate);
    const dayOfWeek = this.currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(this.currentDate.getDate() - diff);

    this.weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }

  private subscribeToWaitingBlocks(): void {
    this.waitingBlockService.loadWaitingBlocks();
    this.waitingBlockService.waitingBlocks$.subscribe(waitingBlocks => {
      this.waitingBlocks = waitingBlocks;
      this.updateWaitingBlocks();
    })
  }

  private updateWaitingBlocks() {
    this.blocksByDay.clear();

    const blocks = this.waitingBlocks.filter(block =>
      this.weekDates.some(date => isDatesEquals(convertStringToDate(block.date), date))
    );

    blocks.forEach(block => {
      const blockDate = convertStringToDate(block.date);
      for (let i = 0; i < this.weekDates.length; i++) {
        if (isDatesEquals(blockDate, this.weekDates[i])) {
          let arr = this.blocksByDay.get(i);
          if (!arr) {
            arr = [];
          }
          arr.push(block);
          this.blocksByDay.set(i, arr);
        }
      }
    });
  }

  private subscribeToStudents(): void {
    this.studentService.students$.subscribe(students => {
      this.students = students;
    })
  }

  public isToday(index: number): boolean {
    const today = new Date();
    const date = this.weekDates[index];
    return isDatesEquals(today, date);
  }

  public getBlocksForDay(dayIndex: number): WaitingBlock[] {
    return this.blocksByDay.get(dayIndex) || [];
  }

  public getStudent(id: string): Student | null {
    for (let student of this.students) {
      if (student.id === id) {
        return student;
      }
    }
    return null;
  }

  public openBlock(block: WaitingBlock): void {
    this.dialogService.openWaitingBlockDialog(DialogMode.Edit, block);
  }

  public addWaitingBlock(): void {
    this.dialogService.openWaitingBlockDialog(DialogMode.Add, null);
  }

  public cellIsClicked(dayIndex: number) {
    const block = { date: convertDateToString(this.weekDates[dayIndex]) };
    this.dialogService.openWaitingBlockDialog(DialogMode.Add, block);
  }

  public resetCurrentDate(): void {
    this.updateCurrentDate(new Date());
  }

  public goPrev(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 7);
    this.updateCurrentDate(newDate);
  }

  public findDate(): void {
    const dialogRef = this.dialogService.openFindDateDialog();
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCurrentDate(new Date(convertStringToDate(result)))
      }
    });
  }

  public goNext(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 7);
    this.updateCurrentDate(newDate);
  }

  public goBack(): void {
    window.history.back();
  }
}