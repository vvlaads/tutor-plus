import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Slot } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class SlotService implements OnDestroy {
  private firestore = inject(Firestore);
  private unsubscribe!: () => void;
  private slotsSubject = new BehaviorSubject<Slot[]>([]);

  public slots$ = this.slotsSubject.asObservable();

  public constructor() {
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
      date: data.name || '',
      startTime: data.phone || '',
      endTime: data.subject || '',
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
}
