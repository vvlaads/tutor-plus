import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Collection } from '../app.interfaces';
import { Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { UserInfoService } from './user-info.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionService implements OnDestroy {
  private unsubscribe!: () => void;
  private collectionsSubject = new BehaviorSubject<Collection[]>([]);
  private currentCollectionSubject = new BehaviorSubject<Collection | null>(null);
  private userId = '';

  public collections$ = this.collectionsSubject.asObservable();
  public currentCollection$ = this.currentCollectionSubject.asObservable();

  public constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private userInfoService: UserInfoService
  ) {
    this.authService.currentUser$.subscribe(currentUser => {
      if (currentUser) {
        this.userId = currentUser.uid;
        this.startListening();
      } else {
        this.userId = '';
        this.collectionsSubject.next([]);
      }
    });
  }

  public ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    if (!this.userId) return;

    const collectionsRef = collection(this.firestore, 'collections');
    const userCollectionsQuery = query(collectionsRef, where('userId', '==', this.userId));

    this.unsubscribe = onSnapshot(userCollectionsQuery, {
      next: (snapshot) => {
        const collections = snapshot.docs.map(this.createCollection);
        this.collectionsSubject.next(collections);
        this.loadCurrentCollection();
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
      createAt: data.createAt?.toDate(),
      guests: data.guests
    };
  }

  public async loadCurrentCollection(): Promise<void> {
    const userInfo = await this.userInfoService.getUserInfoById(this.userId);
    if (userInfo) {
      const collectionId = userInfo.currentCollection;
      if (collectionId) {
        const collection = await this.getCollectionById(collectionId);
        this.currentCollectionSubject.next(collection);
      }
    }
  }

  public async setCurrentCollection(collection: Collection): Promise<void> {
    this.currentCollectionSubject.next(collection);
    this.userInfoService.updateUserInfo(this.userId, { currentCollection: collection.id });
  }

  public async loadCollections(): Promise<void> {
    if (!this.userId) return;
    const collectionsRef = collection(this.firestore, 'collections');
    const userCollectionsQuery = query(collectionsRef, where('userId', '==', this.userId));
    await getDocs(userCollectionsQuery);
  }

  public async getCollections(): Promise<Collection[]> {
    if (!this.userId) return [];
    const collectionsRef = collection(this.firestore, 'collections');
    const userCollectionsQuery = query(collectionsRef, where('userId', '==', this.userId));
    const snapshot = await getDocs(userCollectionsQuery);
    const collections = snapshot.docs.map(this.createCollection);
    return collections;
  }

  public async getCollectionById(id: string): Promise<Collection | null> {
    const docSnap = await getDoc(doc(this.firestore, 'collections', id));
    if (!docSnap.exists()) return null;
    const collection = this.createCollection(docSnap);
    return collection.userId === this.userId ? collection : null;
  }

  public async addCollection(col: Omit<Collection, 'id'>): Promise<string> {
    if (!this.userId) throw new Error('Пользователь не авторизован');
    const docRef = await addDoc(collection(this.firestore, 'collections'), {
      ...col,
      userId: this.userId,
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