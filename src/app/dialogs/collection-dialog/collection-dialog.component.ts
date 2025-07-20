import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CollectionService } from '../../services/collection.service';
import { DialogMode } from '../../app.enums';
import { Collection } from '../../app.interfaces';
import { getErrorMessage } from '../../app.functions';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collection-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './collection-dialog.component.html',
  styleUrl: './collection-dialog.component.css'
})
export class CollectionDialogComponent {
  private dialogRef = inject(MatDialogRef<CollectionDialogComponent>);

  public collectionForm: FormGroup;
  public title: string;
  public submitMessage: string;
  public formSubmitted = false;
  private userId = '';

  public constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: DialogMode, collection: Partial<Collection> | null }
  ) {
    switch (this.data.mode) {
      case DialogMode.Add:
        this.title = 'Новая коллекция'
        this.submitMessage = 'Добавить'
        break;
      case DialogMode.Edit:
        this.title = 'Редактировать коллекцию'
        this.submitMessage = 'Сохранить'
        break;
    }

    this.collectionForm = this.fb.group({
      name: [data.collection?.name, [Validators.required]],
      guests: [data.collection?.guests || []],
      newGuest: ['', [Validators.email]]
    });
  }

  public ngOnInit(): void {
    this.authService.currentUser$.subscribe(currentUser => {
      if (currentUser?.uid) {
        this.userId = currentUser.uid;
      }
    });
  }

  private convertFormToCollection(): Omit<Collection, 'id'> {
    return {
      name: this.collectionForm.value.name,
      guests: this.collectionForm.value.guests,
      userId: this.userId,
      createAt: this.data.collection?.createAt || new Date()
    };
  }

  public submit(): void {
    this.formSubmitted = true;
    Object.keys(this.collectionForm.controls).forEach(key => {
      this.collectionForm.get(key)?.markAsTouched();
    });

    if (this.collectionForm.invalid) {
      return;
    }

    switch (this.data.mode) {
      case DialogMode.Add:
        this.add();
        break;
      case DialogMode.Edit:
        this.update();
        break;
    }
    this.close();
  }

  public async add(): Promise<void> {
    const collection = this.convertFormToCollection();
    await this.addCollection(collection);
  }

  public update(): void {
    if (this.data.collection && this.data.collection.id) {
      const collection = this.convertFormToCollection();
      const id = this.data.collection.id;
      this.updateCollection(collection, id);
    }
  }

  public delete(): void {
    if (this.data.collection && this.data.collection.id) {
      const confirmed = confirm('Вы уверены, что хотите удалить эту коллекцию?');
      if (confirmed) {
        const id = this.data.collection.id;
        this.deleteCollection(id);
      }
    }
    this.close();
  }

  private async addCollection(col: Omit<Collection, 'id'>): Promise<string | null> {
    const id = await this.collectionService.addCollection(col).catch(error => {
      console.error('Ошибка при добавлении:', error);
      return null;
    });
    return id;
  }

  private updateCollection(col: Partial<Collection>, id: string): void {
    this.collectionService.updateCollection(id, col).catch(error => {
      console.error('Ошибка при обновлении:', error);
    });
  }

  private deleteCollection(id: string): void {
    this.collectionService.deleteCollection(id).catch(error => {
      console.error('Ошибка при удалении:', error);
    })
  }

  public close(): void {
    this.dialogRef.close();
  }

  public addGuest(): void {
    const newGuest = this.collectionForm.get('newGuest')?.value;
    if (newGuest && this.collectionForm.get('newGuest')?.valid) {
      const guests = [...this.collectionForm.get('guests')?.value, newGuest];
      this.collectionForm.get('guests')?.setValue(guests);
      this.collectionForm.get('newGuest')?.reset();
    }
  }

  public removeGuest(index: number): void {
    const guests = [...this.collectionForm.get('guests')?.value];
    guests.splice(index, 1);
    this.collectionForm.get('guests')?.setValue(guests);
  }

  public canDelete(): boolean {
    return (this.data.mode === DialogMode.Edit) && (this.userId === this.data.collection?.userId);
  }

  public getErrorMessage(field: string): string | null {
    return getErrorMessage(this.collectionForm, field);
  }
}
