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
    this.authService.currentUser$.subscribe(currentuser => {
      this.user = currentuser;
    })
    this.collectionService.currentCollection$.subscribe(currentCollection => {
      this.collection = currentCollection;
    })
  }


  public getDatabaseName(serviceType: ServiceType): string | null {
    const user = this.user;
    const collection = this.collection;
    return user && collection
      ? `${serviceType}-${user.uid}-${collection.id}`
      : null;
  }

  public getDatabaseStream(serviceType: ServiceType): Observable<string | null> {
    return this.currentDatabase$.pipe(
      map(data => {
        return data
          ? `${serviceType}-${data.user.uid}-${data.collection.id}`
          : null;
      })
    );
  }
}