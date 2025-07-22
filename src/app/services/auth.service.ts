import { inject, Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, User, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UserInfoService } from './user-info.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private userInfoService = inject(UserInfoService);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  public constructor() {
    this.auth.onAuthStateChanged(user => {
      this.currentUserSubject.next(user);
    });
  }

  public async googleSignIn(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      if (user) {
        if (!await this.userInfoService.getUserInfoById(user.uid)) {
          await this.userInfoService.setUserInfo({ id: user.uid, currentCollection: null, email: user.email });
        }
      }
      this.router.navigate(['']);
    } catch (error) {
      console.error('Ошибка входа:', error);
    }
  }

  public async signOut(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
