import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Slot } from '../app.interfaces';
import { convertStringToDate } from '../functions/dates';

@Injectable({
  providedIn: 'root'
})
export class SlotService implements OnDestroy {
  private unsubscribe!: () => void;
  private slotsSubject = new BehaviorSubject<Slot[]>([]);

  public slots$ = this.slotsSubject.asObservable();

  public constructor(private firestore: Firestore) {
    this.startListening();
  }

  public ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    const slotsRef = collection(this.firestore, 'slots');

    this.unsubscribe = onSnapshot(slotsRef, {
      next: (snapshot) => {
        const slots = snapshot.docs.map(this.createSlot);
        this.slotsSubject.next(slots);
      },
      error: (err) => console.error('Ошибка загрузки:', err)
    });
  }

  private stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
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
    getDocs(collection(this.firestore, 'slots')).then(() => {
      console.log('Загрузка данных окон в расписании');
    });
  }

  public async getSlots(): Promise<Slot[]> {
    const snapshot = await getDocs(collection(this.firestore, 'slots'));
    return snapshot.docs.map(this.createSlot);
  }

  public async getSlotById(id: string): Promise<Slot | null> {
    const docSnap = await getDoc(doc(this.firestore, 'slots', id));
    return docSnap.exists() ? this.createSlot(docSnap) : null;
  }

  public async addSlot(slot: Omit<Slot, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'slots'), slot);
    return docRef.id;
  }

  public async updateSlot(id: string, changes: Partial<Slot>): Promise<void> {
    await updateDoc(doc(this.firestore, 'slots', id), changes);
  }

  public async deleteSlot(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'slots', id));
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
}
