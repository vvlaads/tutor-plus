import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOption, Student } from '../../app.interfaces';
import { LessonService } from '../../services/lesson.service';
import { StudentService } from '../../services/student.service';
import { getErrorMessage } from '../../app.functions';
import { DialogService } from '../../services/dialog.service';
import { REPEAT_LESSON_OPTIONS } from '../../app.constants';
import {
  realEndTimeRangeValidator, repeatDateRangeValidator,
  requiredRealEndTimeValidator, requiredRepeatDateValidator, timeRangeValidator
} from '../../functions/validators';
import {
  changeDateFormatDotToMinus, changeDateFormatMinusToDot,
  convertDateToString, convertStringToDate, getWeeklyRecurringDates
} from '../../functions/dates';


@Component({
  selector: 'app-lesson-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lesson-dialog.component.html',
  styleUrl: './lesson-dialog.component.css'
})
export class LessonDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<LessonDialogComponent>);
  private mode: DialogMode;
  private students: Student[] = []

  public lessonForm: FormGroup;
  public title: string;
  public submitMessage: string;
  public options: SelectOption[] = []
  public studentCost = 0;
  public formSubmitted = false;

  public constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    private studentService: StudentService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, lesson: Partial<Lesson> | null }
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
      date: [data.lesson?.date == null ? null : changeDateFormatDotToMinus(data.lesson.date), [Validators.required]],
      startTime: [data.lesson?.startTime, [Validators.required]],
      endTime: [data.lesson?.endTime, [Validators.required]],
      cost: [data.lesson?.cost, [Validators.required, Validators.min(0)]],
      isPaid: [data.lesson == null ? false : data.lesson.isPaid],
      isRepeat: [data.lesson == null ? false : data.lesson.isRepeat],
      repeatEndDate: [data.lesson?.repeatEndDate ? changeDateFormatDotToMinus(data.lesson.repeatEndDate) : null],
      hasRealEndTime: [data.lesson == null ? false : data.lesson.hasRealEndTime],
      realEndTime: [data.lesson?.realEndTime],
      note: [data.lesson?.note],
    }, {
      validators: [
        timeRangeValidator(),
        requiredRepeatDateValidator(),
        requiredRealEndTimeValidator(),
        realEndTimeRangeValidator(),
        repeatDateRangeValidator()
      ]
    });
  }

  public ngOnInit(): void {
    this.subscribeToStudents();
    if (this.data.lesson?.studentId) {
      this.getCostByStudentId();
    }
  }

  private subscribeToStudents(): void {
    this.studentService.students$.subscribe(students => {
      this.students = students;
      this.students.filter(student => student.isActive == true).forEach(student => {
        this.options.push({ value: student.id, text: `${student.name} ${student.phone}` });
      })
    });
  }

  private convertFormToLesson(): Omit<Lesson, 'id'> {
    const lessonValue = this.lessonForm.value;
    const lesson = {
      ...lessonValue,
      date: changeDateFormatMinusToDot(lessonValue.date),
      repeatEndDate: lessonValue.repeatEndDate ? changeDateFormatMinusToDot(lessonValue.repeatEndDate) : null
    }
    return lesson;
  }

  public submit(): void {
    this.formSubmitted = true;
    Object.keys(this.lessonForm.controls).forEach(key => {
      this.lessonForm.get(key)?.markAsTouched();
    });

    if (this.lessonForm.invalid) {
      return;
    }

    switch (this.mode) {
      case DialogMode.Add:
        this.add();
        break;
      case DialogMode.Edit:
        this.update();
        break;
    }
    this.close();
  }

  private async add(): Promise<void> {
    let lesson = this.convertFormToLesson();
    const baseLessonId = await this.addLesson(lesson);
    if (lesson.isRepeat && baseLessonId && lesson.repeatEndDate) {
      lesson.baseLessonId = baseLessonId;
      this.updateLesson(lesson, baseLessonId);
      const startDate = convertStringToDate(lesson.date);
      const endDate = convertStringToDate(lesson.repeatEndDate);
      const dates = getWeeklyRecurringDates(startDate, endDate);
      for (let date of dates) {
        lesson.date = convertDateToString(date);
        this.addLesson(lesson);
      }
    }
  }

  private update(): void {
    const lesson = this.convertFormToLesson();
    const id = this.data.lesson?.id;
    if (id) {
      this.updateLesson(lesson, id);
    }
  }

  public delete(): void {
    let currentLesson = this.convertFormToLesson();
    if (this.data.lesson?.id) {
      const id = this.data.lesson.id;
      let confirmed = false;
      if (currentLesson.isRepeat) {
        const dialogRef = this.dialogService.openChoiceDialog(REPEAT_LESSON_OPTIONS);
        dialogRef.afterClosed().subscribe(async result => {
          switch (result) {
            case 'ONE':
              confirmed = confirm("Вы уверены, что хотите удалить это занятие");
              if (confirmed) {
                this.changeBaseLesson(id);
                this.deleteLesson(id);
                this.close();
              }
              break;
            case 'FUTURE':
              confirmed = confirm("Вы уверены, что хотите удалить это и будущие занятие");
              if (confirmed) {
                const lessons = await this.lessonService.getFutureRepeatedLessons(id);
                for (let lesson of lessons) {
                  this.deleteLesson(lesson.id);
                }
                this.close();
              }
              break;
          }
        })
      } else {
        confirmed = confirm("Вы уверены, что хотите удалить это занятие");
        if (confirmed) {
          this.deleteLesson(id);
          this.close();
        }
      }
    }
  }

  private async changeBaseLesson(id: string): Promise<void> {
    const lessons = await this.lessonService.getFutureRepeatedLessons(id);
    if (this.data.lesson?.baseLessonId === id && lessons.length > 1) {
      const newId = lessons[1].id;
      for (let lesson of lessons) {
        this.updateLesson({ baseLessonId: newId }, lesson.id);
      }
    }
  }

  private async addLesson(lesson: Omit<Lesson, 'id'>): Promise<string | null> {
    const id = await this.lessonService.addLesson(lesson).catch(error => {
      console.error('Ошибка при добавлении:', error);
      return null;
    });
    return id;
  }

  private updateLesson(lesson: Partial<Lesson>, id: string): void {
    this.lessonService.updateLesson(id, lesson).catch(error => {
      console.error('Ошибка при обновлении:', error);
    });
  }

  public deleteLesson(id: string): void {
    this.lessonService.deleteLesson(id).catch(error => {
      console.error('Ошибка при удалении:', error);
    })
  }

  public close(): void {
    this.dialogRef.close();
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

  public getFormErrorMessage(): string | null {
    if (!this.lessonForm.errors) return null;
    const errors = this.lessonForm.errors;
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
