import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogMode } from '../../app.enums';
import { SelectOption, Student, WaitingBlock } from '../../app.interfaces';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentService } from '../../services/student.service';
import { changeDateFormatDotToMinus, changeDateFormatMinusToDot } from '../../functions/dates';
import { getErrorMessage } from '../../app.functions';
import { WaitingBlockService } from '../../services/waiting-block.service';
import { CommonModule } from '@angular/common';
import { SearchSelectComponent } from "../../components/search-select/search-select.component";

@Component({
  selector: 'app-waiting-block-dialog',
  imports: [CommonModule, SearchSelectComponent, ReactiveFormsModule],
  templateUrl: './waiting-block-dialog.component.html',
  styleUrl: './waiting-block-dialog.component.css'
})
export class WaitingBlockDialogComponent {
  private dialogRef = inject(MatDialogRef<WaitingBlockDialogComponent>);
  private mode: DialogMode;
  private students: Student[] = [];

  public waitingBlockForm: FormGroup;
  public title: string;
  public submitMessage: string;
  public options: SelectOption[] = []
  public studentCost = 0;
  public formSubmitted = false;
  public preferredCost = 1000;

  public constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private waitingBlockService: WaitingBlockService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, waitingBlock: Partial<WaitingBlock> | null }
  ) {
    this.mode = data.mode;
    switch (this.mode) {
      case DialogMode.Add:
        this.title = 'Новая очередь на запись'
        this.submitMessage = 'Добавить'
        break;
      case DialogMode.Edit:
        this.title = 'Редактировать очередь на запись'
        this.submitMessage = 'Сохранить'
        break;
    }

    this.waitingBlockForm = this.fb.group({
      studentId: [data.waitingBlock?.studentId, [Validators.required]],
      date: [data.waitingBlock?.date == null ? null : changeDateFormatDotToMinus(data.waitingBlock.date), [Validators.required]],
      note: [data.waitingBlock?.note, [Validators.required]],
    });
  }

  public ngOnInit(): void {
    this.subscribeToStudents();
  }

  private subscribeToStudents(): void {
    this.studentService.students$.subscribe(students => {
      this.students = students;
      this.students.filter(student => student.isActive == true).forEach(student => {
        this.options.push({ value: student.id, text: `${student.name} ${student.phone}` });
      })
    });
  }

  private convertFormToWaitingBlock(): Omit<WaitingBlock, 'id'> {
    const waitingBlockValue = this.waitingBlockForm.value;
    const waitingBlock = {
      ...waitingBlockValue,
      date: changeDateFormatMinusToDot(waitingBlockValue.date)
    }
    return waitingBlock;
  }

  public submit(): void {
    this.formSubmitted = true;

    Object.keys(this.waitingBlockForm.controls).forEach(key => {
      this.waitingBlockForm.get(key)?.markAsTouched();
    });

    if (this.waitingBlockForm.invalid) {
      return;
    }

    switch (this.mode) {
      case DialogMode.Add:
        this.add();
        break;
      case DialogMode.Edit:
        this.update();
        break;
    }
    this.close();
  }

  private async add(): Promise<void> {
    let waitingBlock = this.convertFormToWaitingBlock();
    this.addWaitingBlock(waitingBlock);

  }

  private async update(): Promise<void> {
    const waitingBlock = this.convertFormToWaitingBlock();
    const id = this.data.waitingBlock?.id;
    if (id) {
      this.updateWaitingBlock(waitingBlock, id);
    }
  }

  public async delete(): Promise<void> {
    const id = this.data.waitingBlock?.id;
    if (id) {
      await this.waitingBlockService.deleteWaitingBlock(id);
    }
  }

  private async addWaitingBlock(waitingBlock: Omit<WaitingBlock, 'id'>): Promise<string | null> {
    const id = await this.waitingBlockService.addWaitingBlock(waitingBlock).catch(error => {
      console.error('Ошибка при добавлении:', error);
      return null;
    });
    return id;
  }

  private updateWaitingBlock(waitingBlock: Partial<WaitingBlock>, id: string): void {
    this.waitingBlockService.updateWaitingBlock(id, waitingBlock).catch(error => {
      console.error('Ошибка при обновлении:', error);
    });
  }

  private deleteWaitingBlock(id: string): void {
    this.waitingBlockService.deleteWaitingBlock(id).catch(error => {
      console.error('Ошибка при удалении:', error);
    })
  }

  public close(): void {
    this.dialogRef.close();
  }

  public isEditMode(): boolean {
    return this.mode == DialogMode.Edit;
  }

  public getErrorMessage(field: string): string | null {
    return getErrorMessage(this.waitingBlockForm, field);
  }
}
