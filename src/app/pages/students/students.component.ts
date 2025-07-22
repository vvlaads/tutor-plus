import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOption, Student } from '../../app.interfaces';
import { LessonService } from '../../services/lesson.service';
import { formatPhoneNumber } from '../../app.functions';
import { DialogService } from '../../services/dialog.service';
import { DeviceService } from '../../services/device.service';
import { SearchFilterComponent } from "../../components/search-filter/search-filter.component";

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, SearchFilterComponent],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {
  private router = inject(Router);
  private lessonService = inject(LessonService);
  private layoutService = inject(LayoutService);
  private dialogService = inject(DialogService);
  private deviceService = inject(DeviceService);
  private studentService = inject(StudentService);
  private allStudents: Student[] = [];
  private activeFormat = true;
  private searchQuery = '';
  private currentFilter: string = 'all';

  public deviceType$ = this.deviceService.deviceType$;
  public pageMarginLeftPercentage: number = 0;
  public formatPhoneNumber = formatPhoneNumber;
  public filteredStudents: Student[] = [];
  public isLoading = false;
  public isPrevLessonsLoading = true;
  public isNextLessonsLoading = true;
  public prevLessons = new Map<string, Lesson>();
  public nextLessons = new Map<string, Lesson>();
  public unpaidLessonsCount: Map<string, number> = new Map();
  public unpaidOwlLessonsCount: Map<string, number> = new Map();
  public filterOptions: SelectOption[] = [
    { value: 'all', text: 'Все' },
    { value: 'unpaid', text: 'Неоплачены' },
    { value: 'unpaidByOwl', text: 'Неоплачены по сове' },
    { value: 'noNextLessons', text: 'Нет Следующего занятия' }
  ];

  public ngOnInit(): void {
    this.subscribeToLayoutChanges();
    this.subscribeToStudents();
    this.subscribeToLessons();
    this.lessonService.loadLessons();
  }

  private subscribeToLessons(): void {
    this.lessonService.prevLessons$.subscribe(prevLessons => {
      this.prevLessons = prevLessons;
      this.isPrevLessonsLoading = false;
    });

    this.lessonService.nextLessons$.subscribe(nextLessons => {
      this.nextLessons = nextLessons;
      this.isNextLessonsLoading = false;
    });
  }

  private subscribeToLayoutChanges(): void {
    this.layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => {
      this.pageMarginLeftPercentage = pageMarginLeftPercentage;
    })
  }

  private subscribeToStudents(): void {
    this.studentService.students$.subscribe(students => {
      this.allStudents = students;
      this.applyFilters();
    })
  }

  public isActiveFormat(): boolean {
    return this.activeFormat;
  }

  public setActiveFormat(isActive: boolean): void {
    this.activeFormat = isActive;
    this.applyFilters();
  }

  public addStudent(): void {
    this.dialogService.openStudentDialog(DialogMode.Add, null);
  }

  public openStudentProfile(studentId: string): void {
    this.router.navigate(['/student', studentId]);
  }

  public handleSearch(query: string): void {
    this.searchQuery = query.toLowerCase().replace('+', '');
    this.applyFilters();
  }

  public handleFilter(value: string): void {
    this.currentFilter = value;
    this.applyFilters();
  }

  private async applyFilters(): Promise<void> {
    try {
      let filtered = this.allStudents
        .filter(s => s.isActive === this.activeFormat)
        .sort((a, b) => a.name.localeCompare(b.name));

      await this.updateCounters(filtered);

      if (this.currentFilter !== 'all') {
        filtered = this.applyCurrentFilter(filtered);
      }

      if (this.searchQuery) {
        filtered = filtered.filter(s =>
          s.name.toLowerCase().includes(this.searchQuery) ||
          (s.phone && s.phone.includes(this.searchQuery)))
      }

      this.filteredStudents = filtered;
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }

  private async updateCounters(students: Student[]): Promise<void> {
    this.unpaidLessonsCount = new Map();
    this.unpaidOwlLessonsCount = new Map();

    await Promise.all(students.map(async student => {
      const [unpaid, unpaidOwl] = await Promise.all([
        this.getUnpaidLessonsCount(student),
        this.getUnpaidOwlLessonsCount(student)
      ]);
      this.unpaidLessonsCount.set(student.id, unpaid);
      this.unpaidOwlLessonsCount.set(student.id, unpaidOwl);
    }));
  }

  private async getUnpaidLessonsCount(student: Student): Promise<number> {
    const lessons = await this.lessonService.getUnpaidLessonsByStudentId(student.id);
    return lessons.length;
  }

  private async getUnpaidOwlLessonsCount(student: Student): Promise<number> {
    const lessons = await this.lessonService.getUnpaidOwlLessonsByStudentId(student.id);
    return lessons.length;
  }

  private applyCurrentFilter(students: Student[]): Student[] {
    switch (this.currentFilter) {
      case 'unpaid':
        return students.filter(s => {
          const unpaidLessons = this.unpaidLessonsCount.get(s.id);
          return unpaidLessons && unpaidLessons > 0;
        });
      case 'unpaidByOwl':
        return students.filter(s => {
          const unpaidOwlLessons = this.unpaidOwlLessonsCount.get(s.id);
          return s.from === 'Сова' && unpaidOwlLessons && unpaidOwlLessons > 0;
        });
      case 'noNextLessons':
        return students.filter(s => !this.nextLessons.get(s.id));
      default:
        return students;
    }
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
}