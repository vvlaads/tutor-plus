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
import { collection, doc, Firestore, getDocs, setDoc } from '@angular/fire/firestore';

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

  public ngOnInit(): void {
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
    return col === this.currentCollection;
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

  private firestore = inject(Firestore);
  async copyCollection() {
    const source = 'students'; // Откуда копируем
    const target = 'students-0x7UpVmFZFQ4zwpPMdRgffIl3Ct1-SprRyR1kEWtFCYzO80Hy'; // Куда копируем

    try {
      // 1. Получаем все документы из исходной коллекции
      const sourceSnapshot = await getDocs(collection(this.firestore, source));

      // 2. Копируем каждый документ
      sourceSnapshot.forEach(async (document) => {
        await setDoc(
          doc(this.firestore, target, document.id), // Сохраняем старый ID
          document.data()
        );
      });

      alert(`✅ Скопировано ${sourceSnapshot.size} документов!`);
    } catch (error) {
      console.error('Ошибка копирования:', error);
      alert('❌ Ошибка при копировании! Смотри консоль.');
    }
  }
}
