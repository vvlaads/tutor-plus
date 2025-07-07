import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { changeDateFormatMinusToDot, getErrorMessage } from '../../app.functions';

@Component({
  selector: 'app-find-date-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './find-date-dialog.component.html',
  styleUrl: './find-date-dialog.component.css'
})
export class FindDateDialogComponent {
  private dialogRef = inject(MatDialogRef<FindDateDialogComponent>);

  public formSubmitted = false;
  public findDateForm: FormGroup;

  @HostListener('document:keydown.escape', ['$event'])
  public handleEscapeKey(event: KeyboardEvent): void {
    this.close(null);
  }

  public constructor(private fb: FormBuilder) {
    this.findDateForm = this.fb.group({
      date: ['', [Validators.required]]
    })
  }

  public submit(): void {
    this.formSubmitted = true;

    Object.keys(this.findDateForm.controls).forEach(key => {
      this.findDateForm.get(key)?.markAsTouched();
    });

    if (this.findDateForm.invalid) {
      return;
    }

    const selectedDate = this.findDateForm.value.date;
    this.close(changeDateFormatMinusToDot(selectedDate));
  }

  public close(date: string | null): void {
    this.dialogRef.close(date);
  }

  public getErrorMessage(field: string): string | null {
    return getErrorMessage(this.findDateForm, field);
  }
}
