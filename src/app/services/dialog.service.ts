import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StudentDialogComponent } from '../dialogs/student-dialog/student-dialog.component';
import { DialogMode } from '../app.enums';
import { Collection, Lesson, SelectOption, Slot, Student, WaitingBlock } from '../app.interfaces';
import { LessonDialogComponent } from '../dialogs/lesson-dialog/lesson-dialog.component';
import { SlotDialogComponent } from '../dialogs/slot-dialog/slot-dialog.component';
import { ChoiceDialogComponent } from '../dialogs/choice-dialog/choice-dialog.component';
import { FindDateDialogComponent } from '../dialogs/find-date-dialog/find-date-dialog.component';
import { WaitingBlockDialogComponent } from '../dialogs/waiting-block-dialog/waiting-block-dialog.component';
import { CollectionDialogComponent } from '../dialogs/collection-dialog/collection-dialog.component';

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
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true
    });
    return dialogRef;
  }

  public openWaitingBlockDialog(mode: DialogMode, waitingBlock: Partial<WaitingBlock> | null): MatDialogRef<WaitingBlockDialogComponent, any> {
    const dialogRef = this.dialog.open(WaitingBlockDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true,
      data: {
        mode: mode,
        waitingBlock: waitingBlock
      }
    });
    return dialogRef;
  }

  public openCollectionDialog(mode: DialogMode, col: Partial<Collection> | null): MatDialogRef<CollectionDialogComponent, any> {
    const dialogRef = this.dialog.open(CollectionDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'wide-dialog',
      disableClose: true,
      data: {
        mode: mode,
        collection: col
      }
    });
    return dialogRef;
  }
}
