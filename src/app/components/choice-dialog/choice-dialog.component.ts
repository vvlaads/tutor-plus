import { CommonModule } from '@angular/common';
import { Component, Inject, inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-choice-dialog',
  imports: [CommonModule],
  templateUrl: './choice-dialog.component.html',
  styleUrl: './choice-dialog.component.css'
})
export class ChoiceDialogComponent {
  options: string[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { options: string[] }) {
    this.options = data.options;
  }

  public dialogRef = inject(MatDialogRef<ChoiceDialogComponent>);

  submit(option: string) {
    this.close(option);
  }

  close(option: string | null) {
    this.dialogRef.close(option);
  }
}
