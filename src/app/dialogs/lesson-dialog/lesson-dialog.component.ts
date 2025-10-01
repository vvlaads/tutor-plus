import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogMode } from '../../app.enums';
import { Lesson, SelectOption, Student, TimeBlock } from '../../app.interfaces';
import { LessonService } from '../../services/lesson.service';
import { StudentService } from '../../services/student.service';
import { getErrorMessage } from '../../app.functions';
import { DialogService } from '../../services/dialog.service';
import { HOURS_IN_DAY, MAX_LESSON_DURATION, MINUTES_IN_HOUR, REPEAT_LESSON_OPTIONS } from '../../app.constants';
import {
  correctYearValidator,
  realEndTimeRangeValidator, repeatDateRangeValidator,
  requiredRealEndTimeValidator, requiredRepeatDateValidator, timeRangeValidator
} from '../../functions/validators';
import {
  changeDateFormatDotToMinus, changeDateFormatMinusToDot,
  convertDateToString, convertStringToDate, convertTimeToMinutes, getWeeklyRecurringDates
} from '../../functions/dates';
import { SlotService } from '../../services/slot.service';
import { SearchSelectComponent } from "../../components/search-select/search-select.component";
import { Router } from '@angular/router';
import { StateService } from '../../services/state.service';
import { ScheduleObjectService } from '../../services/schedule-object.service';
import { DeviceService } from '../../services/device.service';


