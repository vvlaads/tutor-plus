import { Component, inject, OnInit } from '@angular/core';
import { NavigationComponent } from "../../components/navigation/navigation.component";
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
export class StudentsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private studentService = inject(StudentService);

  students: any[] = [];
  isLoading = true;
  marginLeft = '25%';
  isActive = true;

  constructor(private layoutService: LayoutService, private router: Router) {
    this.layoutService.isHide$.subscribe(isHide => {
      this.marginLeft = isHide ? '7%' : '25%';
    });
  }

  async ngOnInit() {
    this.studentService.students$.subscribe(students => {
      this.students = this.isActive
        ? students.filter(s => s.isActive)
        : students.filter(s => !s.isActive);
      this.isLoading = false;
    });
    await this.studentService.loadStudents();
  }

  setActual(isActive: boolean) {
    this.isActive = isActive;
    this.studentService.students$.subscribe(students => {
      this.students = this.isActive
        ? students.filter(s => s.isActive)
        : students.filter(s => !s.isActive);
    });
  }

  addStudent() {
    const dialogRef = this.dialog.open(StudentDialogComponent, {
      width: '1200px',
      disableClose: true,
      data: {
        mode: DialogMode.Add,
        student: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.studentService.loadStudents();
      }
    });
  }

  openStudentProfile(studentId: string) {
    this.router.navigate(['/student', studentId]);
  }

  handleSearch(query: string) {
    query = query.toLowerCase();
    query = query.replace('+', '');
    this.studentService.students$.subscribe(students => {
      this.students = students.filter(s => s.name.toLowerCase().match(query) || s.phone.match(query));
    })
  }
}