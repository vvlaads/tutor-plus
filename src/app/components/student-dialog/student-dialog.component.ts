import { Component, ElementRef, HostListener, Inject, inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomSelectComponent } from '../custom-select/custom-select.component';
import { StudentService } from '../../services/student.service';
import { DialogMode } from '../../app.enums';
import { SelectOptionWithIcon, Student } from '../../app.interfaces';
import { COMMUNICATION_OPTIONS, FROM_OPTIONS, PLATFORM_OPTIONS, STATUS_OPTIONS } from '../../app.constants';
import { generateColor } from '../../app.functions';
import { allowedValuesValidator } from '../../functions/validators';

@Component({
  selector: 'app-student-dialog',
  imports: [CommonModule, CustomSelectComponent, ReactiveFormsModule],
  templateUrl: './student-dialog.component.html',
  styleUrl: './student-dialog.component.css'
})
export class StudentDialogComponent {
  private dialogRef = inject(MatDialogRef<StudentDialogComponent>);
  private mode: DialogMode;

  public studentForm: FormGroup;
  public title: string;
  public submitMessage: string;
  public formSubmitted = false;
  public statusOptions = STATUS_OPTIONS;
  public communicationOptions: SelectOptionWithIcon[] = COMMUNICATION_OPTIONS;
  public platformOptions: SelectOptionWithIcon[] = PLATFORM_OPTIONS;
  public fromOptions: SelectOptionWithIcon[] = FROM_OPTIONS;

  @ViewChild('colorPicker')
  public colorPicker!: ElementRef<HTMLInputElement>;

  @HostListener('document:keydown.escape', ['$event'])
  public handleEscapeKey(event: KeyboardEvent): void {
    this.close();
  }

  public constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, student: Student | null }
  ) {
    this.mode = data.mode;
    switch (this.mode) {
      case DialogMode.Add:
        this.title = 'Добавление ученика'
        this.submitMessage = 'Добавить'
        break;
      case DialogMode.Edit:
        this.title = 'Обновить ученика'
        this.submitMessage = 'Сохранить'
        break;
    }

    this.studentForm = this.fb.group({
      name: [data.student?.name, [Validators.required]],
      phone: [data.student?.phone, [Validators.required, Validators.pattern(/^\+79\d{9}$/)]],
      subject: [data.student?.subject, Validators.required],
      communication: [data.student?.communication, [Validators.required, allowedValuesValidator(this.communicationOptions, 'value')]],
      platform: [data.student?.platform, [Validators.required, allowedValuesValidator(this.platformOptions, 'value')]],
      cost: [data.student?.cost, [Validators.required, Validators.min(0)]],
      isActive: [data.student == null ? true : data.student.isActive, [Validators.required, allowedValuesValidator(this.statusOptions, 'value')]],
      from: [data.student?.from, [Validators.required, allowedValuesValidator(this.fromOptions, 'value')]],
      color: [data.student == null ? generateColor() : data.student.color, [Validators.required]]
    });
  }

  private convertFormToStudent(): Omit<Student, 'id'> {
    const studentValue = this.studentForm.value;
    const student = {
      ...studentValue
    }
    return student;
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
    this.close();
  }

  public addStudent(): void {
    const student = this.convertFormToStudent();

    this.studentService.addStudent(student).catch(error => {
      console.error('Ошибка при добавлении:', error);
    });
  }

  public updateStudent(): void {
    const student = this.convertFormToStudent();
    const id = this.data.student?.id
    if (id) {
      this.studentService.updateStudent(id, student).catch(error => {
        console.error('Ошибка при обновлении:', error);
      });
    }
  }

  public onSelectCommunication(optionValue: string): void {
    this.studentForm.get('communication')?.setValue(optionValue);
  }

  public onSelectPlatform(optionValue: string): void {
    this.studentForm.get('platform')?.setValue(optionValue);
  }

  public onSelectFrom(optionValue: string): void {
    this.studentForm.get('from')?.setValue(optionValue);
  }

  public close(): void {
    this.dialogRef.close();
  }

  public getError(field: string): string | null {
    const control = this.studentForm.get(field);
    if (!control || !control.errors) return null;

    if (control.errors['required']) return '*Поле обязательно';
    if (control.errors['pattern']) return '*Неверный формат';
    if (control.errors['min']) return '*Слишком маленькое значение';
    if (control.errors['allowedValues']) return '*Недопустимое значение';

    return null;
  }

  public openColorPicker(): void {
    const buttonRect = this.colorPicker.nativeElement.getBoundingClientRect();
    this.colorPicker.nativeElement.style.position = 'fixed';
    this.colorPicker.nativeElement.style.left = `${buttonRect.left}px`;
    this.colorPicker.nativeElement.click();
  }

  public onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.studentForm.get('color')?.setValue(input.value);
  }
}
