import { Component, inject } from '@angular/core';
import { NavigationComponent } from "../navigation/navigation.component";
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { FindDateDialogComponent } from '../find-date-dialog/find-date-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DateService } from '../../services/date.service';

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
  monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"]
  week = [this.today, this.today, this.today, this.today, this.today, this.today, this.today];
  days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  times = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  isShort = false;
  private dialog = inject(MatDialog);
  events = [
  ];

  marginLeft = '25%';

  constructor(private layoutService: LayoutService, private dateService: DateService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.marginLeft = isHide ? '7%' : '25%'
    })
  }
  ngOnInit() {
    this.getWeekByDay(this.today);
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
    if (this.isShort) {
      this.currentDay.setDate(this.currentDay.getDate() - 1)
    } else {
      this.week.forEach((date) => {
        date.setDate(date.getDate() - 7);
      })
      this.currentDay.setDate(this.currentDay.getDate() - 7)
    }
  }

  goToNext() {
    if (this.isShort) {
      this.currentDay.setDate(this.currentDay.getDate() + 1)
    } else {
      this.week.forEach((date) => {
        date.setDate(date.getDate() + 7);
      })
      this.currentDay.setDate(this.currentDay.getDate() + 7)
    }
  }
  findDate() {
    const dialogRef = this.dialog.open(FindDateDialogComponent, {
      width: '1200px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => this.updateDate())
  }
  updateDate() {
    const date = this.parseDate(this.dateService.currentDate);
    console.log(date);
    this.currentDay = date;
    this.getWeekByDay(this.currentDay);
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
}
