import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LayoutService } from '../../services/layout.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { DialogMode } from '../../app.enums';
import { SearchComponent } from '../../components/search/search.component';
import { Lesson, Student } from '../../app.interfaces';
import { PAGE_MARGIN_LEFT_PERCENTAGE } from '../../app.constants';
import { take, Subscription } from 'rxjs';
import { LessonService } from '../../services/lesson.service';
import { formatPhoneNumber } from '../../app.functions';
import { DialogService } from '../../services/dialog.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    SearchComponent
  ],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit, OnDestroy {
  private studentService = inject(StudentService);
  private lessonService = inject(LessonService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private dialogService = inject(DialogService);
  private deviceService = inject(DeviceService);
  private studentsSubscription!: Subscription;
  private layoutSubscription!: Subscription;
  private prevLessonsSubscription!: Subscription;
  private nextLessonsSubscription!: Subscription;

  public deviceType$ = this.deviceService.deviceType$;

  public students: Student[] = [];
  public filteredStudents: Student[] = [];
  public pageMarginLeftPercentage: number = PAGE_MARGIN_LEFT_PERCENTAGE;
  public isActiveFormat = true;
  public isLoading = false;
  public searchQuery = '';
  public formatPhoneNumber = formatPhoneNumber;
  public isPrevLessonsLoading = true;
  public isNextLessonsLoading = true;
  public prevLessons$ = this.lessonService.prevLessons$;
  public nextLessons$ = this.lessonService.nextLessons$;
  public unpaidLessonsCount: Map<string, number> = new Map();

  public ngOnInit(): void {
    this.subscribeToLayoutChanges();
    this.subscribeToStudents();
    this.subscribeToLessons();
  }

  public ngOnDestroy(): void {
    this.studentsSubscription?.unsubscribe();
    this.layoutSubscription?.unsubscribe();
    this.prevLessonsSubscription?.unsubscribe();
    this.nextLessonsSubscription?.unsubscribe();

  }

  private subscribeToLessons(): void {
    this.prevLessonsSubscription = this.prevLessons$.subscribe({
      next: () => this.isPrevLessonsLoading = false,
      error: () => this.isPrevLessonsLoading = false
    });

    this.nextLessonsSubscription = this.nextLessons$.subscribe({
      next: () => this.isNextLessonsLoading = false,
      error: () => this.isNextLessonsLoading = false
    });
  }

  public getPrevLessonDate(lesson: Lesson | null | undefined): string {
    if (!lesson) return 'Отсутствует';
    try {
      return lesson.date ? lesson.date : 'Дата не указана';
    } catch {
      return 'Неверный формат даты';
    }
  }

  public getNextLessonDate(lesson: Lesson | null | undefined): string {
    if (!lesson) return 'Не назначено';
    try {
      return lesson.date ? lesson.date : 'Дата не указана';
    } catch {
      return 'Неверный формат даты';
    }
  }

  private subscribeToLayoutChanges(): void {
    this.layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => {
      this.pageMarginLeftPercentage = pageMarginLeftPercentage;
    })
  }

  private subscribeToStudents(): void {
    this.isLoading = true;

    this.studentService.loadStudents();

    this.studentsSubscription = this.studentService.students$.subscribe({
      next: (students) => {
        this.updateStudents(students);
        this.applySearchFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading students', err);
        this.isLoading = false;
      }
    });
  }

  private async updateStudents(students: Student[]): Promise<void> {
    this.students = this.isActiveFormat
      ? students.filter(s => s.isActive)
      : students.filter(s => !s.isActive);
    this.students.sort((a, b) => a.name.localeCompare(b.name));

    this.applySearchFilter();
    this.students.forEach(async student => {
      this.unpaidLessonsCount.set(student.id, await this.getUnpaidLessonsCount(student))
    })
  }

  public setActiveFormat(isActive: boolean): void {
    this.isActiveFormat = isActive;
    this.studentService.students$
      .pipe(take(1))
      .subscribe(students => this.updateStudents(students));
  }

  public addStudent(): void {
    this.dialogService.openStudentDialog(DialogMode.Add, null);
  }

  public openStudentProfile(studentId: string): void {
    this.router.navigate(['/student', studentId]);
  }

  public handleSearch(query: string): void {
    this.searchQuery = query.toLowerCase().replace('+', '');
    this.applySearchFilter();
  }

  private applySearchFilter(): void {
    if (!this.searchQuery) {
      this.filteredStudents = [...this.students];
      return;
    }

    this.filteredStudents = this.students.filter(s =>
    (s.name.toLowerCase().includes(this.searchQuery) ||
      (s.phone.includes(this.searchQuery))
      && (s.isActive === this.isActiveFormat)));
  }


  public async getUnpaidLessonsCount(student: Student): Promise<number> {
    const lessons = await this.lessonService.getUnpaidLessonsByStudentId(student.id);
    return lessons.length;
  }
}