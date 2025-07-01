import { Component, inject, OnInit } from '@angular/core';
import { NavigationComponent } from "../navigation/navigation.component";
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, DocumentData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { AddStudentDialogComponent } from '../add-student-dialog/add-student-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LayoutService } from '../../services/layout.service';

interface Student {
  id: string;
  name: string;
  phone: string;
  subject: string;
  communication: string;
  platform: string;
  cost: number;
  isActual: boolean;
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule,
    NavigationComponent,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {
  private firestore = inject(Firestore);
  private dialog = inject(MatDialog);

  students: Student[] = []
  actualStudents: Student[] = []
  completedStudents: Student[] = []
  isActual = true;

  async setActual(isActual: boolean) {
    this.isActual = isActual;
    if (this.isActual) {
      this.students = this.actualStudents;
    } else {
      this.students = this.completedStudents;
    }
  }

  async ngOnInit(): Promise<void> {
    await this.loadStudents();
  }
  marginLeft = '25%';

  constructor(private layoutService: LayoutService) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.marginLeft = isHide ? '7%' : '25%'
    })
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AddStudentDialogComponent, {
      width: '1200px',
      disableClose: true
    });
  }

  openStudentProfile(studentId: string) {
    console.log(`Переход к студенту ${studentId}`)
  }

  async loadStudents() {
    try {
      // Получаем ссылку на коллекцию 'students'
      const studentsRef = collection(this.firestore, 'students');

      // Получаем снимок коллекции
      const querySnapshot = await getDocs(studentsRef);

      // Выводим все документы в консоль
      querySnapshot.forEach((doc) => {
        const student = doc.data()
        if (student['isActual']) {
          this.actualStudents.push({
            id: doc.id,
            name: student['name'],
            phone: student['phone'],
            subject: student['subject'],
            communication: student['communication'],
            platform: student['platform'],
            cost: student['cost'],
            isActual: student['isActual']
          });
        } else {
          this.completedStudents.push({
            id: doc.id,
            name: student['name'],
            phone: student['phone'],
            subject: student['subject'],
            communication: student['communication'],
            platform: student['platform'],
            cost: student['cost'],
            isActual: student['isActual']
          });
        }

      });
      this.students = this.actualStudents;
      console.log(`Все студенты успешно загружены: ${this.actualStudents.length + this.completedStudents.length} студентов`);
    } catch (error) {
      console.error('Ошибка при получении студентов:', error);
    }
  }
}