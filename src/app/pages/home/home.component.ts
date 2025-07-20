import { Component, inject, OnInit } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../services/auth.service';
import { CollectionService } from '../../services/collection.service';
import { User } from 'firebase/auth';
import { Collection } from '../../app.interfaces';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { CollectionOption, DialogMode } from '../../app.enums';
import { COLLECTIONS_OPTIONS, MAX_COLLECTIONS_COUNT } from '../../app.constants';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  public pageMarginLeftPercentage = 0;
  private user: User | null = null;
  public collections: Collection[] = [];
  private dialogService = inject(DialogService)
  public currentCollection: Collection | null = null;

  public constructor(private layoutService: LayoutService, private authService: AuthService, private collectionService: CollectionService) {
    layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => this.pageMarginLeftPercentage = pageMarginLeftPercentage);
    authService.currentUser$.subscribe(currentUser => { this.user = currentUser });
  }

  public async ngOnInit(): Promise<void> {
    this.subscribeToCollections();
  }

  private subscribeToCollections(): void {
    this.collectionService.loadCollections()
    this.collectionService.collections$.subscribe(collections => {
      this.collections = collections.filter(collection => collection.userId === this.user?.uid);
      this.collections.sort((a, b) => a.createAt.getTime() - b.createAt.getTime())
    })
    this.collectionService.currentCollection$.subscribe(currentCollection => {
      this.currentCollection = currentCollection;
      console.log('home', currentCollection);
    })
  }

  public addCollection(): void {
    if (this.collections.length < MAX_COLLECTIONS_COUNT) {
      this.dialogService.openCollectionDialog(DialogMode.Add, null);
    } else {
      alert('Превышено количество коллекций для одного пользователя');
    }
  }

  public isCurrent(col: Collection): boolean {
    return this.currentCollection?.id === col.id;
  }

  public openCollection(col: Collection): void {
    const dialogRef = this.dialogService.openChoiceDialog(COLLECTIONS_OPTIONS);
    dialogRef.afterClosed().subscribe(result => {
      switch (result) {
        case CollectionOption.SELECT:
          this.collectionService.setCurrentCollection(col);
          break;
        case CollectionOption.EDIT:
          this.dialogService.openCollectionDialog(DialogMode.Edit, col);
          break;
      }
    })
  }
}
