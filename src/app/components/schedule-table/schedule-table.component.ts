import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { BLOCK_HEIGHT_IN_PIXELS, BLOCK_WIDTH_PERCENTAGE, HEADER_HEIGHT_IN_PIXELS, LOWER_MONTH_NAMES, MINUTES_IN_HOUR, MONTH_NAMES, SCHEDULE_OBJECT_OPTIONS, TIME_COLUMN_WIDTH_PERCENTAGE, TIMES, WEEKDAY_FULL_NAMES, WEEKDAY_NAMES } from '../../app.constants';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../services/lesson.service';
import { Lesson, Slot, Student, TimeBlock, WaitingBlock } from '../../app.interfaces';
import { convertDateToString, convertMinutesToTime, convertStringToDate, convertTimeToMinutes, getHoursFromTime, hasOverlay, isDatesEquals } from '../../functions/dates';
import { StudentService } from '../../services/student.service';
import { DialogService } from '../../services/dialog.service';
import { DialogMode, ScheduleObject } from '../../app.enums';
import { SlotService } from '../../services/slot.service';
import { NotificationComponent } from "../notification/notification.component";
import { WaitingBlockService } from '../../services/waiting-block.service';
import { Router } from '@angular/router';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-schedule-table',
  imports: [CommonModule, NotificationComponent],
  templateUrl: './schedule-table.component.html',
  styleUrl: './schedule-table.component.css'
})
export class ScheduleTableComponent implements OnInit, OnChanges, AfterViewInit {
  private students: Student[] = [];
  private lessons: Lesson[] = [];
  private slots: Slot[] = []
  private waitingBlocks: WaitingBlock[] = [];
  private dialogService = inject(DialogService);
  private lessonService = inject(LessonService);
  private studentService = inject(StudentService);
  private slotService = inject(SlotService);
  private router = inject(Router);
  private waitingBlockService = inject(WaitingBlockService);
  private deviceService = inject(DeviceService);
  public deviceType$ = this.deviceService.deviceType$;

  public weekDayNames = WEEKDAY_NAMES;
  public monthNames = MONTH_NAMES;
  public times = TIMES;
  public blockHeight = BLOCK_HEIGHT_IN_PIXELS;
  public headerHeight = HEADER_HEIGHT_IN_PIXELS;
  public blockWidthPercentage = BLOCK_WIDTH_PERCENTAGE;
  public timeWidthPercentage = TIME_COLUMN_WIDTH_PERCENTAGE;
  public weekDates: Date[] = []
  public currentWeekLessons: Lesson[] = [];
  public currentWeekSlots: Slot[] = [];
  public studentsByLessonId: Map<string, Student> = new Map();
  public slotsIsVisible = false;
  public changeVisibilityTitle = 'Показать окна';

  @Input()
  public currentDate: Date = new Date();
  @ViewChild('notification')
  public notification!: NotificationComponent;
  @ViewChild('tableContainer')
  public tableContainer!: ElementRef<HTMLElement>;

  public ngOnInit(): void {
    this.updateCurrentWeek();
    this.subscribeToLessons();
    this.subscribeToSlots();
    this.subscribeToStudents();
    this.subscribeToWaitingBlocks();
  }

