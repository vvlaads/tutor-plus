import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DateService } from '../../services/date.service';

@Component({
  selector: 'app-find-date-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './find-date-dialog.component.html',
  styleUrl: './find-date-dialog.component.css'
})
export class FindDateDialogComponent {
  findDateForm: FormGroup;
  public dialogRef = inject(MatDialogRef<FindDateDialogComponent>);

  constructor(private fb: FormBuilder, private dateService: DateService) {
    this.findDateForm = this.fb.group({
      date: ['', [Validators.required]]
    })
  }

  submit() {
    if (this.findDateForm.invalid) {
      this.findDateForm.markAllAsTouched();
      return;
    }

    let selectedDate = this.findDateForm.value.date;
    const parts = selectedDate.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    this.close(`${day}.${month}.${year}`);
  }

  close(date: string | null) {
    this.dialogRef.close(date);
  }
}
