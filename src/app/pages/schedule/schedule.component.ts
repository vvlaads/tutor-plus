import { Component, inject } from '@angular/core';
import { NavigationComponent } from "../../components/navigation/navigation.component";
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { FindDateDialogComponent } from '../../components/find-date-dialog/find-date-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DateService } from '../../services/date.service';
import { LessonDialogComponent } from '../../components/lesson-dialog/lesson-dialog.component';
import { DialogMode } from '../../app.enums';
import { LessonService } from '../../services/lesson.service';
import { Lesson } from '../../app.interfaces';
import { take } from 'rxjs';

function formatDateToDDMMYYYY(date: Date): string {
  // Получаем день, месяц и год
  const day = date.getDate();
  const month = date.getMonth() + 1; // Месяцы начинаются с 0
  const year = date.getFullYear();

  // Добавляем ведущий ноль для дней и месяцев < 10
  const formattedDay = day < 10 ? `0${day}` : day;
  const formattedMonth = month < 10 ? `0${month}` : month;

  // Собираем строку в формате dd.mm.yyyy
  return `${formattedDay}.${formattedMonth}.${year}`;
}

function formatDDMMYYYYtoDate(formattedDate: string): Date {
  // Разбиваем строку на части
  const parts = formattedDate.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected dd.mm.yyyy');
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Месяцы в Date начинаются с 0
  const year = parseInt(parts[2], 10);

  // Проверяем валидность чисел
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error('Invalid date values');
  }

  // Создаем объект Date (время будет установлено в 00:00:00)
  const date = new Date(year, month, day);

  // Проверяем, что дата корректна (например, 32.01.2020 будет автоматически исправлена)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    throw new Error('Invalid date');
  }

  return date;
}

@Component({
  standalone: true,
  selector: 'app-schedule',
  imports: [NavigationComponent, CommonModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css'
})
export class ScheduleComponent {
  today: Date = new Date();
  currentDay = new Date();
  lessons: Lesson[] = []
  monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"]
  week = [this.today, this.today, this.today, this.today, this.today, this.today, this.today];
  days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  times = Array.from({ length: 24 }, (_, i) => i < 10 ? `0${i}:00` : `${i}:00`);
  isShort = false;
  private dialog = inject(MatDialog);
  marginLeft = '25%';

  constructor(private layoutService: LayoutService, private dateService: DateService, private lessonService: LessonService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.marginLeft = isHide ? '7%' : '25%'
    })
  }
  ngOnInit() {
    this.getWeekByDay(this.today);
    this.subscribeToLessons();
  }

  private subscribeToLessons(): void {
    this.lessonService.lessons$.subscribe(lessons => {
      this.updateLessons(lessons);
    });
  }

  private updateLessons(lessons: Lesson[]): void {
    this.lessons = lessons.filter(lesson => {
      try {
        const lessonDate = formatDDMMYYYYtoDate(lesson.date);
        return this.week.some(date => this.dateService.isDatesEquals(date, lessonDate));
      } catch (e) {
        console.error('Error parsing date:', e);
        return false;
      }
    });
  }

  getDateByDay(day: string): Date | null {
    if (this.days.includes(day)) {
      for (var i = 0; i < this.days.length; i++) {
        if (this.days[i] === day) {
          return this.week[i];
        }
      }
    }
    return null
  }

  getWeekByDay(currentDate: Date) {
    const monday = new Date(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0-воскресенье, 1-понедельник...6-суббота
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Коррекция для воскресенья
    monday.setDate(currentDate.getDate() - diff);

    // Создаем массив из 7 дней (пн-вс)
    this.week = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }

  setShortFormat(isShort: boolean) {
    this.isShort = isShort;
  }

  goToPrev() {
    const newDate = new Date(this.currentDay);
    if (this.isShort) {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    this.updateCurrentDate(newDate);
    console.log(this.lessons)
  }

  goToNext() {
    const newDate = new Date(this.currentDay);
    if (this.isShort) {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    this.updateCurrentDate(newDate);
    console.log(this.lessons)
  }

  private updateCurrentDate(newDate: Date): void {
    this.currentDay = newDate;
    this.getWeekByDay(newDate);
    // Принудительно обновляем уроки
    this.lessonService.lessons$.pipe(take(1)).subscribe(lessons => {
      this.updateLessons(lessons);
    });
  }

  findDate() {
    const dialogRef = this.dialog.open(FindDateDialogComponent, {
      width: '1200px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateDate();
      }
    });
  }

  updateDate() {
    const date = this.parseDate(this.dateService.currentDate);
    this.updateCurrentDate(date);
  }

  parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day); // Месяцы в JS: 0-11
    return date;
  }

  resetDate() {
    this.currentDay = new Date();
    this.getWeekByDay(this.currentDay);
  }
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }
  addLesson() {
    const dialogRef = this.dialog.open(LessonDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Add,
        lesson: null
      }
    });
  }

  plusOne(time: string): string {
    for (var i = 0; i < this.times.length - 1; i++) {
      if (this.times[i] === time) {
        return this.times[i + 1];
      }
    }
    return time;
  }


  cellIsClicked(time: string, day: string) {
    const date = this.getDateByDay(day)
    if (!date) { return }
    var endTime = this.plusOne(time);
    const lesson = { date: formatDateToDDMMYYYY(date), startTime: time, endTime: endTime }
    console.log("Click", lesson);
    const dialogRef = this.dialog.open(LessonDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Add,
        lesson: lesson
      }
    });
  }
}