  public ngAfterViewInit(): void {
    this.scrollToEight();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate']) {
      this.updateCurrentWeek();
      this.updateLessons();
      this.updateSlots();
    }
  }

  private async subscribeToLessons(): Promise<void> {
    this.lessonService.loadLessons();
    this.lessonService.lessons$.subscribe(lessons => {
      this.lessons = lessons;
      this.updateLessons();
    });
  }

  private async subscribeToSlots(): Promise<void> {
    this.slotService.loadSlots();
    this.slotService.slots$.subscribe(slots => {
      this.slots = slots;
      this.updateSlots();
    })
  }

  private subscribeToStudents(): void {
    this.studentService.students$.subscribe(students => {
      this.students = students;
    })
  }

  private subscribeToWaitingBlocks(): void {
    this.waitingBlockService.waitingBlocks$.subscribe(waitingBlocks => {
      this.waitingBlocks = waitingBlocks;
    })
  }

  private updateLessons(): void {
    this.currentWeekLessons = this.lessons.filter(lesson => {
      try {
        const lessonDate = convertStringToDate(lesson.date);
        return this.weekDates.some(date => isDatesEquals(date, lessonDate));
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });
  }

  private updateSlots(): void {
    this.currentWeekSlots = this.slots.filter(slot => {
      try {
        const slotDate = convertStringToDate(slot.date);
        return this.weekDates.some(date => isDatesEquals(date, slotDate));
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });
  }

  public getStudentByLesson(lesson: Lesson): Student | null {
    for (let student of this.students) {
      if (student.id === lesson.studentId) {
        return student;
      }
    }
    return null;
  }

  private getDateByDayName(dayName: string): Date | null {
    for (let i = 0; i < this.weekDayNames.length; i++) {
      if (this.weekDayNames[i] === dayName) {
        return this.weekDates[i];
      }
    }
    return null;
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

  public getTimeBlockTopPosition(timeBlock: TimeBlock): number {
    const hours = getHoursFromTime(timeBlock.startTime);
    const diff = convertTimeToMinutes(timeBlock.startTime);
    return diff * this.blockHeight / MINUTES_IN_HOUR + this.headerHeight - hours;
  }


  public getTimeBlockHeight(timeBlock: TimeBlock): number {
    const start = convertTimeToMinutes(timeBlock.startTime);
    const end = convertTimeToMinutes(timeBlock.endTime);
    const duration = end - start;
    return duration * this.blockHeight / MINUTES_IN_HOUR;
  }

  public getTimeBlockLeftPosition(timeBlock: TimeBlock): number {
    const timeBlockDate = convertStringToDate(timeBlock.date);
    const dayIndex = this.weekDates.findIndex(date => isDatesEquals(date, timeBlockDate));

    if (dayIndex === -1) return 0;
    return TIME_COLUMN_WIDTH_PERCENTAGE + (dayIndex * BLOCK_WIDTH_PERCENTAGE);
  }

  private getNextTime(time: string): string {
    let timeInMinutes = convertTimeToMinutes(time)
    timeInMinutes += 60;
    let nextTime = ''
    try {
      nextTime = convertMinutesToTime(timeInMinutes)
    } catch (error) {
      timeInMinutes -= 5;
      nextTime = convertMinutesToTime(timeInMinutes)
    }
    return nextTime;
  }

  public cellIsClicked(dayName: string, time: string): void {
    const date = this.getDateByDayName(dayName)
    let formattedDate = '';
    if (date) {
      formattedDate = convertDateToString(date);
    }
    let timeBlock = { startTime: time, endTime: this.getNextTime(time), date: formattedDate };

    const dialogRef = this.dialogService.openChoiceDialog(SCHEDULE_OBJECT_OPTIONS);
    dialogRef.afterClosed().subscribe(result => {
      switch (result) {
        case ScheduleObject.Slot:
          this.dialogService.openSlotDialog(DialogMode.Add, timeBlock);
          break;
        case ScheduleObject.Lesson:
          this.dialogService.openLessonDialog(DialogMode.Add, timeBlock);
          break;
      }
    })
  }

  public isToday(index: number): boolean {
    const today = new Date();
    const date = this.weekDates[index];
    return isDatesEquals(today, date);
  }

  public isCurrentWeek(): boolean {
    for (let i = 0; i < this.weekDates.length; i++) {
      if (this.isToday(i)) {
        return true;
      }
    }
    return false;
  }

  public openLesson(lesson: Lesson): void {
    this.dialogService.openLessonDialog(DialogMode.Edit, lesson);
  }

  public openSlot(slot: Slot): void {
    this.dialogService.openSlotDialog(DialogMode.Edit, slot);
  }

  public copySlots(): void {
    let result = ``;
    let monday = new Date(this.weekDates[0]);
    monday.setHours(0, 0, 0, 0);
    let sunday = new Date(this.weekDates[6]);
    sunday.setHours(0, 0, 0, 0);
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextWeekToday = new Date(today);
    nextWeekToday.setDate(today.getDate() + 7);
    if (monday.getTime() <= today.getTime() && today.getTime() <= sunday.getTime()) {
      result += 'На этой неделе есть время:\n';
    } else if (monday.getTime() <= nextWeekToday.getTime() && nextWeekToday.getTime() <= sunday.getTime()) {
      result += 'На следующей неделе есть время:\n';
    } else {
      result += `На неделе с ${convertDateToString(monday)} по ${convertDateToString(sunday)} есть время:\n`;
    }

    const slots = this.sortSlotsByStartTime(this.currentWeekSlots);
    for (let i = 0; i < this.weekDates.length; i++) {
      for (let slot of this.currentWeekSlots) {
        if (isDatesEquals(convertStringToDate(slot.date), this.weekDates[i])) {
          result += `\n${WEEKDAY_FULL_NAMES[i]}, ${this.weekDates[i].getDate()} ${LOWER_MONTH_NAMES[this.weekDates[i].getMonth()]},\n`
          break;
        }
      }
      for (let slot of slots) {
        if (isDatesEquals(convertStringToDate(slot.date), this.weekDates[i])) {
          if (slot.hasRealEndTime) {
            result += `С ${slot.startTime} до ${slot.realEndTime} мск\n`
          } else {
            result += `С ${slot.startTime} до ${slot.endTime} мск\n`
          }
        }
      }
    }
    navigator.clipboard.writeText(result).then(() => {
      this.notification.show('Скопировано!', 2000);
    });
  }

  private sortSlotsByStartTime(slots: Slot[]): Slot[] {
    return slots.sort((a, b) => convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime))
  }

  public changeVisibilityOfSlots(): void {
    this.slotsIsVisible = !this.slotsIsVisible;
    if (this.slotsIsVisible) {
      this.changeVisibilityTitle = 'Скрыть окна';
    } else {
      this.changeVisibilityTitle = 'Показать окна';
    }
  }

  public scrollToEight(): void {
    if (!this.tableContainer) return;
    const targetTime = '08:00'

    const rowIndex = this.times.indexOf(targetTime);
    if (rowIndex === -1) return;

    const scrollPosition = rowIndex * this.blockHeight - HEADER_HEIGHT_IN_PIXELS;

    this.tableContainer.nativeElement.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }

  public hasWaitList(dayIndex: number): boolean {
    const date = this.weekDates[dayIndex];
    for (let block of this.waitingBlocks) {
      if (isDatesEquals(convertStringToDate(block.date), date)) {
        return true;
      }
    }
    return false;
  }

  public openWaitList(dayIndex: number): void {
    const date = this.weekDates[dayIndex];
    this.router.navigate(['wait-list']);
  }
}