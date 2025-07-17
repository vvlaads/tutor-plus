import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogMode } from '../../app.enums';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlotService } from '../../services/slot.service';
import { Slot, TimeBlock } from '../../app.interfaces';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { changeDateFormatDotToMinus, changeDateFormatMinusToDot, convertDateToString, convertStringToDate, convertTimeToMinutes, getWeeklyRecurringDates } from '../../functions/dates';
import { getErrorMessage } from '../../app.functions';
import { correctYearValidator, realEndTimeRangeValidator, repeatDateRangeValidator, requiredRealEndTimeValidator, requiredRepeatDateValidator, timeRangeValidator } from '../../functions/validators';
import { REPEAT_SLOT_OPTIONS } from '../../app.constants';
import { LessonService } from '../../services/lesson.service';
import { ScheduleObjectService } from '../../services/schedule-object.service';

@Component({
  selector: 'app-slot-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './slot-dialog.component.html',
  styleUrl: './slot-dialog.component.css'
})
export class SlotDialogComponent {
  private dialogRef = inject(MatDialogRef<SlotDialogComponent>);
  private mode: DialogMode = DialogMode.Add;
  private scheduleObjectService = inject(ScheduleObjectService);

  public slotForm: FormGroup;
  public title: string;
  public submitMessage: string;
  public formSubmitted = false;

  public constructor(
    private fb: FormBuilder,
    private slotService: SlotService,
    private dialogService: DialogService,
    private lessonService: LessonService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, slot: Partial<Slot> | null }
  ) {
    this.mode = data.mode;
    switch (this.mode) {
      case DialogMode.Add:
        this.title = 'Добавление окна'
        this.submitMessage = 'Добавить'
        break;
      case DialogMode.Edit:
        this.title = 'Редактировать окно'
        this.submitMessage = 'Сохранить'
        break;
    }

    this.slotForm = this.fb.group({
      date: [data.slot?.date == null ? null : changeDateFormatDotToMinus(data.slot.date), [Validators.required, correctYearValidator()]],
      startTime: [data.slot?.startTime, [Validators.required]],
      endTime: [data.slot?.endTime, [Validators.required]],
      isRepeat: [data.slot == null ? false : data.slot.isRepeat],
      repeatEndDate: [data.slot?.repeatEndDate ? changeDateFormatDotToMinus(data.slot.repeatEndDate) : null, [correctYearValidator()]],
      hasRealEndTime: [data.slot == null ? false : data.slot.hasRealEndTime],
      realEndTime: [data.slot?.realEndTime]
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

  private convertFormToSlot(): Omit<Slot, 'id'> {
    const slotValue = this.slotForm.value;
    const slot = {
      ...slotValue,
      date: changeDateFormatMinusToDot(slotValue.date),
      repeatEndDate: slotValue.repeatEndDate ? changeDateFormatMinusToDot(slotValue.repeatEndDate) : null
    }
    return slot;
  }

  public submit(): void {
    this.formSubmitted = true;

    Object.keys(this.slotForm.controls).forEach(key => {
      this.slotForm.get(key)?.markAsTouched();
    });

    if (this.slotForm.invalid) {
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
    let slot = this.convertFormToSlot();
    const baseSlotId = await this.scheduleObjectService.addSlot(slot);

    if (!baseSlotId) {
      alert(`Наложение окна, добавление отменено: \n${slot.date} (${slot.startTime} - ${slot.endTime})`);
      return;
    }

    const collisions: TimeBlock[] = [];
    if (slot.isRepeat && slot.repeatEndDate) {
      slot.baseSlotId = baseSlotId;
      const update = await this.scheduleObjectService.updateSlot(baseSlotId, slot);
      if (!update) return;
      const startDate = convertStringToDate(slot.date);
      const endDate = convertStringToDate(slot.repeatEndDate);
      const dates = getWeeklyRecurringDates(startDate, endDate);
      for (let date of dates) {
        slot.date = convertDateToString(date);
        let id = await this.scheduleObjectService.addSlot(slot);
        if (!id) {
          collisions.push(slot);
        }
      }

      if (collisions.length > 0) {
        let line = `Наложение окон, добавление отменено:`;
        for (let collision of collisions) {
          line += `\n${collision.date} (${collision.startTime} - ${collision.endTime})`
        }
        alert(line)
      }
    }
  }

  private async update(): Promise<void> {
    const slot = this.convertFormToSlot();
    const id = this.data.slot?.id;
    if (id) {
      const result = await this.scheduleObjectService.updateSlot(id, slot);
      if (!result) {
        alert(`Наложение окна, изменение отменено: \n${slot.date} (${slot.startTime} - ${slot.endTime})`);
        return;
      }
    }
  }

  public delete(): void {
    const id = this.data.slot?.id;
    if (id) {
      let confirmed = false;
      let currentSlot = this.convertFormToSlot();
      if (currentSlot.isRepeat) {
        const dialogRef = this.dialogService.openChoiceDialog(REPEAT_SLOT_OPTIONS);
        dialogRef.afterClosed().subscribe(async result => {
          switch (result) {
            case 'ONE':
              confirmed = confirm("Вы уверены, что хотите удалить это окно");
              if (confirmed) {
                this.slotService.deleteSlot(id);
                this.close();
              }
              break;
            case 'FUTURE':
              confirmed = confirm("Вы уверены, что хотите удалить это и будущие окна");
              if (confirmed) {
                this.slotService.deleteThisAndFuturesSlots(id);
                this.close();
              }
              break;
          }
        })
      } else {
        confirmed = confirm("Вы уверены, что хотите удалить это окно?");
        if (confirmed) {
          this.slotService.deleteSlot(id);
          this.close();
        }
      }
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public isEditMode(): boolean {
    return this.mode == DialogMode.Edit;
  }

  public convertToLesson(): void {
    this.dialogService.openLessonDialog(DialogMode.Add, this.convertFormToSlot());
    this.close();
  }

  public getErrorMessage(field: string): string | null {
    return getErrorMessage(this.slotForm, field);
  }

  public getFormErrorMessage(): string | null {
    if (!this.slotForm.errors) return null;
    const errors = this.slotForm.errors;
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