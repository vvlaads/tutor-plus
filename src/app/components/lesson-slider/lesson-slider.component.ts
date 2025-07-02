import { Component, inject, Input, OnInit } from '@angular/core';
import { Lesson } from '../../app.interfaces';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LessonDialogComponent } from '../lesson-dialog/lesson-dialog.component';
import { DialogMode } from '../../app.enums';

@Component({
  selector: 'app-lesson-slider',
  imports: [CommonModule],
  templateUrl: './lesson-slider.component.html',
  styleUrl: './lesson-slider.component.css'
})
export class LessonSliderComponent implements OnInit {
  @Input()
  lessons: Lesson[] = []

  visibleLessons: Lesson[] = []
  leftPos: number = 0;
  rightPos: number = 0;

  private dialog = inject(MatDialog);

  ngOnInit() {
    this.lessons = this.sortLessonsByDate();
    this.visibleLessons = this.lessons.slice(-3);
    console.log(this.lessons)
    console.log(this.visibleLessons)
    this.rightPos = this.lessons.length;
    if (this.lessons.length > 3) {
      this.leftPos = this.rightPos - 3;
    }
  }

  slideLeft() {
    if (this.lessons.length > 3) {
      if (this.leftPos > 0) {
        this.leftPos -= 1;
        this.rightPos -= 1;
        this.visibleLessons = this.lessons.slice(this.leftPos, this.rightPos);
      }
    }
  }
  slideRight() {
    if (this.lessons.length > 3) {
      if (this.rightPos < this.lessons.length) {
        this.leftPos += 1;
        this.rightPos += 1;
        this.visibleLessons = this.lessons.slice(this.leftPos, this.rightPos);
      }
    }
  }

  changeLesson(lesson: Lesson) {
    const dialogRef = this.dialog.open(LessonDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Edit,
        lesson: lesson
      }
    });
  }

  private sortLessonsByDate(): Lesson[] {
    return this.lessons.sort((a, b) => {
      const dateA = this.parseDateString(a.date);
      const dateB = this.parseDateString(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  private parseDateString(dateStr: string): Date {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  }
}
