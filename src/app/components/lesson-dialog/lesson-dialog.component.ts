import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOption, Student } from '../../app.interfaces';
import { LessonService } from '../../services/lesson.service';
import { StudentService } from '../../services/student.service';
import { getErrorMessage } from '../../app.functions';
import { realEndTimeRangeValidator, requiredRealEndTimeValidator, requiredRepeatDateValidator, timeRangeValidator } from '../../functions/validators';
import { changeDateFormatDotToMinus, changeDateFormatMinusToDot, convertDateToString, convertStringToDate, getDatesBetween } from '../../functions/dates';

@Component({
  selector: 'app-lesson-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lesson-dialog.component.html',
  styleUrl: './lesson-dialog.component.css'
})
export class LessonDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<LessonDialogComponent>);
  private mode: DialogMode = DialogMode.Add;
  private students: Student[] = []
  private lessons: Lesson[] = []

  public lessonForm: FormGroup;
  public title: string;
  public submitMessage: string;
  public options: SelectOption[] = []
  public studentCost = 0;
  public formSubmitted = false;
  public hasRealEndTime = false;

  public constructor(
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

    let date = '';
    let isRepeat = false;
    if (data.lesson) {
      date = changeDateFormatDotToMinus(data.lesson.date);
      isRepeat = data.lesson.isRepeat;
    }

    this.lessonForm = this.fb.group({
      studentId: [data.lesson?.studentId, [Validators.required]],
      date: [date, [Validators.required, Validators.pattern(/^\d{4}\-[0-1]\d\-[0-3]\d$/)]],
      startTime: [data.lesson?.startTime, [Validators.required, Validators.pattern(/^[0-2]\d:[0-6]\d$/)]],
      endTime: [data.lesson?.endTime, [Validators.required, Validators.pattern(/^[0-2]\d:[0-6]\d$/)]],
      cost: [data.lesson?.cost, [Validators.required, Validators.min(0)]],
      isPaid: [data.lesson == null ? false : data.lesson.isPaid],
      isRepeat: [isRepeat, Validators.required],
      repeatEndDate: [data.lesson?.repeatEndDate],
      hasRealEndTime: [data.lesson?.hasRealEndTime],
      realEndTime: [data.lesson?.realEndTime],
      note: [data.lesson?.note],
    }, { validators: [timeRangeValidator(), requiredRepeatDateValidator(), requiredRealEndTimeValidator(), realEndTimeRangeValidator()] });
  }

  public ngOnInit(): void {
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
    this.getCostByStudentId();
  }


  public submit(): void {
    this.formSubmitted = true;

    Object.keys(this.lessonForm.controls).forEach(key => {
      this.lessonForm.get(key)?.markAsTouched();
    });

    if (this.lessonForm.invalid) {
      return;
    }

    const lessonValue = { ...this.lessonForm.value };
    lessonValue.date = changeDateFormatMinusToDot(lessonValue.date);
    if (lessonValue.isRepeat) {
      lessonValue.repeatUntil = changeDateFormatMinusToDot(lessonValue.repeatUntil);

      let dates: Date[] = []
      if (lessonValue.isRepeat) {
        let start = convertStringToDate(lessonValue.date);
        let end = convertStringToDate(lessonValue.repeatUntil);
        dates = getDatesBetween(start, end);
      }
      console.log(dates)
      for (const date of dates) {
        let lesson = {
          studentId: lessonValue.studentId,
          date: convertDateToString(date),
          startTime: lessonValue.startTime,
          endTime: lessonValue.endTime,
          cost: lessonValue.cost,
          isPaid: lessonValue.isPaid,
          isRepeat: lessonValue.isRepeat,
          realEndTime: null,
          note: null,
          hasRealEndTime: false,
          baseLessonId: null,
          repeatEndDate: null
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
        isRepeat: lessonValue.isRepeat,
        realEndTime: null,
        note: null,
        baseLessonId: null,
        hasRealEndTime: false,
        repeatEndDate: null
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

  private addLesson(lessonData: Omit<Lesson, 'id'>): void {
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

  private updateLesson(lesson: Partial<Lesson>): void {
    const updatedLesson = {
      ...this.data.lesson,
      ...lesson
    } as Lesson;
    this.lessonService.updateLesson(updatedLesson.id, updatedLesson).then(_ => { this.close(true); })
      .catch(error => { console.error('Ошибка при обновлении:', error); this.close(false); });

  }

  public close(status: boolean): void {
    this.dialogRef.close(status);
  }

  public deleteLesson(): void {
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

  public async getCostByStudentId(): Promise<void> {
    const student = await this.studentService.getStudentById(this.lessonForm.value.studentId);
    if (student) {
      this.studentCost = student.cost;
    }
  }

  public getErrorMessage(field: string): string | null {
    return getErrorMessage(this.lessonForm, field);
  }

  getFormErrorMessage(): string | null {
    if (!this.lessonForm.errors) return null;

    const errors = this.lessonForm.errors;

    // Определяем порядок приоритета ошибок
    if (errors['timeRangeInvalid']) {
      return 'Время окончания должно быть позже времени начала!';
    }

    if (errors['repeatEndDateInvalid']) {
      return 'Укажите дату для повторения';
    }

    if (errors['realEndTimeInvalid']) {
      return 'Укажите настоящее время окончания';
    }

    return null;
  }
}
