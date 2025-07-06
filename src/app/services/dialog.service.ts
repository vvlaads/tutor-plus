import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StudentDialogComponent } from '../components/student-dialog/student-dialog.component';
import { DialogMode } from '../app.enums';
import { Lesson, SelectOption, Slot, Student } from '../app.interfaces';
import { LessonDialogComponent } from '../components/lesson-dialog/lesson-dialog.component';
import { SlotDialogComponent } from '../components/slot-dialog/slot-dialog.component';
import { ChoiceDialogComponent } from '../components/choice-dialog/choice-dialog.component';
import { FindDateDialogComponent } from '../components/find-date-dialog/find-date-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(MatDialog);

  public openStudentDialog(mode: DialogMode, student: Partial<Student> | null): MatDialogRef<StudentDialogComponent, any> {
    const dialogRef = this.dialog.open(StudentDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true,
      data: {
        mode: mode,
        student: student
      }
    });
    return dialogRef;
  }

  public openLessonDialog(mode: DialogMode, lesson: Partial<Lesson> | null): MatDialogRef<LessonDialogComponent, any> {
    const dialogRef = this.dialog.open(LessonDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true,
      data: {
        mode: mode,
        lesson: lesson
      }
    });
    return dialogRef;
  }

  public openSlotDialog(mode: DialogMode, slot: Partial<Slot> | null): MatDialogRef<SlotDialogComponent, any> {
    const dialogRef = this.dialog.open(SlotDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true,
      data: {
        mode: mode,
        slot: slot
      }
    });
    return dialogRef;
  }

  public openChoiceDialog(options: SelectOption[]): MatDialogRef<ChoiceDialogComponent, any> {
    const dialogRef = this.dialog.open(ChoiceDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true,
      data: {
        options: options
      }
    });
    return dialogRef;
  }

  public openFindDateDialog(): MatDialogRef<FindDateDialogComponent, any> {
    const dialogRef = this.dialog.open(FindDateDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true
    });
    return dialogRef;
  }
}
