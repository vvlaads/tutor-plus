import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, User, signOut } from '@angular/fire/auth';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  public constructor(private auth: Auth, private router: Router, private firestore: Firestore) {
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
        const userRef = doc(this.firestore, `users/${user.uid}`);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          createAt: new Date()
        }, { merge: true })
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
