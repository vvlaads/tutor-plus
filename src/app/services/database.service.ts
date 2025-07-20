import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { CollectionService } from './collection.service';
import { User } from 'firebase/auth';
import { Collection } from '../app.interfaces';
import { combineLatest, map, Observable } from 'rxjs';

type ServiceType = 'students' | 'lessons' | 'slots' | 'waiting-blocks';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private authService = inject(AuthService);
  private collectionService = inject(CollectionService);
  private user: User | null = null;
  private collection: Collection | null = null;

  private currentDatabase$ = combineLatest([
    this.authService.currentUser$,
    this.collectionService.currentCollection$
  ]).pipe(
    map(([user, collection]) => {
      if (!user || !collection) return null;
      return { user, collection };
    })
  );

  public constructor() {
    this.authService.currentUser$.subscribe(currentUser => {
      this.user = currentUser;
    });
    this.collectionService.currentCollection$.subscribe(currentCollection => {
      this.collection = currentCollection;
    });
  }

  public getDatabaseName(serviceType: ServiceType): string | null {
    if (!this.user || !this.collection) return null;

    if (this.user.uid === this.collection.userId) {
      return `${serviceType}-${this.collection.userId}-${this.collection.id}`;
    }
    else {
      return `${serviceType}-${this.collection.userId}-${this.collection.id}`;
    }
  }

  public getDatabaseStream(serviceType: ServiceType): Observable<string | null> {
    return this.currentDatabase$.pipe(
      map(data => {
        if (!data) return null;
        return `${serviceType}-${data.collection.userId}-${data.collection.id}`;
      })
    );
  }

  public getCollectionOwnerId(): string | null {
    return this.collection?.userId || null;
  }

  public isCurrentUserOwner(): boolean {
    return !!this.user && !!this.collection && this.user.uid === this.collection.userId;
  }
}