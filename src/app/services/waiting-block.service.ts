import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { WaitingBlock } from '../app.interfaces';
import { Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class WaitingBlockService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private databaseService = inject(DatabaseService);
  private waitingBlocksSubject = new BehaviorSubject<WaitingBlock[]>([]);

  public waitingBlocks$ = this.databaseService
    .getDatabaseStream('waiting-blocks')
    .pipe(
      switchMap(dbName => {
        this.waitingBlocksSubject.next([]);
        if (!dbName) return of([]);
        return this.createCollectionListener(dbName);
      }),
      takeUntil(this.destroy$)
    );

  public constructor(private firestore: Firestore) {
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createCollectionListener(dbName: string): Observable<WaitingBlock[]> {
    return new Observable<WaitingBlock[]>(subscriber => {
      const unsubscribe = onSnapshot(
        collection(this.firestore, dbName),
        snapshot => {
          const waitingBlocks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as WaitingBlock));
          subscriber.next(waitingBlocks);
        },
        error => console.error('Ошибка загрузки блоков ожидания:', error)
      );

      return () => unsubscribe();
    });
  }

  private createWaitingBlock(doc: any): WaitingBlock {
    const data = doc.data();
    return {
      id: doc.id,
      studentId: data.studentId,
      date: data.date,
      note: data.note
    };
  }

  public loadWaitingBlocks(): void {
    const db = this.databaseService.getDatabaseName('waiting-blocks')
    if (db) {
      getDocs(collection(this.firestore, db)).then(() => {
        console.log('Загрузка данных блоков ожидания');
      });
    }
  }

  public async getWaitingBlocks(): Promise<WaitingBlock[]> {
    const db = this.databaseService.getDatabaseName('waiting-blocks')
    if (db) {
      const snapshot = await getDocs(collection(this.firestore, db));
      return snapshot.docs.map(this.createWaitingBlock);
    }
    return [];
  }

  public async getWaitingBlockById(id: string): Promise<WaitingBlock | null> {
    const db = this.databaseService.getDatabaseName('waiting-blocks')
    if (db) {
      const docSnap = await getDoc(doc(this.firestore, db, id));
      return docSnap.exists() ? this.createWaitingBlock(docSnap) : null;
    }
    return null;
  }

  public async addWaitingBlock(waitingBlock: Omit<WaitingBlock, 'id'>): Promise<string> {
    const db = this.databaseService.getDatabaseName('waiting-blocks')
    if (db) {
      const docRef = await addDoc(collection(this.firestore, db), waitingBlock);
      return docRef.id;
    }
    return '';
  }

  public async updateWaitingBlock(id: string, changes: Partial<WaitingBlock>): Promise<void> {
    const db = this.databaseService.getDatabaseName('waiting-blocks')
    if (db) {
      await updateDoc(doc(this.firestore, db, id), changes);
    }
  }

  public async deleteWaitingBlock(id: string): Promise<void> {
    const db = this.databaseService.getDatabaseName('waiting-blocks')
    if (db) {
      await deleteDoc(doc(this.firestore, db, id));
    }
  }
}
