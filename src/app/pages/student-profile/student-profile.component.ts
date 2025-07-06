import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { MatDialog } from '@angular/material/dialog';
import { LayoutService } from '../../services/layout.service';
import { StudentDialogComponent } from '../../components/student-dialog/student-dialog.component';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOptionWithIcon, Student } from '../../app.interfaces';
import { LessonSliderComponent } from '../../components/lesson-slider/lesson-slider.component';
import { COMMUNICATION_OPTIONS, FROM_OPTIONS, PAGE_MARGIN_LEFT_PERCENTAGE, PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN, PLATFORM_OPTIONS } from '../../app.constants';
import { LessonService } from '../../services/lesson.service';
import { formatPhoneNumber } from '../../app.functions';

@Component({
  selector: 'app-student-profile',
  imports: [CommonModule, LessonSliderComponent],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit {
  public student: Student | null = null;
  private dialog = inject(MatDialog);
  public pageMarginLeftPercentage: number = PAGE_MARGIN_LEFT_PERCENTAGE;
  public platformOptions: SelectOptionWithIcon[] = PLATFORM_OPTIONS;
  public communicationOptions: SelectOptionWithIcon[] = COMMUNICATION_OPTIONS;
  public fromOptions: SelectOptionWithIcon[] = FROM_OPTIONS;
  public prevLessonsCount: number = 0;
  public unpaidLessonsCount: number = 0;
  public prepaidLessonsCount: number = 0;
  public formatPhoneNumber = formatPhoneNumber;

  constructor(private route: ActivatedRoute,
    private studentService: StudentService,
    private layoutService: LayoutService,
    private lessonService: LessonService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.pageMarginLeftPercentage = isHide ? PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN : PAGE_MARGIN_LEFT_PERCENTAGE
    })
  }

  public async ngOnInit(): Promise<void> {
    this.subscribeToLessons();
    this.subscribeToStudents();
  }

  private subscribeToLessons(): void {
    this.lessonService.lessons$.subscribe(lessons => {
      this.loadStudent();
    })
  }

  private subscribeToStudents(): void {
    this.studentService.students$.subscribe(students => {
      this.loadStudent();
    })
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
    window.history.back();
  }

  public updateStudent(): void {
    this.openDialog();
  }
  public deleteStudent(studentId: string): void {
    const confirmDelete = confirm('Вы уверены, что хотите удалить этого студента?');

    if (confirmDelete) {
      this.studentService.deleteStudent(studentId);
      this.goBack();
    }
  }

  public openDialog(): void {
    if (!this.student) return;

    const dialogRef = this.dialog.open(StudentDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Edit,
        student: this.student
      }
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadStudent();
      }
    });
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
