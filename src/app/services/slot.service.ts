import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Slot } from '../app.interfaces';
import { convertStringToDate, convertTimeToMinutes } from '../functions/dates';
import { environment } from '../../environments/environment';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class SlotService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private slotsSubject = new BehaviorSubject<Slot[]>([]);
  private databaseService = inject(DatabaseService);

  public slots$ = this.databaseService
    .getDatabaseStream('slots')
    .pipe(
      switchMap(dbName => {
        this.slotsSubject.next([]);
        if (!dbName) return of([]);
        return this.createCollectionListener(dbName);
      }),
      takeUntil(this.destroy$)
    );

  public constructor(private firestore: Firestore) {
    this.cleanupOldSlots();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createCollectionListener(dbName: string): Observable<Slot[]> {
    return new Observable<Slot[]>(subscriber => {
      const unsubscribe = onSnapshot(
        collection(this.firestore, dbName),
        snapshot => {
          const slots = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Slot));
          subscriber.next(slots);
        },
        error => console.error('Ошибка загрузки окон:', error)
      );

      return () => unsubscribe();
    });
  }

  private createSlot(doc: any): Slot {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      isRepeat: data.isRepeat || false,
      baseSlotId: data.baseSlotId || null,
      repeatEndDate: data.repeatEndDate || null,
      hasRealEndTime: data.hasRealEndTime || false,
      realEndTime: data.realEndTime || null
    };
  }

  public loadSlots(): void {
    const db = this.databaseService.getDatabaseName('slots')
    if (db) {
      getDocs(collection(this.firestore, db)).then(() => {
        console.log('Загрузка данных окон в расписании');
      });
    }
    this.cleanupOldSlots();
  }

  public async getSlots(): Promise<Slot[]> {
    const db = this.databaseService.getDatabaseName('slots')
    if (db) {
      const snapshot = await getDocs(collection(this.firestore, db));
      return snapshot.docs.map(this.createSlot);
    }
    return [];
  }

  public async getSlotById(id: string): Promise<Slot | null> {
    const db = this.databaseService.getDatabaseName('slots')
    if (db) {
      const docSnap = await getDoc(doc(this.firestore, db, id));
      return docSnap.exists() ? this.createSlot(docSnap) : null;
    }
    return null;
  }

  public async addSlot(slot: Omit<Slot, 'id'>): Promise<string> {
    const db = this.databaseService.getDatabaseName('slots')
    if (db) {
      const docRef = await addDoc(collection(this.firestore, db), slot);
      return docRef.id;
    }
    return '';
  }

  public async updateSlot(id: string, changes: Partial<Slot>): Promise<void> {
    const db = this.databaseService.getDatabaseName('slots')
    if (db) {
      await updateDoc(doc(this.firestore, db, id), changes);
    }
  }

  public async deleteSlot(id: string): Promise<void> {
    const db = this.databaseService.getDatabaseName('slots')
    if (db) {
      await deleteDoc(doc(this.firestore, db, id));
    }
  }

  public async getSlotsByBaseId(baseId: string): Promise<Slot[]> {
    let slots: Slot[] = []
    const baseSlot = await this.getSlotById(baseId);
    if (!baseSlot) {
      return slots;
    }
    return this.getFutureRepeatedSlots(baseId);
  }

  public async getFutureRepeatedSlots(id: string): Promise<Slot[]> {
    let slots: Slot[] = [];
    const slot = await this.getSlotById(id);
    if (!slot) {
      return slots;
    }
    if (!slot.baseSlotId || !slot.isRepeat) {
      return slots;
    }
    const baseId = slot.baseSlotId;
    const date = slot.date;
    slots = await this.getSlots();
    slots = slots
      .filter(slot => (slot.baseSlotId == baseId) && (convertStringToDate(slot.date).getTime() >= convertStringToDate(date).getTime()))
      .sort((a, b) => convertStringToDate(a.date).getTime() - convertStringToDate(b.date).getTime());
    return slots;
  }

  public async cleanupOldSlots(): Promise<void> {
    console.log('Очистка старых окон');
    const slots = await this.getSlots();
    const today = new Date();

    const oldSlots = slots.filter(slot => {
      const slotDate = convertStringToDate(slot.date);
      slotDate.setHours(0, convertTimeToMinutes(slot.startTime), 0, 0)
      return slotDate < today;
    });

    await Promise.all(oldSlots.map(slot => this.deleteSlot(slot.id)));
  }
}
