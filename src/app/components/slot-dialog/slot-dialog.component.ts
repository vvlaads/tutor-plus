import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogMode } from '../../app.enums';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlotService } from '../../services/slot.service';
import { Slot } from '../../app.interfaces';
import { CommonModule } from '@angular/common';
import { DateService } from '../../services/date.service';

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
  public title: string = 'Добавление слота'
  public submitMessage: string = 'Добавить'
  public formSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private slotService: SlotService,
    private dateService: DateService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, slot: Slot | null }
  ) {
    this.mode = data.mode;
    switch (this.mode) {
      case DialogMode.Add:
        this.title = 'Добавление слота'
        this.submitMessage = 'Добавить'
        break;
      case DialogMode.Edit:
        this.title = 'Обновить слот'
        this.submitMessage = 'Сохранить'
        break;
    }
    let date = null;
    if (data.slot) {
      date = dateService.changeFormatDotToMinus(data.slot.date);
    }

    this.slotForm = this.fb.group({
      date: [date, [Validators.required]],
      startTime: [data.slot?.startTime, [Validators.required]],
      endTime: [data.slot?.endTime, Validators.required]
    });
  }

  public submit(): void {
    this.formSubmitted = true;
    Object.keys(this.slotForm.controls).forEach(key => {
      this.slotForm.get(key)?.markAsTouched();
    });
    if (this.slotForm.invalid) {
      return;
    }

    this.slotForm.value.date = this.dateService.changeFormatMinusToDot(this.slotForm.value.date);

    switch (this.mode) {
      case DialogMode.Add:
        this.addSlot();
        break;
      case DialogMode.Edit:
        this.updateSlot();
        break;
    }
  }


  public addSlot(): void {
    const newSlot: Slot = {
      ...this.slotForm.value
    };
    this.slotService.addSlot(newSlot).then(_ => {
      this.close(true);
    })
      .catch(error => {
        console.error('Ошибка при добавлении:', error);
        this.close(false);
      });
  }

  public updateSlot(): void {
    const updatedSlot: Slot = {
      ...this.data.slot,
      ...this.slotForm.value
    };

    this.slotService.updateSlot(updatedSlot.id, updatedSlot).then(_ => {
      this.close(true);
    })
      .catch(error => { console.error('Ошибка при обновлении:', error); this.close(false); });

  }

  public compareFn(option1: boolean, option2: boolean): boolean {
    return option1 === option2;
  }

  public close(status: boolean): void {
    this.dialogRef.close(status);
  }

  public getError(field: string): string | null {
    const control = this.slotForm.get(field);
    if (!control || !control.errors) return null;

    if (control.errors['required']) return '*Поле обязательно';
    if (control.errors['pattern']) return '*Неверный формат';
    if (control.errors['min']) return '*Слишком маленькое значение';
    return null;
  }
}