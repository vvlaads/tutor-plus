import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { Lesson } from '../../app.interfaces';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LessonDialogComponent } from '../lesson-dialog/lesson-dialog.component';
import { DialogMode } from '../../app.enums';
import { LessonService } from '../../services/lesson.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lesson-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-slider.component.html',
  styleUrls: ['./lesson-slider.component.css']
})
export class LessonSliderComponent implements OnInit, OnDestroy {
  @Input() studentId: string = '';
  private lessonsSub!: Subscription;

  lessons: Lesson[] = [];
  visibleLessons: Lesson[] = [];
  currentPosition = 0;
  readonly VISIBLE_LESSONS_COUNT = 3;

  private dialog = inject(MatDialog);
  private lessonService = inject(LessonService);

  ngOnInit(): void {
    this.loadLessons();
    this.setupLessonsListener();
  }

  ngOnDestroy(): void {
    this.lessonsSub?.unsubscribe();
  }

  private setupLessonsListener(): void {
    this.lessonsSub = this.lessonService.lessons$.subscribe(lessons => {
      this.lessons = this.sortLessonsByDate(lessons.filter(l => l.studentId === this.studentId));
      this.updateVisibleLessons();
    });
  }

  private async loadLessons(): Promise<void> {
    try {
      this.lessons = this.sortLessonsByDate(
        await this.lessonService.getLessonsByStudentId(this.studentId)
      );
      this.updateVisibleLessons();
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
    this.lessonService.loadLessons();
  }

  slideLeft(): void {
    if (this.canSlideLeft()) {
      this.currentPosition--;
      this.updateVisibleLessons();
    }
  }

  slideRight(): void {
    if (this.canSlideRight()) {
      this.currentPosition++;
      this.updateVisibleLessons();
    }
  }

  canSlideLeft(): boolean {
    return this.currentPosition > 0;
  }

  canSlideRight(): boolean {
    return this.currentPosition < this.lessons.length - this.VISIBLE_LESSONS_COUNT;
  }

  private updateVisibleLessons(): void {
    this.visibleLessons = this.lessons.slice(
      this.currentPosition,
      this.currentPosition + this.VISIBLE_LESSONS_COUNT
    );
  }

  openLessonDialog(lesson: Lesson): void {
    const dialogRef = this.dialog.open(LessonDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Edit,
        lesson: { ...lesson }
      }
    });

    dialogRef.afterClosed().subscribe(updated => {
      this.loadLessons();
    });
  }

  addNewLesson(): void {
    const dialogRef = this.dialog.open(LessonDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Add,
        lesson: { studentId: this.studentId } as Lesson
      }
    });

    dialogRef.afterClosed().subscribe(added => {
      if (added) this.loadLessons();
    });
  }

  private sortLessonsByDate(lessons: Lesson[]): Lesson[] {
    return [...lessons].sort((a, b) => {
      return this.parseDateString(a.date).getTime() - this.parseDateString(b.date).getTime();
    });
  }

  private parseDateString(dateStr: string): Date {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  }

  trackByLessonId(index: number, lesson: Lesson): string {
    return lesson.id;
  }
}