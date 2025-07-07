import { CommonModule } from '@angular/common';
import { Component, HostListener, Inject, inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SelectOption } from '../../app.interfaces';

@Component({
  selector: 'app-choice-dialog',
  imports: [CommonModule],
  templateUrl: './choice-dialog.component.html',
  styleUrl: './choice-dialog.component.css'
})
export class ChoiceDialogComponent {
  public options: SelectOption[] = [];
  public dialogRef = inject(MatDialogRef<ChoiceDialogComponent>);

  @HostListener('document:keydown.escape', ['$event'])
  public handleEscapeKey(event: KeyboardEvent) {
    this.close(null);
  }

  public constructor(@Inject(MAT_DIALOG_DATA) public data: { options: SelectOption[] }) {
    this.options = data.options;
  }

  public submit(option: string): void {
    this.close(option);
  }

  public close(option: string | null): void {
    this.dialogRef.close(option);
  }
}
