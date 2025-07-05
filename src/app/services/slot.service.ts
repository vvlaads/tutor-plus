import { inject, Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { Slot } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class SlotService {
  private firestore = inject(Firestore);
  private slotsSubject = new BehaviorSubject<Slot[]>([]);
  private destroy$ = new Subject<void>();
  public slots$: Observable<Slot[]> = this.slotsSubject.asObservable();

  public constructor() {
    this.setupSlotsListener();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSlotsListener(): void {
    const slotsRef = collection(this.firestore, 'slots');

    const unsubscribe = onSnapshot(slotsRef,
      (querySnapshot) => {
        const slots = querySnapshot.docs.map(doc =>
          this.mapDocumentToSlot(doc)
        );
        this.slotsSubject.next(slots);
        console.log('Данные слотов обновлены', slots);
      },
      (error) => {
        console.error('Ошибка при подписке на слоты:', error);
      }
    );

    // Отписка при уничтожении сервиса
    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      unsubscribe();
    });
  }

  private async loadSlots(): Promise<void> {
    try {
      const slotsRef = collection(this.firestore, 'slots');
      const querySnapshot = await getDocs(slotsRef);

      const slots = querySnapshot.docs.map(doc =>
        this.mapDocumentToSlot(doc)
      );

      this.slotsSubject.next(slots);
      console.log(`Успешно загружено ${slots.length} слотов`);
    } catch (error) {
      console.error('Ошибка при получении слотов:', error);
      this.slotsSubject.next([]);
    }
  }

  private async refreshSlots(): Promise<void> {
    await this.loadSlots();
  }

  private mapDocumentToSlot(doc: any): Slot {
    const data = doc.data();
    return {
      id: doc.id,
      date: data['date'],
      startTime: data['startTime'],
      endTime: data['endTime']
    };
  }

  public async getSlotById(slotId: string): Promise<Slot | null> {
    try {
      const slotDoc = doc(this.firestore, 'slots', slotId);
      const slotSnapshot = await getDoc(slotDoc);

      if (!slotSnapshot.exists()) {
        console.log('Документ не найден');
        return null;
      }

      return this.mapDocumentToSlot(slotSnapshot);
    } catch (error) {
      console.error('Ошибка при получении документа:', error);
      return null;
    }
  }

  public async addSlot(slotData: Omit<Slot, 'id'>): Promise<void> {
    try {
      const slotsRef = collection(this.firestore, 'slots');
      await addDoc(slotsRef, slotData);
      console.log('Слот успешно добавлен');
      await this.refreshSlots();
    } catch (error) {
      console.error('Ошибка при добавлении слота:', error);
      throw error;
    }
  }

  public async updateSlot(slotId: string, slot: Partial<Slot>): Promise<void> {
    try {
      const slotDoc = doc(this.firestore, 'slots', slotId);
      await updateDoc(slotDoc, slot);
      console.log('Слот успешно обновлен');
      await this.refreshSlots();
    } catch (error) {
      console.error('Ошибка при обновлении слота:', error);
      throw error;
    }
  }

  public async deleteSlot(slotId: string): Promise<void> {
    try {
      const slotDoc = doc(this.firestore, 'slots', slotId);
      await deleteDoc(slotDoc);
      console.log('Слот успешно удален');
      await this.refreshSlots();
    } catch (error) {
      console.error('Ошибка при удалении слота:', error);
      throw error;
    }
  }
}
