import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LayoutService } from '../../services/layout.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { StudentDialogComponent } from '../../components/student-dialog/student-dialog.component';
import { DialogMode } from '../../app.enums';
import { SearchComponent } from '../../components/search/search.component';
import { Lesson, Student } from '../../app.interfaces';
import { PAGE_MARGIN_LEFT_PERCENTAGE, PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN } from '../../app.constants';
import { take, Subscription } from 'rxjs';
import { LessonService } from '../../services/lesson.service';
import { formatPhoneNumber } from '../../app.functions';

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
  private dialog = inject(MatDialog);
  private studentService = inject(StudentService);
  private lessonService = inject(LessonService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);

  public students: Student[] = [];
  public filteredStudents: Student[] = [];
  public pageMarginLeftPercentage: number = PAGE_MARGIN_LEFT_PERCENTAGE;
  public isActiveFormat = true;
  public isLoading = false;
  public searchQuery = '';
  public formatPhoneNumber = formatPhoneNumber;

  public isPrevLessonsLoading = true;
  public isNextLessonsLoading = true;

  private studentsSubscription!: Subscription;
  private layoutSubscription!: Subscription;

  public prevLessons$ = this.lessonService.prevLessons$;
  public nextLessons$ = this.lessonService.nextLessons$;

  private prevLessonsSubscription!: Subscription;
  private nextLessonsSubscription!: Subscription;

  ngOnInit(): void {
    this.subscribeToLayoutChanges();
    this.subscribeToStudents();
    this.subscribeToLessons();
  }

  ngOnDestroy(): void {
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
    this.layoutSubscription = this.layoutService.isHide$
      .subscribe(isHide => {
        this.pageMarginLeftPercentage = isHide
          ? PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN
          : PAGE_MARGIN_LEFT_PERCENTAGE;
      });
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

    this.applySearchFilter();
  }

  public setActiveFormat(isActive: boolean): void {
    this.isActiveFormat = isActive;
    this.studentService.students$
      .pipe(take(1))
      .subscribe(students => this.updateStudents(students));
  }

  public addStudent(): void {
    const dialogRef = this.dialog.open(StudentDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Add,
        student: null
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.studentService.students$
        .pipe(take(1))
        .subscribe(students => this.updateStudents(students));
    });
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
}