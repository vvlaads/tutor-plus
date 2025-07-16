import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Collection } from '../app.interfaces';
import { Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CollectionService implements OnDestroy {
  private unsubscribe!: () => void;
  private collectionsSubject = new BehaviorSubject<Collection[]>([]);
  private currentCollectionSubject = new BehaviorSubject<Collection | null>(null);

  public collections$ = this.collectionsSubject.asObservable();
  public currentCollection$ = this.currentCollectionSubject.asObservable();

  public constructor(private firestore: Firestore) {
    this.startListening();
  }

  public ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    const collectionsRef = collection(this.firestore, 'collections');

    this.unsubscribe = onSnapshot(collectionsRef, {
      next: (snapshot) => {
        const collections = snapshot.docs.map(this.createCollection);
        this.collectionsSubject.next(collections);
        this.updateCurrentCollection(collections);
      },
      error: (err) => console.error('Ошибка загрузки:', err)
    });
  }

  private stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private createCollection(doc: any): Collection {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      userId: data.userId,
      createAt: data.createAt?.toDate() || new Date(),
      isSelected: data.isSelected || false
    };
  }

  private updateCurrentCollection(collections: Collection[]): void {
    if (collections.length === 0) {
      this.currentCollectionSubject.next(null);
      return;
    }

    const sortedCollections = [...collections].sort((a, b) => {
      return a.createAt.getTime() - b.createAt.getTime();
    });
    this.currentCollectionSubject.next(sortedCollections[0]);

    for (let col of sortedCollections) {
      if (col.isSelected) {
        this.currentCollectionSubject.next(col);
      }
    }
  }

  public async setCurrentCollection(collection: Collection): Promise<void> {
    this.currentCollectionSubject.next(collection);
    const collections = await this.getCollections();
    for (let col of collections) {
      this.updateCollection(col.id, { isSelected: false })
      if (col.id === collection.id) {
        this.updateCollection(col.id, { isSelected: true })
      }
    }
  }

  public loadCollections(): void {
    getDocs(collection(this.firestore, 'collections')).then(() => {
      console.log('Загрузка коллекций');
    });
  }

  public async getCollections(): Promise<Collection[]> {
    const snapshot = await getDocs(collection(this.firestore, 'collections'));
    const collections = snapshot.docs.map(this.createCollection);
    this.updateCurrentCollection(collections);
    return collections;
  }

  public async getCollectionById(id: string): Promise<Collection | null> {
    const docSnap = await getDoc(doc(this.firestore, 'collections', id));
    return docSnap.exists() ? this.createCollection(docSnap) : null;
  }

  public async addCollection(col: Omit<Collection, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'collections'), {
      ...col,
      createAt: new Date()
    });
    return docRef.id;
  }

  public async updateCollection(id: string, changes: Partial<Collection>): Promise<void> {
    await updateDoc(doc(this.firestore, 'collections', id), changes);
  }

  public async deleteCollection(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'collections', id));
  }
}