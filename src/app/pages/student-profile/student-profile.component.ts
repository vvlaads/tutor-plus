import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { MatDialog } from '@angular/material/dialog';
import { LayoutService } from '../../services/layout.service';
import { StudentDialogComponent } from '../../components/student-dialog/student-dialog.component';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOptionWithIcon } from '../../app.interfaces';
import { LessonSliderComponent } from '../../components/lesson-slider/lesson-slider.component';
import { COMMUNICATION_OPTIONS, FROM_OPTIONS, PLATFORM_OPTIONS } from '../../app.constants';
import { LessonService } from '../../services/lesson.service';

@Component({
  selector: 'app-student-profile',
  imports: [CommonModule, LessonSliderComponent],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit {
  student: any = null;
  private dialog = inject(MatDialog);
  marginLeft = '25%';
  platformOptions: SelectOptionWithIcon[] = PLATFORM_OPTIONS;
  communicationOptions: SelectOptionWithIcon[] = COMMUNICATION_OPTIONS;
  fromOptions: SelectOptionWithIcon[] = FROM_OPTIONS;

  studentLessons: Lesson[] = []
  public prevLessonsCount: number = 0;
  public unpaidLessonsCount: number = 0;
  public prepaidLessonsCount: number = 0;

  constructor(private route: ActivatedRoute,
    private studentService: StudentService,
    private layoutService: LayoutService,
    private lessonService: LessonService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.marginLeft = isHide ? '7%' : '25%'
    })
  }

  async ngOnInit() {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (studentId) {
      await this.loadStudent(studentId);
    }
    this.lessonService.lessons$.subscribe(lessons => {
      this.loadStudent(this.student.id);
    })
  }

  async loadStudent(studentId: string) {
    this.student = await this.studentService.getStudentById(studentId);
    this.prevLessonsCount = await this.getPrevLessonsCount();
    this.unpaidLessonsCount = await this.getUnpaidLessonsCount();
    this.prepaidLessonsCount = await this.getPrepaidLessonsCount();
  }

  public goBack() {
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
        this.loadStudent(this.student.id);
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


  //Форматирует номер телефона в формате +7XXXXXXXXXX в читаемый вид: +7 (XXX) XXX-XX-XX
  public formatPhoneNumber(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, ''); // Удаляем все нецифровые символы

    // Проверяем соответствие формату
    if (!digitsOnly.startsWith('7') || digitsOnly.length !== 11) {
      throw new Error('Неверный формат номера. Ожидается: +7XXXXXXXXXX (11 цифр)');
    }
    // Форматируем номер
    return `+7(${digitsOnly.substring(1, 4)})${digitsOnly.substring(4, 7)}-${digitsOnly.substring(7, 9)}-${digitsOnly.substring(9)}`;
  }

  public async getPrevLessonsCount(): Promise<number> {
    const lessons = await this.lessonService.getPrevLessonsByStudentId(this.student.id);
    return lessons.length;
  }

  public async getUnpaidLessonsCount(): Promise<number> {
    const lessons = await this.lessonService.getUnpaidLessonsByStudentId(this.student.id);
    return lessons.length;
  }

  public async getPrepaidLessonsCount(): Promise<number> {
    const lessons = await this.lessonService.getPrepaidLessonsByStudentId(this.student.id);
    return lessons.length;
  }

}
