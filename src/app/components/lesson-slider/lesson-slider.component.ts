import { Component, inject, Input, OnInit } from '@angular/core';
import { Lesson } from '../../app.interfaces';
import { CommonModule } from '@angular/common';
import { DialogMode } from '../../app.enums';
import { LessonService } from '../../services/lesson.service';
import { DialogService } from '../../services/dialog.service';
import { convertStringToDate } from '../../functions/dates';
import { DeviceService } from '../../services/device.service';
import { DESKTOP_VISIBLE_LESSONS_COUNT, MOBILE_VISIBLE_LESSONS_COUNT } from '../../app.constants';

@Component({
  selector: 'app-lesson-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-slider.component.html',
  styleUrls: ['./lesson-slider.component.css']
})
export class LessonSliderComponent implements OnInit {
  private currentPosition = 0;
  private lessons: Lesson[] = [];
  private prevLessons: Map<string, Lesson> = new Map();
  private lessonService = inject(LessonService);
  private dialogService = inject(DialogService);
  private deviceService = inject(DeviceService);
  public deviceType$ = this.deviceService.deviceType$;
  public visibleLessonsCount = 0;

  @Input()
  public studentId: string = '';
  public visibleLessons: Lesson[] = [];

  public async ngOnInit(): Promise<void> {
    await this.subscribeToLessons();
    this.deviceType$.subscribe(deviceType => {
      switch (deviceType) {
        case 'mobile':
          this.visibleLessonsCount = MOBILE_VISIBLE_LESSONS_COUNT;
          break;
        case 'desktop':
          this.visibleLessonsCount = DESKTOP_VISIBLE_LESSONS_COUNT;
          break;
        default:
          this.visibleLessonsCount = DESKTOP_VISIBLE_LESSONS_COUNT;
      }
    })
    this.findStartPos();
  }

  private async subscribeToLessons(): Promise<void> {
    this.lessonService.lessons$.subscribe(async () => {
      this.lessons = await this.lessonService.getLessonsByStudentId(this.studentId);
      this.lessons = this.sortLessonsByDate();
      this.updateVisibleLessons();
    });

    this.lessonService.prevLessons$.subscribe(prevLessons => this.prevLessons = prevLessons);
  }

  private findStartPos(): void {
    const prevLesson = this.prevLessons.get(this.studentId);
    if (prevLesson) {
      for (let i = 0; i <= this.lessons.length - this.visibleLessonsCount; i++) {
        this.currentPosition = i;
        if (this.lessons[i].id === prevLesson.id) {
          break;
        }
      }
    }
    this.updateVisibleLessons();
  }

  public slideLeft(): void {
    if (this.canSlideLeft()) {
      this.currentPosition--;
      this.updateVisibleLessons();
    }
  }

  public slideRight(): void {
    if (this.canSlideRight()) {
      this.currentPosition++;
      this.updateVisibleLessons();
    }
  }

  public canSlideLeft(): boolean {
    return this.currentPosition > 0;
  }

  public canSlideRight(): boolean {
    return this.currentPosition < this.lessons.length - this.visibleLessonsCount;
  }

  private updateVisibleLessons(): void {
    this.visibleLessons = this.lessons.slice(
      this.currentPosition,
      this.currentPosition + this.visibleLessonsCount
    );
  }

  public openLessonDialog(lesson: Lesson): void {
    const dialogRef = this.dialogService.openLessonDialog(DialogMode.Edit, lesson);
  }

  private sortLessonsByDate(): Lesson[] {
    return this.lessons.sort((a, b) => {
      return convertStringToDate(a.date).getTime() - convertStringToDate(b.date).getTime();
    });
  }
}