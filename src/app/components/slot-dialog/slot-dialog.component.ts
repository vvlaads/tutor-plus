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
import { realEndTimeRangeValidator, repeatDateRangeValidator, requiredRealEndTimeValidator, requiredRepeatDateValidator, timeRangeValidator } from '../../functions/validators';
import { REPEAT_SLOT_OPTIONS } from '../../app.constants';
import { LessonService } from '../../services/lesson.service';

@Component({
  selector: 'app-slot-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './slot-dialog.component.html',
  styleUrl: './slot-dialog.component.css'
})
export class SlotDialogComponent {
  private dialogRef = inject(MatDialogRef<SlotDialogComponent>);
  private mode: DialogMode = DialogMode.Add;

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
      date: [data.slot?.date == null ? null : changeDateFormatDotToMinus(data.slot.date), [Validators.required]],
      startTime: [data.slot?.startTime, [Validators.required]],
      endTime: [data.slot?.endTime, [Validators.required]],
      isRepeat: [data.slot == null ? false : data.slot.isRepeat],
      repeatEndDate: [data.slot?.repeatEndDate ? changeDateFormatDotToMinus(data.slot.repeatEndDate) : null],
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
    const collisions = [];
    let slot = this.convertFormToSlot();
    const collision = await this.checkCollision(slot, null)
    if (collision) {
      alert(`Наложение окна, добавление отменено: \n${collision.date} (${collision.startTime} - ${collision.endTime})`);
      return;
    }
    const baseSlotId = await this.addSlot(slot);
    if (slot.isRepeat && baseSlotId && slot.repeatEndDate) {
      slot.baseSlotId = baseSlotId;
      this.updateSlot(slot, baseSlotId);
      const startDate = convertStringToDate(slot.date);
      const endDate = convertStringToDate(slot.repeatEndDate);
      const dates = getWeeklyRecurringDates(startDate, endDate);
      for (let date of dates) {
        slot.date = convertDateToString(date);
        const collision = await this.checkCollision(slot, null)
        if (collision) {
          collisions.push(collision);
          continue;
        }
        this.addSlot(slot);
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

  private async update(): Promise<void> {
    const slot = this.convertFormToSlot();
    const id = this.data.slot?.id;
    if (id) {
      const collision = await this.checkCollision(slot, id)
      if (collision) {
        alert(`Наложение окна, изменение отменено: \n${collision.date} (${collision.startTime} - ${collision.endTime})`);
        return;
      }
      if (!slot.isRepeat) {
        slot.baseSlotId = null;
        slot.repeatEndDate = null;
      }
      this.updateSlot(slot, id);
    }
  }

  public delete(): void {
    let currentSlot = this.convertFormToSlot();
    if (this.data.slot?.id) {
      const id = this.data.slot.id;
      let confirmed = false;
      if (currentSlot.isRepeat) {
        const dialogRef = this.dialogService.openChoiceDialog(REPEAT_SLOT_OPTIONS);
        dialogRef.afterClosed().subscribe(async result => {
          switch (result) {
            case 'ONE':
              confirmed = confirm("Вы уверены, что хотите удалить это окно");
              if (confirmed) {
                this.changeBaseSlot(id);
                this.deleteSlot(id);
                this.close();
              }
              break;
            case 'FUTURE':
              confirmed = confirm("Вы уверены, что хотите удалить это и будущие окна");
              if (confirmed) {
                const slots = await this.slotService.getFutureRepeatedSlots(id);
                for (let slot of slots) {
                  this.deleteSlot(slot.id);
                }
                this.close();
              }
              break;
          }
        })
      } else {
        confirmed = confirm("Вы уверены, что хотите удалить это окно");
        if (confirmed) {
          this.deleteSlot(id);
          this.close();
        }
      }
    }
  }

  private async changeBaseSlot(id: string): Promise<void> {
    const slots = await this.slotService.getFutureRepeatedSlots(id);
    if (this.data.slot?.baseSlotId === id && slots.length > 1) {
      const newId = slots[1].id;
      for (let slot of slots) {
        this.updateSlot({ baseSlotId: newId }, slot.id);
      }
    }
  }

  private async addSlot(slot: Omit<Slot, 'id'>): Promise<string | null> {
    const id = await this.slotService.addSlot(slot).catch(error => {
      console.error('Ошибка при добавлении:', error);
      return null;
    });
    return id;
  }

  private updateSlot(slot: Partial<Slot>, id: string): void {
    this.slotService.updateSlot(id, slot).catch(error => {
      console.error('Ошибка при обновлении:', error);
    });
  }

  private deleteSlot(id: string): void {
    this.slotService.deleteSlot(id).catch(error => {
      console.error('Ошибка при удалении:', error);
    })
  }

  public close(): void {
    this.dialogRef.close();
  }

  private async checkCollision(slot: Omit<Slot, 'id'>, id: string | null): Promise<TimeBlock | null> {
    const lessons = await this.lessonService.getLessons();
    const startSlot = convertTimeToMinutes(slot.startTime);
    const endSlot = convertTimeToMinutes(slot.endTime);
    for (let l of lessons) {
      const start = convertTimeToMinutes(l.startTime);
      const end = convertTimeToMinutes(l.endTime);
      if (id && id === l.id) { continue; }
      if (l.date === slot.date && ((startSlot >= start && startSlot < end) || (endSlot > start && endSlot <= end))) {
        return { date: l.date, startTime: l.startTime, endTime: l.endTime };
      }
    }

    const slots = await this.slotService.getSlots();
    for (let s of slots) {
      const start = convertTimeToMinutes(s.startTime);
      const end = convertTimeToMinutes(s.endTime);
      if (s.date === slot.date && ((startSlot >= start && startSlot < end) || (endSlot > start && endSlot <= end))) {
        return { date: s.date, startTime: s.startTime, endTime: s.endTime };
      }
    }

    return null;
  }

  public isEditMode(): boolean {
    return this.mode == DialogMode.Edit;
  }

  public convertToLesson(): void {
    const slot = this.convertFormToSlot();
    const idsToDelete: string[] = [];
    const dialigRef = this.dialogService.openLessonDialog(DialogMode.Add, slot, false);
    dialigRef.afterClosed().subscribe(async result => {
      if (result && this.data.slot?.id) {
        if (slot.baseSlotId && slot.isRepeat) {
          const slots = await this.slotService.getSlotsByBaseId(slot.baseSlotId);
          for (let lesson of result) {
            const lessonStart = convertTimeToMinutes(lesson.startTime);
            const lessonEnd = convertTimeToMinutes(lesson.endTime);
            for (let s of slots) {
              const start = convertTimeToMinutes(s.startTime);
              const end = convertTimeToMinutes(s.endTime);
              if (s.date === lesson.date && ((start >= lessonStart && start <= lessonEnd) || (end >= lessonStart && end <= lessonEnd))) {
                idsToDelete.push(s.id);
              }
            }
          }
        } else {
          idsToDelete.push(this.data.slot.id);
        }
        idsToDelete.forEach(async id => {
          await this.changeBaseSlot(id);
          this.deleteSlot(id)
        });
      }
    })
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