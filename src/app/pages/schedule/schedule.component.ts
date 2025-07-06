import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { FindDateDialogComponent } from '../../components/find-date-dialog/find-date-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DateService } from '../../services/date.service';
import { LessonDialogComponent } from '../../components/lesson-dialog/lesson-dialog.component';
import { DialogMode, ScheduleObject } from '../../app.enums';
import { LessonService } from '../../services/lesson.service';
import { Lesson, SelectOption, Slot, Student } from '../../app.interfaces';
import { take } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { PAGE_MARGIN_LEFT_PERCENTAGE, PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN, SCHEDULE_OBJECT_OPTIONS } from '../../app.constants';
import { SlotService } from '../../services/slot.service';
import { SlotDialogComponent } from '../../components/slot-dialog/slot-dialog.component';
import { ChoiceDialogComponent } from '../../components/choice-dialog/choice-dialog.component';
import * as XLSX from 'xlsx';

@Component({
  standalone: true,
  selector: 'app-schedule',
  imports: [CommonModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css'
})
export class ScheduleComponent implements OnInit {
  private dialog: MatDialog = inject(MatDialog);

  public currentDate: Date = new Date();
  public today: Date = new Date();

  public isOneDayFormat: boolean = false;

  public pageMarginLeftPercentage: number = PAGE_MARGIN_LEFT_PERCENTAGE;
  public blockHeightPixels: number = 50;
  public blockWidthPercentage: number = 13;
  public timeColumnWidthPercetage: number = 9;

  public monthNames: string[] = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"]
  public weekDayNames: string[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  public currentWeekDates: Date[] = [];
  public times: string[] = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00',
    '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']

  public lessons: Lesson[] = []
  public slots: Slot[] = []
  public oneDayLessons: Lesson[] = []
  private students: Map<string, Student> = new Map<string, Student>();


  public constructor(
    private layoutService: LayoutService,
    private dateService: DateService,
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

  private subscribeToLessons(): void {
    this.lessonService.loadLessons();
    this.lessonService.lessons$.subscribe(lessons => {
      this.updateLessons(lessons);
    });
  }

  private updateLessons(lessons: Lesson[]): void {
    this.oneDayLessons = lessons.filter(lesson => {
      try {
        const lessonDate = this.dateService.stringToDate(lesson.date);
        return this.dateService.isDatesEquals(this.currentDate, lessonDate);
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });

    // Сортируем уроки по времени начала (по возрастанию)
    this.sortLessonsByStartTime();

    this.lessons = lessons.filter(lesson => {
      try {
        const lessonDate = this.dateService.stringToDate(lesson.date);
        return this.currentWeekDates.some(date => this.dateService.isDatesEquals(date, lessonDate));
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });
  }

  private subscribeToStudents(): void {
    this.studentService.loadStudents();
    this.studentService.students$.subscribe(students => {
      students.forEach(student => {
        this.updateStudents(student);
      })
    })
  }


  private updateStudents(student: Student) {
    this.students.set(student.id, student);
  }

  private subscribeToSlots(): void {
    this.slotService.loadSlots();
    this.slotService.slots$.subscribe(slots => {
      this.updateSlots(slots);
    });
  }

  private updateSlots(slots: Slot[]) {
    this.slots = slots.filter(slot => {
      try {
        const slotDate = this.dateService.stringToDate(slot.date);
        return this.currentWeekDates.some(date => this.dateService.isDatesEquals(date, slotDate));
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });
  }

  private updateCurrentDate(newDate: Date): void {
    this.currentDate = new Date(newDate);
    this.updateCurrentWeek();
    this.lessonService.lessons$.pipe(take(1)).subscribe(lessons => {
      this.updateLessons(lessons);
    });
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
    const student = this.students.get(lesson.studentId);
    if (student) {
      return student;
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
    const dialogRef = this.dialog.open(FindDateDialogComponent, {
      width: '1200px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Переход к дате ${result}`)
      if (result !== undefined) {
        this.updateCurrentDate(this.dateService.stringToDate(result));
      } else {
        console.log("Дата для перехода не найдена")
      }
    });
  }

  public resetCurrentDate(): void {
    this.updateCurrentDate(this.today);
  }

  private getNextTime(time: string): string {
    let timeInMinutes = this.dateService.stringToMinutes(time)
    timeInMinutes += 60;
    let nextTime = ''
    try {
      nextTime = this.dateService.minutesToString(timeInMinutes)
    } catch (error) {
      timeInMinutes -= 5;
      nextTime = this.dateService.minutesToString(timeInMinutes)
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
    let startTime = this.dateService.stringToMinutes(lesson.startTime);
    let endTime = this.dateService.stringToMinutes(lesson.endTime);
    let hours = Math.floor(endTime / 60) - Math.floor(startTime / 60)

    return `${(endTime - startTime) * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours)}px`
  }

  public getLessonTop(lesson: Lesson): number {
    const totalMinutes = this.dateService.stringToMinutes(lesson.startTime)
    const hours = Math.floor(totalMinutes / 60);
    return totalMinutes * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours);
  }

  public getLessonLeft(lesson: Lesson): number {
    const lessonDate = this.dateService.stringToDate(lesson.date);
    for (let i = 0; i < this.currentWeekDates.length; i++) {
      if (this.dateService.isDatesEquals(lessonDate, this.currentWeekDates[i])) {
        return this.timeColumnWidthPercetage + i * this.blockWidthPercentage;
      }
    }
    return 0;
  }

  public getSlotHeight(slot: Slot): string {
    let startTime = this.dateService.stringToMinutes(slot.startTime);
    let endTime = this.dateService.stringToMinutes(slot.endTime);
    let hours = Math.floor(endTime / 60) - Math.floor(startTime / 60)

    return `${(endTime - startTime) * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours)}px`
  }

  public getSlotTop(slot: Slot): number {
    const totalMinutes = this.dateService.stringToMinutes(slot.startTime)
    const hours = Math.floor(totalMinutes / 60);
    return totalMinutes * this.blockHeightPixels / 60 + this.getConstantToFixOffset(hours);
  }

  public getSlotLeft(slot: Slot): number {
    const lessonDate = this.dateService.stringToDate(slot.date);
    for (let i = 0; i < this.currentWeekDates.length; i++) {
      if (this.dateService.isDatesEquals(lessonDate, this.currentWeekDates[i])) {
        return this.timeColumnWidthPercetage + i * this.blockWidthPercentage;
      }
    }
    return 0;
  }

  private openLessonDialog(mode: DialogMode, lesson: Partial<Lesson> | null) {
    this.dialog.open(LessonDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: mode,
        lesson: lesson
      }
    });
  }

  private openSlotDialog(mode: DialogMode, slot: Partial<Slot> | null) {
    this.dialog.open(SlotDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: mode,
        slot: slot
      }
    });
  }

  public addLesson() {
    this.openLessonDialog(DialogMode.Add, null);
  }

  public editLesson(lesson: Lesson) {
    this.openLessonDialog(DialogMode.Edit, lesson);
  }

  public editSlot(slot: Slot) {
    this.openSlotDialog(DialogMode.Edit, slot);
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
    const dialogRef = this.openChoiceDialog(options);

    dialogRef.afterClosed().subscribe((option) => {
      switch (option) {
        case ScheduleObject.Slot:
          this.openSlotDialog(DialogMode.Add, null);
          break;
        case ScheduleObject.Lesson:
          var endTime = this.getNextTime(time);
          const lesson = { date: this.dateService.dateToString(date), startTime: time, endTime: endTime }
          this.openLessonDialog(DialogMode.Add, lesson)
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

    const cellStart = new Date(this.dateService.setTimeToDate(new Date(cellStartDate), time));
    const cellEnd = new Date(cellStart.getTime());
    cellEnd.setMinutes(cellStart.getMinutes() + 59);

    return this.lessons.some(lesson => {
      const lessonDate = new Date(this.dateService.stringToDate(lesson.date));
      const lessonStart = new Date(this.dateService.setTimeToDate(new Date(lessonDate), lesson.startTime));
      const lessonEnd = new Date(this.dateService.setTimeToDate(new Date(lessonDate), lesson.endTime));

      const result = (lessonStart >= cellStart && lessonStart <= cellEnd) ||
        (lessonEnd >= cellStart && lessonEnd <= cellEnd) ||
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
    return this.dateService.isDatesEquals(date, this.today);
  }

  openChoiceDialog(options: SelectOption[]) {
    const dialogRef = this.dialog.open(ChoiceDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        options: options
      }
    });
    return dialogRef;
  }

  public getTimeDifference(time1: string, time2: string): number {
    let minutes1 = this.dateService.stringToMinutes(time1);
    let minutes2 = this.dateService.stringToMinutes(time2);
    let difference = minutes1 - minutes2
    if (difference < 0) {
      return -difference;
    }
    return difference;
  }

  public sortLessonsByStartTime(ascending: boolean = true): void {
    this.oneDayLessons.sort((a, b) => {
      const timeA = this.dateService.stringToMinutes(a.startTime);
      const timeB = this.dateService.stringToMinutes(b.startTime);

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

  getCurrentDateInString(): string {
    return this.dateService.dateToString(this.currentDate);
  }

  public addScheduleObject(): void {
    let options = SCHEDULE_OBJECT_OPTIONS;
    const dialogRef = this.openChoiceDialog(options);

    dialogRef.afterClosed().subscribe((option) => {
      switch (option) {
        case ScheduleObject.Slot:
          this.openSlotDialog(DialogMode.Add, null);
          break;
        case ScheduleObject.Lesson:
          this.openLessonDialog(DialogMode.Add, null);
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
        const sheetName = `${this.dateService.dateToString(this.currentDate)}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        this.goToNext();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      this.resetCurrentDate();
      const fileName = `Расписание ${this.dateService.dateToString(this.currentDate)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      console.log('Экспорт завершен успешно!');

    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      this.resetCurrentDate();
    }
  }
}
