import { Component, ElementRef, HostListener, Inject, inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { DialogMode } from '../../app.enums';
import { SelectOptionWithIcon, Student } from '../../app.interfaces';
import { COMMUNICATION_OPTIONS, FROM_OPTIONS, PAID_OPTIONS, PLATFORM_OPTIONS, STATUS_OPTIONS } from '../../app.constants';
import { clearPhoneNumber, generateColor, getErrorMessage } from '../../app.functions';
import { allowedValuesValidator, parentValidator, phoneNumberValidator, stopDateValidator } from '../../functions/validators';
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component';
import { changeDateFormatDotToMinus, changeDateFormatMinusToDot } from '../../functions/dates';

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
  public paidOptions = PAID_OPTIONS;
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
      phone: [data.student?.phone, [phoneNumberValidator()]],
      subject: [data.student?.subject, Validators.required],
      communication: [data.student?.communication, [Validators.required, allowedValuesValidator(this.communicationOptions, 'value')]],
      platform: [data.student?.platform, [Validators.required, allowedValuesValidator(this.platformOptions, 'value')]],
      cost: [data.student?.cost, [Validators.required, Validators.min(0)]],
      isActive: [data.student == null ? true : data.student.isActive, [Validators.required, allowedValuesValidator(this.statusOptions, 'value')]],
      from: [data.student?.from, [Validators.required, allowedValuesValidator(this.fromOptions, 'value')]],
      color: [data.student == null ? generateColor() : data.student.color, [Validators.required]],
      hasParent: [data.student == null ? false : data.student.hasParent],
      parentName: [data.student?.parentName],
      parentPhone: [data.student?.parentPhone, [phoneNumberValidator()]],
      parentCommunication: [data.student?.parentCommunication],
      paidByStudent: [data.student == null ? true : data.student.paidByStudent],
      isStopped: [data.student == null ? false : data.student.isStopped],
      stopDate: [data.student?.stopDate == null ? null : changeDateFormatDotToMinus(data.student.stopDate)],
      note: [data.student?.note]
    },
      {
        validators: [parentValidator(), stopDateValidator()]
      });
  }

  private convertFormToStudent(): Omit<Student, 'id'> {
    const studentValue = this.studentForm.value;
    const student = {
      ...studentValue,
      stopDate: studentValue.stopDate ? changeDateFormatMinusToDot(studentValue.stopDate) : null,
      phone: clearPhoneNumber(studentValue.phone),
      parentPhone: studentValue.hasParent ? clearPhoneNumber(studentValue.phone) : null
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

  public onSelectParentCommunication(optionValue: string): void {
    this.studentForm.get('parentCommunication')?.setValue(optionValue);
  }

  public close(): void {
    this.dialogRef.close();
  }

  public getError(field: string): string | null {
    return getErrorMessage(this.studentForm, field);
  }

  public getFormErrorMessage(): string | null {
    if (!this.studentForm.errors) return null;
    const errors = this.studentForm.errors;
    if (errors['invalidParentName']) {
      return 'Укажите имя родителя';
    }
    if (errors['invalidParentPhone']) {
      return 'Укажите верный номер телефона';
    }
    if (errors['invalidParentCommunication']) {
      return 'Выберите где общаемся';
    }
    if (errors['invalidPaidByStudent']) {
      return 'Выберите кто оплачивает';
    }
    if (errors['invalidStopDate']) {
      return 'Укажите дату приостановления';
    }
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
