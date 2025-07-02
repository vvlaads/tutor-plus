import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOption, Student } from '../../app.interfaces';
import { LessonService } from '../../services/lesson.service';
import { StudentService } from '../../services/student.service';


function convertTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeRangeValidator(group: FormGroup): { [key: string]: any } | null {
  const startTime = group.get('startTime')?.value;
  const endTime = group.get('endTime')?.value;

  if (!startTime || !endTime) {
    return null;
  }

  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    return { timeRangeInvalid: true };
  }

  return null;
}

@Component({
  selector: 'app-lesson-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lesson-dialog.component.html',
  styleUrl: './lesson-dialog.component.css'
})
export class LessonDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<LessonDialogComponent>);
  lessonForm: FormGroup;
  mode: DialogMode = DialogMode.Add;
  title: string = 'Новое занятие'
  submitMessage: string = 'Добавить'
  students: Student[] = []
  options: SelectOption[] = []

  constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    private studentService: StudentService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, lesson: Lesson | null }
  ) {
    this.mode = data.mode;
    switch (this.mode) {
      case DialogMode.Add:
        this.title = 'Новое занятие'
        this.submitMessage = 'Добавить'
        break;
      case DialogMode.Edit:
        this.title = 'Редактировать занятие'
        this.submitMessage = 'Сохранить'
        break;
    }

    this.lessonForm = this.fb.group({
      studentId: [data.lesson?.studentId, [Validators.required]],
      date: [data.lesson?.date, [Validators.required, Validators.pattern(/^[0-3]\d\.[0-1]\d\.\d{4}$/)]],
      startTime: [data.lesson?.startTime, [Validators.required, Validators.pattern(/^[0-2]\d:[0-6]\d$/)]],
      endTime: [data.lesson?.endTime, [Validators.required, Validators.pattern(/^[0-2]\d:[0-6]\d$/)]],
      cost: [data.lesson?.cost, [Validators.required, Validators.min(0)]],
      isPaid: [data.lesson?.isPaid],
    }, { validators: timeRangeValidator });
  }

  ngOnInit() {
    this.studentService.students$.subscribe(students => {
      this.students = students;
      this.students.filter(student => student.isActual == true).forEach(student => {
        this.options.push({ value: student.id, text: `${student.name} ${student.phone}` });
      })
    });
  }


  submit() {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }
    switch (this.mode) {
      case DialogMode.Add:
        this.addLesson();
        break;
      case DialogMode.Edit:
        this.updateLesson();
        break;
    }
  }

  addLesson() {
    const newLesson: Lesson = {
      ...this.lessonForm.value
    };
    this.lessonService.addLesson(newLesson)
      .catch(error => { console.error('Ошибка при добавлении:', error); });
    this.close();
  }

  updateLesson() {
    const updatedLesson: Lesson = {
      ...this.data.lesson,
      ...this.lessonForm.value
    };

    this.lessonService.updateLesson(updatedLesson.id, updatedLesson)
      .catch(error => { console.error('Ошибка при обновлении:', error); });
    this.close();
  }

  close() {
    this.dialogRef.close();
  }
}
