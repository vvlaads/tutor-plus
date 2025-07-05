import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomSelectComponent } from '../custom-select/custom-select.component';
import { StudentService } from '../../services/student.service';
import { DialogMode } from '../../app.enums';
import { SelectOptionWithIcon, Student } from '../../app.interfaces';
import { COMMUNICATION_OPTIONS, FROM_OPTIONS, PLATFORM_OPTIONS, STATUS_OPTIONS } from '../../app.constants';

@Component({
  selector: 'app-student-dialog',
  imports: [CommonModule, CustomSelectComponent, ReactiveFormsModule],
  templateUrl: './student-dialog.component.html',
  styleUrl: './student-dialog.component.css'
})
export class StudentDialogComponent {
  private dialogRef = inject(MatDialogRef<StudentDialogComponent>);
  private mode: DialogMode = DialogMode.Add;

  public studentForm: FormGroup;
  public title: string = 'Добавление ученика'
  public submitMessage: string = 'Добавить'
  public formSubmitted = false;


  public statusOptions = STATUS_OPTIONS;

  public communicationOptions: SelectOptionWithIcon[] = COMMUNICATION_OPTIONS;

  public platformOptions: SelectOptionWithIcon[] = PLATFORM_OPTIONS;

  public fromOptions: SelectOptionWithIcon[] = FROM_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, student: Student | null }
  ) {
    this.mode = data.mode;
    var isActive = true;
    switch (this.mode) {
      case DialogMode.Add:
        this.title = 'Добавление ученика'
        this.submitMessage = 'Добавить'
        break;
      case DialogMode.Edit:
        this.title = 'Обновить ученика'
        this.submitMessage = 'Сохранить'
        if (data.student) {
          isActive = data.student.isActive
        }
        break;
    }
    this.studentForm = this.fb.group({
      name: [data.student?.name, [Validators.required]],
      phone: [data.student?.phone, [Validators.required, Validators.pattern(/^\+79\d{9}$/)]],
      subject: [data.student?.subject, Validators.required],
      communication: [data.student?.communication, Validators.required],
      platform: [data.student?.platform, Validators.required],
      cost: [data.student?.cost, [Validators.required, Validators.min(0)]],
      isActive: [isActive, [Validators.required]],
      from: [data.student?.from, [Validators.required]]
    });
  }

  onSelectCommunication(optionValue: string) {
    this.studentForm.get('communication')?.setValue(optionValue);
  }

  onSelectPlatform(optionValue: string) {
    this.studentForm.get('platform')?.setValue(optionValue);
  }

  onSelectFrom(optionValue: string) {
    this.studentForm.get('from')?.setValue(optionValue);
  }

  public submit(): void {
    this.formSubmitted = true;
    Object.keys(this.studentForm.controls).forEach(key => {
      this.studentForm.get(key)?.markAsTouched();
    });
    if (this.studentForm.invalid) {
      return;
    }

    switch (this.mode) {
      case DialogMode.Add:
        this.addStudent();
        break;
      case DialogMode.Edit:
        this.updateStudent();
        break;
    }
  }


  public addStudent(): void {
    const newStudent: Student = {
      ...this.studentForm.value
    };
    this.studentService.addStudent(newStudent).then(_ => {
      this.close(true);
    })
      .catch(error => {
        console.error('Ошибка при добавлении:', error);
        this.close(false);
      });
  }

  public updateStudent(): void {
    const updatedStudent: Student = {
      ...this.data.student,
      ...this.studentForm.value
    };

    this.studentService.updateStudent(updatedStudent.id, updatedStudent).then(_ => {
      this.close(true);
    })
      .catch(error => { console.error('Ошибка при обновлении:', error); this.close(false); });

  }

  public compareFn(option1: boolean, option2: boolean): boolean {
    return option1 === option2;
  }

  public close(status: boolean): void {
    this.dialogRef.close(status);
  }

  public getError(field: string): string | null {
    const control = this.studentForm.get(field);
    if (!control || !control.errors) return null;

    if (control.errors['required']) return '*Поле обязательно';
    if (control.errors['pattern']) return '*Неверный формат';
    if (control.errors['min']) return '*Слишком маленькое значение';
    return null;
  }
}
