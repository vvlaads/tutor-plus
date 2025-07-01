import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DateService } from '../../services/date.service';

@Component({
  selector: 'app-find-date-dialog',
  imports: [FormsModule, CommonModule],
  templateUrl: './find-date-dialog.component.html',
  styleUrl: './find-date-dialog.component.css'
})
export class FindDateDialogComponent {
  public dialogRef = inject(MatDialogRef<FindDateDialogComponent>);
  constructor(private dateService: DateService) {

  }

  send() {
    this.dateService.currentDate = this.date;
    this.close();
  }
  date: string = '';
  close(): void {
    this.dialogRef.close();
  }
}
