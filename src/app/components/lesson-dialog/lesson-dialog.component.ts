import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOption, Student } from '../../app.interfaces';
import { LessonService } from '../../services/lesson.service';
import { StudentService } from '../../services/student.service';
import { DateService } from '../../services/date.service';


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

  lessons: Lesson[] = []

  constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    private studentService: StudentService,
    private dateService: DateService,
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

    let date = data.lesson?.date
    if (date) {
      date = this.dateService.changeFormatDotToMinus(date)
    }

    this.lessonForm = this.fb.group({
      studentId: [data.lesson?.studentId, [Validators.required]],
      date: [date, [Validators.required, Validators.pattern(/^\d{4}\-[0-1]\d\-[0-3]\d$/)]],
      startTime: [data.lesson?.startTime, [Validators.required, Validators.pattern(/^[0-2]\d:[0-6]\d$/)]],
      endTime: [data.lesson?.endTime, [Validators.required, Validators.pattern(/^[0-2]\d:[0-6]\d$/)]],
      cost: [data.lesson?.cost, [Validators.required, Validators.min(0)]],
      isPaid: [data.lesson == null ? false : data.lesson.isPaid],
      isRepeat: [false],
      repeatUntil: [''],
    }, { validators: timeRangeValidator });
  }

  public ngOnInit() {
    this.studentService.students$.subscribe(students => {
      this.students = students;
      this.students.filter(student => student.isActive == true).forEach(student => {
        this.options.push({ value: student.id, text: `${student.name} ${student.phone}` });
      })
    });

    this.lessonForm.get('isRepeat')?.valueChanges.subscribe((isRepeat: boolean) => {
      const repeatUntil = this.lessonForm.get('repeatUntil');
      if (isRepeat) {
        repeatUntil?.setValidators([Validators.required]);
      } else {
        repeatUntil?.clearValidators();
      }
      repeatUntil?.updateValueAndValidity();
    });
  }


  public submit() {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }

    const lessonValue = { ...this.lessonForm.value };
    lessonValue.date = this.dateService.changeFormatMinusToDot(lessonValue.date);
    if (lessonValue.isRepeat) {
      lessonValue.repeatUntil = this.dateService.changeFormatMinusToDot(lessonValue.repeatUntil);

      let dates: Date[] = []
      if (lessonValue.isRepeat) {
        let start = this.dateService.stringToDate(lessonValue.date);
        let end = this.dateService.stringToDate(lessonValue.repeatUntil);
        dates = this.dateService.getDatesBetween(start, end);
      }
      console.log(dates)
      for (const date of dates) {
        let lesson = {
          studentId: lessonValue.studentId,
          date: this.dateService.dateToString(date),
          startTime: lessonValue.startTime,
          endTime: lessonValue.endTime,
          cost: lessonValue.cost,
          isPaid: lessonValue.isPaid,
          realEndTime: ''
        }

        switch (this.mode) {
          case DialogMode.Add:
            this.addLesson(lesson);
            break;
          case DialogMode.Edit:
            this.updateLesson(lesson);
            break;
        }
      }
    } else {
      let lesson = {
        studentId: lessonValue.studentId,
        date: lessonValue.date,
        startTime: lessonValue.startTime,
        endTime: lessonValue.endTime,
        cost: lessonValue.cost,
        isPaid: lessonValue.isPaid,
        realEndTime: ''
      }
      switch (this.mode) {
        case DialogMode.Add:
          this.addLesson(lesson);
          break;
        case DialogMode.Edit:
          this.updateLesson(lesson);
          break;
      }
    }
  }

  private generateTempId(): string {
    return 'temp-' + Math.random().toString(36).substr(2, 9);
  }

  private addLesson(lessonData: Omit<Lesson, 'id'>) {
    const lesson: Lesson = {
      ...lessonData,
      id: this.generateTempId(),
      realEndTime: lessonData.realEndTime || ''
    };

    this.lessonService.addLesson(lesson)
      .then(_ => this.close(true))
      .catch(error => {
        console.error('Ошибка при добавлении:', error);
        this.close(false);
      });
  }

  private updateLesson(lesson: Partial<Lesson>) {
    const updatedLesson = {
      ...this.data.lesson,
      ...lesson
    } as Lesson;
    this.lessonService.updateLesson(updatedLesson.id, updatedLesson).then(_ => { this.close(true); })
      .catch(error => { console.error('Ошибка при обновлении:', error); this.close(false); });

  }

  public close(status: boolean) {
    this.dialogRef.close(status);
  }

  public deleteLesson() {
    if (this.data.lesson) {
      const confirmDelete = confirm('Вы уверены, что хотите удалить это занятие?');
      if (confirmDelete) {
        this.lessonService.deleteLesson(this.data.lesson.id).then(_ => {
          this.close(true);
        }).catch(error => { console.error('Ошибка при удалении:', error); this.close(false); })
      }
    }
  }

  public isEditMode(): boolean {
    return this.mode == DialogMode.Edit;
  }
}
