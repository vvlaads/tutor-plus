import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
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
  private invitedCollectionsSubject = new BehaviorSubject<Collection[]>([]);
  private currentCollectionSubject = new BehaviorSubject<Collection | null>(null);
  private userId = '';

  public collections$ = this.collectionsSubject.asObservable();
  public invitedCollections$ = this.invitedCollectionsSubject.asObservable();
  public currentCollection$ = this.currentCollectionSubject.asObservable();

  // Комбинированный поток всех доступных коллекций
  public allCollections$ = combineLatest([
    this.collections$,
    this.invitedCollections$
  ]).pipe(
    map(([collections, invited]) => [...collections, ...invited])
  );

  constructor(
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
        this.invitedCollectionsSubject.next([]);
        this.currentCollectionSubject.next(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    if (!this.userId) return;

    const collectionsRef = collection(this.firestore, 'collections');

    // Запрос для собственных коллекций
    const userCollectionsQuery = query(collectionsRef, where('userId', '==', this.userId));

    this.unsubscribe = onSnapshot(userCollectionsQuery, {
      next: async (snapshot) => {
        const collections = snapshot.docs.map(this.createCollection);
        this.collectionsSubject.next(collections);
        await this.loadInvitedCollections();
        await this.loadCurrentCollection();
      },
      error: (err) => console.error('Ошибка загрузки:', err)
    });
  }

  private async loadInvitedCollections(): Promise<void> {
    if (!this.userId) return;

    const userInfo = await this.userInfoService.getUserInfoById(this.userId);
    if (!userInfo?.email) return;

    const collectionsRef = collection(this.firestore, 'collections');
    const invitedQuery = query(
      collectionsRef,
      where('guests', 'array-contains', userInfo.email)
    );

    const snapshot = await getDocs(invitedQuery);
    const invitedCollections = snapshot.docs
      .map(this.createCollection)
      .filter(collection => collection.userId !== this.userId);

    this.invitedCollectionsSubject.next(invitedCollections);
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

  private async loadCurrentCollection(): Promise<void> {
    const userInfo = await this.userInfoService.getUserInfoById(this.userId);
    if (!userInfo?.currentCollection) return;

    // Ищем среди всех доступных коллекций
    const allCollections = [
      ...this.collectionsSubject.getValue(),
      ...this.invitedCollectionsSubject.getValue()
    ];

    const currentCollection = allCollections.find(
      col => col.id === userInfo.currentCollection
    );

    if (currentCollection) {
      this.currentCollectionSubject.next(currentCollection);
    } else {
      // Если коллекция не найдена, сбрасываем текущую
      await this.userInfoService.updateUserInfo(this.userId, { currentCollection: null });
      this.currentCollectionSubject.next(null);
    }
  }

  public async setCurrentCollection(collection: Collection): Promise<void> {
    // Проверяем доступ к коллекции
    const allCollections = [
      ...this.collectionsSubject.getValue(),
      ...this.invitedCollectionsSubject.getValue()
    ];

    if (allCollections.some(c => c.id === collection.id)) {
      this.currentCollectionSubject.next(collection);
      await this.userInfoService.updateUserInfo(this.userId, { currentCollection: collection.id });
    } else {
      console.warn('Попытка выбрать недоступную коллекцию');
    }
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

  public async getInvitedCollections(): Promise<Collection[]> {
    if (!this.userId) return [];
    const userInfo = await this.userInfoService.getUserInfoById(this.userId);
    if (!userInfo?.email) return [];

    const collectionsRef = collection(this.firestore, 'collections');
    const invitedQuery = query(
      collectionsRef,
      where('guests', 'array-contains', userInfo.email)
    );

    const snapshot = await getDocs(invitedQuery);
    return snapshot.docs
      .map(this.createCollection)
      .filter(collection => collection.userId !== this.userId);
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