@Component({
  selector: 'app-lesson-dialog',
  imports: [CommonModule, ReactiveFormsModule, SearchSelectComponent],
  templateUrl: './lesson-dialog.component.html',
  styleUrl: './lesson-dialog.component.css'
})
export class LessonDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<LessonDialogComponent>);
  private stateService = inject(StateService);
  private scheduleObjectService = inject(ScheduleObjectService);
  private deviceService = inject(DeviceService);

  public deviceType$ = this.deviceService.deviceType$;
  private students: Student[] = []
  public isOwlStudent = false;
  public lessonForm: FormGroup;
  public title: string;
  public submitMessage: string;
  public options: SelectOption[] = []
  public studentCost = 0;
  public formSubmitted = false;
  public preferredCost = 1000;

  public constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    private studentService: StudentService,
    private slotService: SlotService,
    private dialogService: DialogService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, lesson: Partial<Lesson> | null }
  ) {
    switch (this.data.mode) {
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
      date: [data.lesson?.date == null ? null : changeDateFormatDotToMinus(data.lesson.date), [Validators.required, correctYearValidator()]],
      startTime: [data.lesson?.startTime, [Validators.required]],
      endTime: [data.lesson?.endTime, [Validators.required]],
      cost: [data.lesson?.cost, [Validators.required, Validators.min(0)]],
      isPaid: [data.lesson == null ? false : data.lesson.isPaid],
      isRepeat: [data.lesson == null ? false : data.lesson.isRepeat],
      repeatEndDate: [data.lesson?.repeatEndDate ? changeDateFormatDotToMinus(data.lesson.repeatEndDate) : null, [correctYearValidator()]],
      hasRealEndTime: [data.lesson == null ? false : data.lesson.hasRealEndTime],
      realEndTime: [data.lesson?.realEndTime],
      note: [data.lesson?.note],
      paidByOwl: [data.lesson == null ? false : data.lesson.paidByOwl],
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
      this.updateStudentInfo();
    }
  }

  private subscribeToStudents(): void {
    this.studentService.students$.subscribe(students => {
      this.students = students;
      this.options = this.students.filter(student => student.isActive).map(student => ({
        value: student.id,
        text: `${student.name} ${student.phone}`
      }));
    });
  }

  private convertFormToLesson(): Omit<Lesson, 'id'> {
    const lessonValue = this.lessonForm.value;
    const lesson = {
      ...lessonValue,
      date: lessonValue.date ? changeDateFormatMinusToDot(lessonValue.date) : null,
      repeatEndDate: lessonValue.repeatEndDate && lessonValue.isRepeat ? changeDateFormatMinusToDot(lessonValue.repeatEndDate) : null,
      paidByOwl: this.isOwlStudent ? (lessonValue.paidByOwl || false) : null
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

    switch (this.data.mode) {
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
    const baseLessonId = await this.scheduleObjectService.addLesson(lesson);

    if (!baseLessonId) {
      alert(`Наложение занятия, добавление отменено: \n${lesson.date} (${lesson.startTime} - ${lesson.endTime})`);
      return;
    }

    const collisions: TimeBlock[] = [];
    if (lesson.isRepeat && lesson.repeatEndDate) {
      lesson.baseLessonId = baseLessonId;
      const update = await this.scheduleObjectService.updateLesson(baseLessonId, lesson);
      if (!update) return;
      lesson.isPaid = false;
      if (this.isOwlStudent) {
        lesson.paidByOwl = false;
      }
      const startDate = convertStringToDate(lesson.date);
      const endDate = convertStringToDate(lesson.repeatEndDate);
      const dates = getWeeklyRecurringDates(startDate, endDate);
      for (let date of dates) {
        lesson.date = convertDateToString(date);
        let id = await this.scheduleObjectService.addLesson(lesson);
        if (!id) {
          collisions.push(lesson);
        }
      }

      if (collisions.length > 0) {
        let line = `Наложение занятиий, добавление отменено:`;
        for (let collision of collisions) {
          line += `\n${collision.date} (${collision.startTime} - ${collision.endTime})`
        }
        alert(line)
      }
    }
  }

  private async update(): Promise<void> {
    const lesson = this.convertFormToLesson();
    const id = this.data.lesson?.id;
    if (id) {
      const result = await this.scheduleObjectService.updateLesson(id, lesson);
      if (!result) {
        alert(`Наложение занятия, изменение отменено: \n${lesson.date} (${lesson.startTime} - ${lesson.endTime})`);
        return;
      }
    }
  }

  public delete(): void {
    const id = this.data.lesson?.id;
    if (id) {
      let confirmed = false;
      let currentLesson = this.convertFormToLesson();
      if (currentLesson.isRepeat) {
        const dialogRef = this.dialogService.openChoiceDialog(REPEAT_LESSON_OPTIONS);
        dialogRef.afterClosed().subscribe(async result => {
          switch (result) {
            case 'ONE':
              confirmed = confirm("Вы уверены, что хотите удалить это занятие");
              if (confirmed) {
                this.lessonService.deleteLesson(id);
                this.close();
              }
              break;
            case 'FUTURE':
              confirmed = confirm("Вы уверены, что хотите удалить это и будущие занятие");
              if (confirmed) {
                this.lessonService.deleteThisAndFuturesLessons(id);
                this.close();
              }
              break;
          }
        })
      } else {
        confirmed = confirm("Вы уверены, что хотите удалить это занятие");
        if (confirmed) {
          this.lessonService.deleteLesson(id);
          this.close();
        }
      }
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public isEditMode(): boolean {
    return this.data.mode == DialogMode.Edit;
  }

  public async getCostByStudentId(): Promise<void> {
    const student = await this.studentService.getStudentById(this.lessonForm.value.studentId);
    if (student) {
      this.studentCost = student.cost;
    }
  }

  public getPreferredCost(): void {
    let cost = 1000;
    let lessonValue = this.lessonForm.value;
    if (!lessonValue.startTime) {
      lessonValue.startTime = this.data.lesson?.startTime;
    }
    if (!lessonValue.endTime) {
      lessonValue.endTime = this.data.lesson?.endTime;
    }
    if (!lessonValue.realEndTime) {
      lessonValue.realEndTime = this.data.lesson?.realEndTime;
    }
    if (!lessonValue.studentId) {
      lessonValue.studentId = this.data.lesson?.studentId;
    }

    if (lessonValue.startTime && lessonValue.endTime && lessonValue.studentId) {
      if (lessonValue.hasRealEndTime && lessonValue.realEndTime) {
        const start = convertTimeToMinutes(lessonValue.startTime);
        const end = convertTimeToMinutes(lessonValue.realEndTime)
        cost = this.studentCost * (end - start) / MINUTES_IN_HOUR
        if (end < start && end + MINUTES_IN_HOUR * HOURS_IN_DAY <= start + MINUTES_IN_HOUR * MAX_LESSON_DURATION) {
          cost = this.studentCost * (end + MINUTES_IN_HOUR * HOURS_IN_DAY - start) / MINUTES_IN_HOUR
        }
      } else {
        cost = this.studentCost * (convertTimeToMinutes(lessonValue.endTime) - convertTimeToMinutes(lessonValue.startTime)) / MINUTES_IN_HOUR
      }
      if (cost > 0) {
        this.preferredCost = cost;
        this.lessonForm.patchValue({
          cost: cost
        });
      }
    }
  }

  public async updateStudentInfo(): Promise<void> {
    await this.getCostByStudentId();
    this.getPreferredCost();
    let lessonValue = this.lessonForm.value;
    if (!lessonValue.studentId) {
      lessonValue.studentId = this.data.lesson?.studentId;
    }
    const student = await this.studentService.getStudentById(lessonValue.studentId);
    student?.from === 'Сова' ? this.isOwlStudent = true : this.isOwlStudent = false;
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

  public goToStudent(): void {
    const id = this.lessonForm.value.studentId;
    if (id) {
      this.stateService.saveLessonForm(this.data.mode, { ...this.convertFormToLesson(), id: this.data.lesson?.id });
      this.close();
      this.router.navigate(['/student', id]);
    }
  }
}
