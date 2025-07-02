import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DateService } from '../../services/date.service';

@Component({
  selector: 'app-find-date-dialog',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './find-date-dialog.component.html',
  styleUrl: './find-date-dialog.component.css'
})
export class FindDateDialogComponent {

  findDateForm: FormGroup;
  public dialogRef = inject(MatDialogRef<FindDateDialogComponent>);
  constructor(
    private fb: FormBuilder,
    private dateService: DateService
  ) {

    this.findDateForm = this.fb.group({
      date: [[Validators.required]]
    })
  }
  submit() {
    if (this.findDateForm.invalid) {
      this.findDateForm.markAllAsTouched();
      return;
    }
    this.dateService.currentDate = this.date;
    this.close();
  }
  date: string = '';
  close(): void {
    this.dialogRef.close();
  }
}
