import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WaitingBlock } from '../app.interfaces';
import { Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WaitingBlockService implements OnDestroy {
  private unsubscribe!: () => void;
  private waitingBlocksSubject = new BehaviorSubject<WaitingBlock[]>([]);

  public waitingBlocks$ = this.waitingBlocksSubject.asObservable();

  public constructor(private firestore: Firestore) {
    this.startListening();
  }

  public ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    const waitingBlocksRef = collection(this.firestore, environment.waitingBlocksBase);

    this.unsubscribe = onSnapshot(waitingBlocksRef, {
      next: (snapshot) => {
        const waitingBlocks = snapshot.docs.map(this.createWaitingBlock);
        this.waitingBlocksSubject.next(waitingBlocks);
      },
      error: (err) => console.error('Ошибка загрузки:', err)
    });
  }

  private stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
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
    getDocs(collection(this.firestore, environment.waitingBlocksBase)).then(() => {
      console.log('Загрузка данных блоков ожидания');
    });
  }

  public async getWaitingBlocks(): Promise<WaitingBlock[]> {
    const snapshot = await getDocs(collection(this.firestore, environment.waitingBlocksBase));
    return snapshot.docs.map(this.createWaitingBlock);
  }

  public async getWaitingBlockById(id: string): Promise<WaitingBlock | null> {
    const docSnap = await getDoc(doc(this.firestore, environment.waitingBlocksBase, id));
    return docSnap.exists() ? this.createWaitingBlock(docSnap) : null;
  }

  public async addWaitingBlock(waitingBlock: Omit<WaitingBlock, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, environment.waitingBlocksBase), waitingBlock);
    return docRef.id;
  }

  public async updateWaitingBlock(id: string, changes: Partial<WaitingBlock>): Promise<void> {
    await updateDoc(doc(this.firestore, environment.waitingBlocksBase, id), changes);
  }

  public async deleteWaitingBlock(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, environment.waitingBlocksBase, id));
  }
}
