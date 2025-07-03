import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomSelectComponent } from '../custom-select/custom-select.component';
import { StudentService } from '../../services/student.service';
import { DialogMode } from '../../app.enums';
import { SelectOptionWithIcon, Student } from '../../app.interfaces';

@Component({
  selector: 'app-student-dialog',
  imports: [CommonModule, CustomSelectComponent, ReactiveFormsModule],
  templateUrl: './student-dialog.component.html',
  styleUrl: './student-dialog.component.css'
})
export class StudentDialogComponent {
  dialogRef = inject(MatDialogRef<StudentDialogComponent>);
  studentForm: FormGroup;
  mode: DialogMode = DialogMode.Add;
  title: string = 'Добавление ученика'
  submitMessage: string = 'Добавить'

  statusOptions = [{ value: true, text: 'Активный' }, { value: false, text: 'Завершенный' }]

  communicationOptions: SelectOptionWithIcon[] = [
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' },
    { value: 'WhatsApp', text: 'WhatsApp', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Whatsapp%20Icon.png' },
    { value: 'Teams', text: 'Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Profi', text: 'Profi', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Profi%20Icon.png' },
    { value: 'Телефон', text: 'Телефон', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Phone%20Icon.png' }
  ];

  platformOptions: SelectOptionWithIcon[] = [
    { value: 'Zoom', text: 'Zoom', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Zoom%20Icon.png' },
    { value: 'Teams', text: 'Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' }
  ];

  fromOptions: SelectOptionWithIcon[] = [
    { value: 'Repetit.ru', text: 'Repetit.ru', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/owl.png' },
    { value: 'Teams', text: 'Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' }
  ];

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

  submit() {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
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

  addStudent() {
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

  updateStudent() {
    const updatedStudent: Student = {
      ...this.data.student,
      ...this.studentForm.value
    };

    this.studentService.updateStudent(updatedStudent.id, updatedStudent).then(_ => {
      this.close(true);
    })
      .catch(error => { console.error('Ошибка при обновлении:', error); this.close(false); });

  }

  compareFn(option1: boolean, option2: boolean): boolean {
    return option1 === option2;
  }

  close(status: boolean) {
    this.dialogRef.close(status);
  }
}
