import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { LayoutService } from '../../services/layout.service';
import { DialogMode } from '../../app.enums';
import { SelectOptionWithIcon, Student } from '../../app.interfaces';
import { LessonSliderComponent } from '../../components/lesson-slider/lesson-slider.component';
import { COMMUNICATION_OPTIONS, FROM_OPTIONS, PLATFORM_OPTIONS } from '../../app.constants';
import { LessonService } from '../../services/lesson.service';
import { formatPhoneNumber } from '../../app.functions';
import { DialogService } from '../../services/dialog.service';
import { StateService } from '../../services/state.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-student-profile',
  imports: [CommonModule, LessonSliderComponent],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit, OnDestroy {
  private dialogService = inject(DialogService);
  private stateService = inject(StateService);
  public student: Student | null = null;
  public pageMarginLeftPercentage: number = 0;
  public platformOptions: SelectOptionWithIcon[] = PLATFORM_OPTIONS;
  public communicationOptions: SelectOptionWithIcon[] = COMMUNICATION_OPTIONS;
  public fromOptions: SelectOptionWithIcon[] = FROM_OPTIONS;
  public prevLessonsCount: number = 0;
  public unpaidLessonsCount: number = 0;
  public prepaidLessonsCount: number = 0;
  public formatPhoneNumber = formatPhoneNumber;
  private destroy$ = new Subject<void>();

  public constructor(private route: ActivatedRoute,
    private studentService: StudentService,
    private router: Router,
    private layoutService: LayoutService,
    private lessonService: LessonService) {
    this.layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => {
      this.pageMarginLeftPercentage = pageMarginLeftPercentage;
    })
  }

  public ngOnInit(): void {
    this.lessonService.lessons$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadStudent());

    this.studentService.students$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadStudent());
    this.loadStudent();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stateService.removedAllFlags();
  }

  public async loadStudent(): Promise<void> {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (studentId) {
      this.student = await this.studentService.getStudentById(studentId);
      this.prevLessonsCount = await this.getPrevLessonsCount();
      this.unpaidLessonsCount = await this.getUnpaidLessonsCount();
      this.prepaidLessonsCount = await this.getPrepaidLessonsCount();
    }
  }

  public goBack(): void {
    if (this.stateService.savedLesson) {
      this.stateService.savedLesson = false;
      this.router.navigate(['/schedule'])
      this.dialogService.openLessonDialog(this.stateService.mode, this.stateService.lesson);
    } else if (this.stateService.savedWaitingBlock) {
      this.stateService.savedWaitingBlock = false;
      this.router.navigate(['/wait-list'])
      this.dialogService.openWaitingBlockDialog(this.stateService.mode, this.stateService.waitingBlock);
    }
    else {
      this.router.navigate(['/students'])
    }
  }

  public updateStudent(): void {
    this.dialogService.openStudentDialog(DialogMode.Edit, this.student);
  }

  public deleteStudent(studentId: string): void {
    const confirmDelete = confirm('Вы уверены, что хотите удалить этого студента?');

    if (confirmDelete) {
      this.studentService.deleteStudent(studentId);
      this.goBack();
    }
  }

  public addLesson(): void {
    this.dialogService.openLessonDialog(DialogMode.Add, { studentId: this.student?.id });
  }

  public getPlatformIcon(platformName: string): string {
    const platform = this.platformOptions.find(p => p.text === platformName);
    return platform?.icon || '';
  }

  public getCommunicationIcon(communicationName: string): string {
    const communication = this.communicationOptions.find(c => c.text === communicationName);
    return communication?.icon || '';
  }

  public getFromIcon(fromName: string): string {
    const from = this.fromOptions.find(f => f.text === fromName);
    return from?.icon || '';
  }

  public async getPrevLessonsCount(): Promise<number> {
    if (this.student) {
      const lessons = await this.lessonService.getPrevLessonsByStudentId(this.student.id);
      return lessons.length;
    }
    return 0;
  }

  public async getUnpaidLessonsCount(): Promise<number> {
    if (this.student) {
      const lessons = await this.lessonService.getUnpaidLessonsByStudentId(this.student.id);
      return lessons.length;
    }
    return 0;
  }

  public async getPrepaidLessonsCount(): Promise<number> {
    if (this.student) {
      const lessons = await this.lessonService.getPrepaidLessonsByStudentId(this.student.id);
      return lessons.length;
    }
    return 0;
  }
}
