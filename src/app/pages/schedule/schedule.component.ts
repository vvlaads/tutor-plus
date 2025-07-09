import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { DialogMode, ScheduleObject } from '../../app.enums';
import { LessonService } from '../../services/lesson.service';
import { Lesson, Slot, Student } from '../../app.interfaces';
import { StudentService } from '../../services/student.service';
import { BLOCK_HEIGHT_PIXELS, BLOCK_WIDTH_PERCENTAGE, FROM_OPTIONS, HOURS_IN_DAY, MAX_LESSON_DURATION, MINUTES_IN_HOUR, MONTH_NAMES, PAGE_MARGIN_LEFT_PERCENTAGE, PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN, SCHEDULE_OBJECT_OPTIONS, TIME_COLUMN_WIDTH_PERCENTAGE, TIMES, WEEKDAY_NAMES } from '../../app.constants';
import { SlotService } from '../../services/slot.service';
import * as XLSX from 'xlsx';
import { DialogService } from '../../services/dialog.service';
import { convertDateToString, convertMinutesToTime, convertStringToDate, convertTimeToMinutes, isDatesEquals } from '../../functions/dates';

@Component({
  standalone: true,
  selector: 'app-schedule',
  imports: [CommonModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css'
})
export class ScheduleComponent implements OnInit {
  private dialogService = inject(DialogService);
  private lessons: Lesson[] = [];
  private slots: Slot[] = []
  private students: Student[] = [];

  public pageMarginLeftPercentage: number = PAGE_MARGIN_LEFT_PERCENTAGE;
  public blockHeightPixels: number = BLOCK_HEIGHT_PIXELS;
  public blockWidthPercentage: number = BLOCK_WIDTH_PERCENTAGE;
  public timeColumnWidthPercetage: number = TIME_COLUMN_WIDTH_PERCENTAGE;
  public times: string[] = TIMES;
  public monthNames: string[] = MONTH_NAMES;
  public weekDayNames: string[] = WEEKDAY_NAMES;
  public currentDate: Date = new Date();
  public today: Date = new Date();
  public isOneDayFormat: boolean = false;
  public currentWeekDates: Date[] = [];

  public currentWeekLessons: Lesson[] = [];
  public oneDayLessons: Lesson[] = [];
  public currentWeekSlots: Slot[] = [];

  public constructor(
    private layoutService: LayoutService,
    private lessonService: LessonService,
    private studentService: StudentService,
    private slotService: SlotService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.pageMarginLeftPercentage = isHide ? PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN : PAGE_MARGIN_LEFT_PERCENTAGE
    })
  }

  public ngOnInit(): void {
    this.updateCurrentWeek();
    this.subscribeToLessons();
    this.subscribeToStudents();
    this.subscribeToSlots();
  }

  private updateCurrentWeek(): void {
    const monday = new Date(this.currentDate);
    const dayOfWeek = this.currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(this.currentDate.getDate() - diff);

    this.currentWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }

  private async subscribeToLessons() {
    this.lessonService.loadLessons();
    this.lessonService.lessons$.subscribe(lessons => {
      this.lessons = lessons;
      this.updateLessons();
    });
  }

  private updateLessons(): void {
    this.oneDayLessons = this.lessons.filter(lesson => {
      try {
        const lessonDate = convertStringToDate(lesson.date);
        return isDatesEquals(this.currentDate, lessonDate);
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });

    this.sortLessonsByStartTime();

    this.currentWeekLessons = this.lessons.filter(lesson => {
      try {
        const lessonDate = convertStringToDate(lesson.date);
        return this.currentWeekDates.some(date => isDatesEquals(date, lessonDate));
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });
    console.log('cur les:', this.currentWeekLessons);
  }

  private subscribeToStudents(): void {
    this.studentService.loadStudents();
    this.studentService.students$.subscribe(students => {
      this.students = students;
    })
  }

  private subscribeToSlots(): void {
    this.slotService.loadSlots();
    this.slotService.slots$.subscribe(slots => {
      this.slots = slots;
      this.updateSlots();
    });
  }

  private updateSlots(): void {
    this.currentWeekSlots = this.slots.filter(slot => {
      try {
        const slotDate = convertStringToDate(slot.date);
        return this.currentWeekDates.some(date => isDatesEquals(date, slotDate));
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });
  }

  private updateCurrentDate(newDate: Date): void {
    this.currentDate = new Date(newDate);
    this.updateCurrentWeek();
    this.updateLessons();
    this.updateSlots();
  }

  private getDateByDayName(dayName: string): Date | null {
    if (this.weekDayNames.includes(dayName)) {
      for (var i = 0; i < this.weekDayNames.length; i++) {
        if (this.weekDayNames[i] === dayName) {
          return this.currentWeekDates[i];
        }
      }
    }
    return null
  }

  public getStudentByLesson(lesson: Lesson): Student | null {
    for (let student of this.students) {
      if (student.id === lesson.studentId) {
        return student;
      }
    }

    return null;
  }

  public setOneDayFormat(isOneDayFormat: boolean): void {
    this.isOneDayFormat = isOneDayFormat;
  }

  public goToPrev(): void {
    const newDate = new Date(this.currentDate);
    if (this.isOneDayFormat) {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    this.updateCurrentDate(newDate);
  }

  public goToNext(): void {
    const newDate = new Date(this.currentDate);
    if (this.isOneDayFormat) {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    this.updateCurrentDate(newDate);
  }

  public findDate(): void {
    const dialogRef = this.dialogService.openFindDateDialog();
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Переход к дате ${result}`)
      if (result !== undefined) {
        this.updateCurrentDate(convertStringToDate(result));
      } else {
        console.log("Дата для перехода не найдена")
      }
    });
  }

  public resetCurrentDate(): void {
    this.updateCurrentDate(this.today);
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

  private getConstantToFixOffset(hours: number): number {
    let c = 0;
    let counter = 0
    for (let i = 0; i <= hours; i++) {
      counter += 1;
      if (Number.isInteger(c)) {
        if (counter == 2) {
          counter = 0
          c += 0.5
        }
      } else {
        if (counter == 3) {
          counter = 0
          c += 0.5
        }
      }
    }
    return hours - c;
  }

  public getLessonHeight(lesson: Lesson): string {
    let startTime = convertTimeToMinutes(lesson.startTime);
    let endTime = convertTimeToMinutes(lesson.endTime);
    let hours = Math.floor(endTime / 60) - Math.floor(startTime / 60)

    return `${(endTime - startTime) * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours)}px`
  }

  public getLessonTop(lesson: Lesson): number {
    const totalMinutes = convertTimeToMinutes(lesson.startTime)
    const hours = Math.floor(totalMinutes / 60);
    return totalMinutes * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours);
  }

  public getLessonLeft(lesson: Lesson): number {
    const lessonDate = convertStringToDate(lesson.date);
    for (let i = 0; i < this.currentWeekDates.length; i++) {
      if (isDatesEquals(lessonDate, this.currentWeekDates[i])) {
        return this.timeColumnWidthPercetage + i * this.blockWidthPercentage;
      }
    }
    return 0;
  }

  public getSlotHeight(slot: Slot): string {
    let startTime = convertTimeToMinutes(slot.startTime);
    let endTime = convertTimeToMinutes(slot.endTime);
    let hours = Math.floor(endTime / 60) - Math.floor(startTime / 60)

    return `${(endTime - startTime) * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours)}px`
  }

  public getSlotTop(slot: Slot): number {
    const totalMinutes = convertTimeToMinutes(slot.startTime)
    const hours = Math.floor(totalMinutes / 60);
    return totalMinutes * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours);
  }

  public getSlotLeft(slot: Slot): number {
    const lessonDate = convertStringToDate(slot.date);
    for (let i = 0; i < this.currentWeekDates.length; i++) {
      if (isDatesEquals(lessonDate, this.currentWeekDates[i])) {
        return this.timeColumnWidthPercetage + i * this.blockWidthPercentage;
      }
    }
    return 0;
  }

  public addLesson() {
    this.dialogService.openLessonDialog(DialogMode.Add, null);
  }

  public editLesson(lesson: Lesson) {
    this.dialogService.openLessonDialog(DialogMode.Edit, lesson);
  }

  public editSlot(slot: Slot) {
    this.dialogService.openSlotDialog(DialogMode.Edit, slot);
  }

  public cellIsClicked(time: string, dayName: string) {
    if (this.isCellDisabled(time, dayName)) {
      return;
    }

    const date = this.getDateByDayName(dayName)
    if (!date) {
      return;
    }
    let options = SCHEDULE_OBJECT_OPTIONS
    const dialogRef = this.dialogService.openChoiceDialog(options);
    var endTime = this.getNextTime(time);

    dialogRef.afterClosed().subscribe((option) => {
      switch (option) {
        case ScheduleObject.Slot:
          const slot = { date: convertDateToString(date), startTime: time, endTime: endTime }
          this.dialogService.openSlotDialog(DialogMode.Add, slot);
          break;
        case ScheduleObject.Lesson:
          const lesson = { date: convertDateToString(date), startTime: time, endTime: endTime }
          this.dialogService.openLessonDialog(DialogMode.Add, lesson, true)
          break;
      }
    });

  }

  public isCellDisabled(time: string, dayName: string): boolean {
    const originalDate = this.getDateByDayName(dayName);
    if (!originalDate) {
      return false;
    }
    const cellStartDate = new Date(originalDate);
    cellStartDate.setHours(0, 0, 0, 0);

    const cellStart = new Date(cellStartDate);
    cellStart.setMinutes(convertTimeToMinutes(time));
    const cellEnd = new Date(cellStart.getTime());
    cellEnd.setMinutes(cellStart.getMinutes() + 59);

    return this.lessons.some(lesson => {
      const lessonDate = new Date(convertStringToDate(lesson.date));
      const lessonStart = new Date(lessonDate);
      lessonStart.setMinutes(convertTimeToMinutes(lesson.startTime));
      const lessonEnd = new Date(lessonDate);
      lessonEnd.setMinutes(convertTimeToMinutes(lesson.endTime));

      const result = (lessonStart >= cellStart && lessonStart <= cellEnd) ||
        (lessonEnd > cellStart && lessonEnd <= cellEnd) ||
        (lessonStart <= cellStart && lessonEnd >= cellEnd);
      return result;
    });
  }

  public showTodayMessage(): boolean {
    if (this.isOneDayFormat && this.dateIsToday(this.currentDate)) {
      return true;
    }
    return false;
  }

  public showWeekMessage(): boolean {
    if (!this.isOneDayFormat && this.dateIsToday(this.currentDate)) {
      return true;
    }
    return false;
  }

  public dateIsToday(date: Date): boolean {
    return isDatesEquals(date, this.today);
  }

  public getTimeDifference(time1: string, time2: string): number {
    let minutes1 = convertTimeToMinutes(time1);
    let minutes2 = convertTimeToMinutes(time2);
    let difference = minutes1 - minutes2
    if (difference < 0) {
      return -difference;
    }
    return difference;
  }

  public getRealTimeDifference(lesson: Lesson): number {
    if (lesson.hasRealEndTime && lesson.realEndTime) {
      const start = convertTimeToMinutes(lesson.startTime);
      const end = convertTimeToMinutes(lesson.realEndTime);
      if (start > end && end + HOURS_IN_DAY * MINUTES_IN_HOUR <= start + MAX_LESSON_DURATION * MINUTES_IN_HOUR) {
        return end + HOURS_IN_DAY * MINUTES_IN_HOUR - start;
      }
    }
    return this.getTimeDifference(lesson.startTime, lesson.endTime);
  }

  public sortLessonsByStartTime(ascending: boolean = true): void {
    this.oneDayLessons.sort((a, b) => {
      const timeA = convertTimeToMinutes(a.startTime);
      const timeB = convertTimeToMinutes(b.startTime);

      return ascending ? timeA - timeB : timeB - timeA;
    });
  }

  public getBreakTime(index: number) {
    let prevTime = this.oneDayLessons[index].endTime
    let nextTime = this.oneDayLessons[index + 1].startTime
    return this.getTimeDifference(prevTime, nextTime);
  }

  public notDefaultTime(lesson: Lesson): boolean {
    let time = this.getTimeDifference(lesson.startTime, lesson.endTime);
    if (time !== 60) {
      return true;
    }
    return false;
  }

  public printTable(): void {
    const printContent = document.getElementById('schedule-table')?.outerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent || '';
    window.print();
    document.body.innerHTML = originalContent;

    window.location.reload();
  }

  public getAppColor(appName: string | undefined): string {
    if (appName) {
      switch (appName) {
        case 'WhatsApp':
          return 'rgb(141, 255, 147)';
        case 'Telegram':
          return 'rgb(141, 238, 255)';
        case 'Zoom':
          return 'rgb(24, 143, 154)';
        case 'Profi':
          return 'rgb(255, 165, 171)';
        case 'Teams':
          return 'rgb(207, 144, 255)';
      }
    }
    return 'rgb(255,255,255)'
  }

  public getCurrentDateInString(): string {
    return convertDateToString(this.currentDate);
  }

  public addScheduleObject(): void {
    let options = SCHEDULE_OBJECT_OPTIONS;
    const dialogRef = this.dialogService.openChoiceDialog(options);

    dialogRef.afterClosed().subscribe((option) => {
      switch (option) {
        case ScheduleObject.Slot:
          this.dialogService.openSlotDialog(DialogMode.Add, null);
          break;
        case ScheduleObject.Lesson:
          this.dialogService.openLessonDialog(DialogMode.Add, null);
          break;
      }
    });
  }

  public async exportTables(): Promise<void> {
    const rangeWeeks = 2;
    this.resetCurrentDate();
    this.updateCurrentDate(this.currentWeekDates[0]);
    const dayInWeek = 7;
    for (let i = 0; i < dayInWeek * rangeWeeks; i++) {
      this.goToPrev();
    }
    const dayCount = (rangeWeeks * 2 + 1) * dayInWeek;
    const workbook = XLSX.utils.book_new();

    try {
      console.log(`Начинаем экспорт`);

      for (let i = 0; i < dayCount; i++) {
        const tableElement = document.getElementById('schedule-table');
        if (!tableElement) {
          console.error('Таблица не найдена');
          continue;
        }

        const worksheet = XLSX.utils.table_to_sheet(tableElement);
        const sheetName = `${convertDateToString(this.currentDate)}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        this.goToNext();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      this.resetCurrentDate();
      const fileName = `Расписание ${convertDateToString(this.currentDate)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      console.log('Экспорт завершен успешно!');

    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      this.resetCurrentDate();
    }
  }

  public getFromIcon(lesson: Lesson): string | null {
    const options = FROM_OPTIONS;
    const student = this.getStudentByLesson(lesson);
    if (student) {
      for (let option of options) {
        if (student.from == option.value) {
          return option.icon;
        }
      }
    }
    return null;
  }
}
