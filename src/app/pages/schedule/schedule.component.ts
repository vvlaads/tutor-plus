import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { FindDateDialogComponent } from '../../components/find-date-dialog/find-date-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DateService } from '../../services/date.service';
import { LessonDialogComponent } from '../../components/lesson-dialog/lesson-dialog.component';
import { DialogMode } from '../../app.enums';
import { LessonService } from '../../services/lesson.service';
import { Lesson, Student } from '../../app.interfaces';
import { take } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { PAGE_MARGIN_LEFT_PERCENTAGE, PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN } from '../../app.constants';

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
  public oneDayLessons: Lesson[] = []
  private students: Map<string, Student> = new Map<string, Student>()
  private colors: Map<string, string[]> = new Map<string, string[]>()

  public constructor(
    private layoutService: LayoutService,
    private dateService: DateService,
    private lessonService: LessonService,
    private studentService: StudentService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.pageMarginLeftPercentage = isHide ? PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN : PAGE_MARGIN_LEFT_PERCENTAGE
    })
  }

  public ngOnInit(): void {
    this.updateCurrentWeek();
    this.subscribeToLessons();
    this.subscribeToStudents();
    this.generateColors();
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
    this.lessonService.lessons$.subscribe(lessons => {
      this.updateLessons(lessons);
    });
  }

  private updateLessons(lessons: Lesson[]): void {
    this.oneDayLessons = lessons.filter(lesson => {
      try {
        const lessonDate = this.dateService.stringToDate(lesson.date);
        return this.dateService.isDatesEquals(this.currentDate, lessonDate)
      } catch (e) {
        console.error('Ошибка преобразования:', e);
        return false;
      }
    });

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
    this.studentService.students$.subscribe(students => {
      students.forEach(student => {
        this.updateStudents(student);
      })
    })
  }

  private updateStudents(student: Student) {
    this.students.set(student.id, student);
    this.checkStudent(student.id);
  }

  private checkStudent(id: string) {
    const student = this.students.get(id)
    if (student) {
      if (!student.isActive) {
        this.students.delete(id);
        for (let [color, studentIds] of this.colors) {
          if (studentIds.includes(id)) {
            studentIds = studentIds.filter(studentId => studentId !== id);
            console.log(`Убран ученик ${id}`)
            console.log(this.colors)
          }
        }
      }
    }
  }

  private generateColors(seed: number = 115, count: number = 80): void {
    const colorsArray: string[] = [];

    const random = this.seededRandom(seed);

    for (let i = 0; i < count; i++) {
      const hue = Math.floor((360 / count) * i);
      const saturation = 60 + Math.floor(random() * 15);
      const lightness = 70 + Math.floor(random() * 15);
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      colorsArray.push(color);
    }

    this.shuffleArray(colorsArray, random);

    this.colors = new Map();
    for (let color of colorsArray) {
      this.colors.set(color, []);
    }
  }

  private shuffleArray<T>(array: T[], random: () => number): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private seededRandom(seed: number): () => number {
    return function () {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }

  private updateCurrentDate(newDate: Date): void {
    this.currentDate = newDate;
    this.updateCurrentWeek();
    //?
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
    this.updateCurrentDate(new Date());
  }

  private getNextTime(time: string): string {
    let timeInMinutes = this.dateService.stringToMinutes(time)
    timeInMinutes += 60;
    return this.dateService.minutesToString(timeInMinutes);
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

  public getColorByLesson(lesson: Lesson): string {
    for (const [color, studentIds] of this.colors) {
      if (studentIds.includes(lesson.studentId)) {
        return color;
      }
    }
    for (const [color, studentIds] of this.colors) {
      if (studentIds.length == 0) {
        studentIds.push(lesson.studentId);
        return color;
      }
    }

    let minLength = 100
    let savedColor = '#000000'
    for (const [color, studentIds] of this.colors) {
      if (studentIds.length < minLength) {
        minLength = studentIds.length;
        savedColor = color;
      }
    }
    return savedColor;
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

  public addLesson() {
    this.openLessonDialog(DialogMode.Add, null);
  }

  public editLesson(lesson: Lesson) {
    this.openLessonDialog(DialogMode.Edit, lesson);
  }

  public cellIsClicked(time: string, dayName: string) {
    if (this.isCellDisabled(time, dayName)) {
      return;
    }

    const date = this.getDateByDayName(dayName)
    if (!date) {
      return;
    }

    var endTime = this.getNextTime(time);
    const lesson = { date: this.dateService.dateToString(date), startTime: time, endTime: endTime }
    this.openLessonDialog(DialogMode.Add, lesson)
  }

  public isCellDisabled(time: string, dayName: string): boolean {
    let cellStart = this.getDateByDayName(dayName);
    if (!cellStart) {
      return false;
    }

    cellStart = this.dateService.setTimeToDate(new Date(cellStart), time);
    cellStart.setSeconds(0)

    const cellEnd = new Date(cellStart.getTime());
    cellEnd.setMinutes(cellEnd.getMinutes() + 59);
    cellEnd.setSeconds(0)

    for (const lesson of this.lessons) {
      const lessonStart = this.dateService.setTimeToDate(
        new Date(this.dateService.stringToDate(lesson.date)),
        lesson.startTime
      );
      const lessonEnd = this.dateService.setTimeToDate(
        new Date(this.dateService.stringToDate(lesson.date)),
        lesson.endTime
      );

      const isOverlap = lessonStart < cellEnd && lessonEnd > cellStart;

      if (isOverlap) {
        return true;
      }
    }
    return false;
  }

  public showTodayMessage(): boolean {
    if (this.isOneDayFormat && this.dateService.dateIsToday(this.currentDate)) {
      return true;
    }
    return false;
  }

  public showWeekMessage(): boolean {
    if (!this.isOneDayFormat && this.dateService.dateIsToday(this.currentDate)) {
      return true;
    }
    return false;
  }

  public dateIsToday(date: Date): boolean {
    return this.dateService.dateIsToday(date);
  }
}
