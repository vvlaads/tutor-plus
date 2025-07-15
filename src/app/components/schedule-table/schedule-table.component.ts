import { Component, inject, OnInit } from '@angular/core';
import { BLOCK_HEIGHT_IN_PIXELS, BLOCK_WIDTH_PERCENTAGE, HEADER_HEIGHT_IN_PIXELS, MINUTES_IN_HOUR, MONTH_NAMES, SCHEDULE_OBJECT_OPTIONS, TIME_COLUMN_WIDTH_PERCENTAGE, TIMES, WEEKDAY_NAMES } from '../../app.constants';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../services/lesson.service';
import { Lesson, Slot, Student, TimeBlock } from '../../app.interfaces';
import { convertDateToString, convertMinutesToTime, convertStringToDate, convertTimeToMinutes, getHoursFromTime, hasOverlay, isDatesEquals } from '../../functions/dates';
import { StudentService } from '../../services/student.service';
import { DialogService } from '../../services/dialog.service';
import { DialogMode, ScheduleObject } from '../../app.enums';
import { SlotService } from '../../services/slot.service';

@Component({
  selector: 'app-schedule-table',
  imports: [CommonModule],
  templateUrl: './schedule-table.component.html',
  styleUrl: './schedule-table.component.css'
})
export class ScheduleTableComponent implements OnInit {
  public weekDayNames = WEEKDAY_NAMES;
  public monthNames = MONTH_NAMES;
  public times = TIMES;
  public blockHeight = BLOCK_HEIGHT_IN_PIXELS;
  public headerHeight = HEADER_HEIGHT_IN_PIXELS;
  public blockWidthPercentage = BLOCK_WIDTH_PERCENTAGE;
  public timeWidthPercentage = TIME_COLUMN_WIDTH_PERCENTAGE;

  public weekDates: Date[] = []
  public currentDate: Date = new Date();

  private students: Student[] = [];

  private lessons: Lesson[] = [];
  public currentWeekLessons: Lesson[] = [];

  private slots: Slot[] = []
  public currentWeekSlots: Slot[] = [];

  public studentsByLessonId: Map<string, Student> = new Map();
  private dialogService = inject(DialogService);

  constructor(private lessonService: LessonService, private studentService: StudentService, private slotService: SlotService) {
  }

  public ngOnInit(): void {
    this.updateCurrentWeek();
    this.subscribeToLessons();
    this.subscribeToSlots();
    this.subscribeToStudents();
  }

  private async subscribeToLessons() {
    this.lessonService.loadLessons();
    this.lessonService.lessons$.subscribe(lessons => {
      this.lessons = lessons;
      this.updateLessons();
    });
  }

  private async subscribeToSlots() {
    this.slotService.loadSlots();
    this.slotService.slots$.subscribe(slots => {
      this.slots = slots;
      this.updateSlots();
    })
  }

  private subscribeToStudents(): void {
    this.studentService.loadStudents();
    this.studentService.students$.subscribe(students => {
      this.students = students;
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

  public cellIsDisabled(dayName: string, time: string): boolean {
    const date = this.getDateByDayName(dayName)
    const startTime = time;
    const endTime = this.getNextTime(time);
    if (date) {
      const timeBlock = { date: convertDateToString(date), startTime: startTime, endTime: endTime };
      for (let lesson of this.currentWeekLessons) {
        if (hasOverlay(lesson, timeBlock)) {
          return true;
        }
      }
    }
    return false;
  }

  public cellIsClicked(dayName: string, time: string): void {
    if (!this.cellIsDisabled(dayName, time)) {
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
  }

  public isCurrent(index: number): boolean {
    const today = new Date();
    const date = this.weekDates[index];
    return isDatesEquals(today, date);
  }

  public openLesson(lesson: Lesson): void {
    this.dialogService.openLessonDialog(DialogMode.Edit, lesson);
  }

  public openSlot(slot: Slot): void {
    this.dialogService.openSlotDialog(DialogMode.Edit, slot);
  }
}
