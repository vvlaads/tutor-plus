import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { LessonService } from '../../services/lesson.service';
import { Lesson, Student } from '../../app.interfaces';
import { convertDateToString, convertStringToDate, convertTimeToMinutes, isDatesEquals } from '../../functions/dates';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import * as XLSX from 'xlsx';
import { DAYS_IN_WEEK, HOURS_IN_DAY, LOWER_MONTH_NAMES, MAX_LESSON_DURATION, MINUTES_IN_HOUR, MONTH_NAMES } from '../../app.constants';

@Component({
  selector: 'app-today-lessons-table',
  imports: [CommonModule],
  templateUrl: './today-lessons-table.component.html',
  styleUrl: './today-lessons-table.component.css'
})
export class TodayLessonsTableComponent implements OnInit, OnChanges {
  private lessonService = inject(LessonService);
  private studentService = inject(StudentService);
  private lessons: Lesson[] = [];
  private students: Student[] = [];

  public oneDayLessons: Lesson[] = [];

  @Input()
  public currentDate: Date = new Date();

  public ngOnInit(): void {
    this.subscribeToLessons()
    this.subscribeToStudents();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate']) {
      this.updateLessons();
    }
  }

  private async subscribeToLessons(): Promise<void> {
    this.lessonService.loadLessons();
    this.lessonService.lessons$.subscribe(lessons => {
      this.lessons = lessons;
      this.updateLessons();
    });
  }

  private async subscribeToStudents(): Promise<void> {
    this.studentService.loadStudents();
    this.studentService.students$.subscribe(students => {
      this.students = students;
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
  }

  public getStudentByLesson(lesson: Lesson): Student | null {
    for (let student of this.students) {
      if (student.id === lesson.studentId) {
        return student;
      }
    }
    return null;
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
        case 'Дома':
          return 'rgb(255, 165, 171)';
        case 'Teams':
          return 'rgb(207, 144, 255)';
      }
    }
    return 'rgb(255,255,255)'
  }

  public isToday(): boolean {
    return isDatesEquals(this.currentDate, new Date());
  }

  public getFormattedDate(date: Date): string {
    const dateName = date.getDate();
    const monthName = LOWER_MONTH_NAMES[date.getMonth()];
    return `${dateName} ${monthName}`;
  }

  public print(): void {
    const printContent = document.getElementById('schedule-table')?.outerHTML;
    document.body.innerHTML = printContent || '';
    window.print();
    window.location.reload();
  }

  private goPrev(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 1);
    this.currentDate = newDate;
    this.updateLessons();
  }

  private goNext(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 1);
    this.currentDate = newDate;
    this.updateLessons();
  }

  private resetCurrentDate() {
    this.currentDate = new Date();
  }

  public async export(): Promise<void> {
    this.resetCurrentDate();
    const monday = new Date(this.currentDate);
    const dayOfWeek = this.currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(this.currentDate.getDate() - diff);
    this.currentDate = new Date(monday);

    const rangeWeeks = 2;

    for (let i = 0; i < DAYS_IN_WEEK * rangeWeeks; i++) {
      this.goPrev();
    }
    const dayCount = (rangeWeeks * 2 + 1) * DAYS_IN_WEEK;
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
        this.goNext();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      this.currentDate = new Date();
      const fileName = `Расписание ${convertDateToString(this.currentDate)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      console.log('Экспорт завершен успешно!');

    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      this.currentDate = new Date();
    }
  }
}