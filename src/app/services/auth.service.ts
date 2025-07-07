import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, User, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  public constructor(private auth: Auth, private router: Router) {
    this.auth.onAuthStateChanged(user => {
      this.currentUserSubject.next(user);
    });
  }

  public async googleSignIn(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
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
