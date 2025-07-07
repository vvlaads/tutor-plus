import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogMode } from '../../app.enums';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlotService } from '../../services/slot.service';
import { Slot } from '../../app.interfaces';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { LessonService } from '../../services/lesson.service';
import { changeDateFormatDotToMinus, changeDateFormatMinusToDot } from '../../app.functions';

@Component({
  selector: 'app-slot-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './slot-dialog.component.html',
  styleUrl: './slot-dialog.component.css'
})
export class SlotDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SlotDialogComponent>);
  private mode: DialogMode = DialogMode.Add;

  public slotForm: FormGroup;
  public title: string = 'Добавление слота'
  public submitMessage: string = 'Добавить'
  public formSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private slotService: SlotService,
    private dialogService: DialogService,
    private lessonService: LessonService,
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
      date = changeDateFormatDotToMinus(data.slot.date);
    }

    this.slotForm = this.fb.group({
      date: [date, [Validators.required]],
      startTime: [data.slot?.startTime, [Validators.required]],
      endTime: [data.slot?.endTime, Validators.required],
      isRepeat: [false, Validators.required]
    });
  }

  public async ngOnInit() {
    this.lessonService.lessons$.subscribe(async lessons => {
      if (this.data.slot) {
        let lesson = await this.lessonService.getLessonByTime(this.data.slot.date, this.data.slot.startTime)
        if (lesson) {
          this.slotService.deleteSlot(this.data.slot.id).catch(error => { console.error('Ошибка при удалении:', error); })
          this.close(true);
        }
      }
    })
  }

  public submit(): void {
    this.formSubmitted = true;
    Object.keys(this.slotForm.controls).forEach(key => {
      this.slotForm.get(key)?.markAsTouched();
    });
    if (this.slotForm.invalid) {
      return;
    }

    const slotValue = { ...this.slotForm.value };
    slotValue.date = changeDateFormatMinusToDot(slotValue.date);

    switch (this.mode) {
      case DialogMode.Add:
        this.addSlot(slotValue);
        break;
      case DialogMode.Edit:
        this.updateSlot(slotValue);
        break;
    }
  }


  public addSlot(slot: Slot): void {
    this.slotService.addSlot(slot).then(_ => {
      this.close(true);
    })
      .catch(error => {
        console.error('Ошибка при добавлении:', error);
        this.close(false);
      });
  }

  public updateSlot(slot: Slot): void {
    const updatedSlot: Slot = {
      ...this.data.slot,
      ...slot
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

  public isEditMode() {
    return this.mode == DialogMode.Edit;
  }

  public deleteSlot() {
    if (this.data.slot) {
      const confirmDelete = confirm('Вы уверены, что хотите удалить это окно?');
      if (confirmDelete) {
        this.slotService.deleteSlot(this.data.slot.id).catch(error => { console.error('Ошибка при удалении:', error); })
        this.close(true);
      }
    }
  }

  public convertToLesson() {
    const slot = this.data.slot;
    if (slot) {
      const lesson = { date: slot?.date, startTime: slot?.startTime, endTime: slot?.endTime }
      this.dialogService.openLessonDialog(DialogMode.Add, lesson);
    } else {
      this.dialogService.openLessonDialog(DialogMode.Add, null);
      this.close(true);
    }
  }
}