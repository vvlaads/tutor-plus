import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { MatDialog } from '@angular/material/dialog';
import { LayoutService } from '../../services/layout.service';
import { StudentDialogComponent } from '../../components/student-dialog/student-dialog.component';
import { DialogMode } from '../../app.enums';
import { Lesson } from '../../app.interfaces';
import { LessonService } from '../../services/lesson.service';
import { LessonSliderComponent } from '../../components/lesson-slider/lesson-slider.component';

@Component({
  selector: 'app-student-profile',
  imports: [CommonModule, LessonSliderComponent],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit {
  student: any = null;
  private dialog = inject(MatDialog);
  private firestore = inject(Firestore);
  marginLeft = '25%';

  studentLessons: Lesson[] = []

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
      this.studentLessons = await this.lessonService.getLessonsByStudent(studentId);
    }
  }

  async loadStudent(studentId: string) {
    this.student = await this.studentService.getStudentById(studentId);
  }

  goBack() {
    window.history.back();
  }
  updateStudent(studentId: string): void {
    this.openDialog();
  }
  deleteStudent(studentId: string): void {
    const confirmDelete = confirm('Вы уверены, что хотите удалить этого студента?');

    if (confirmDelete) {
      this.studentService.deleteStudent(studentId);
      this.goBack();
    }
  }

  openDialog(): void {
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
}
