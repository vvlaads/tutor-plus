import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { user } from '@angular/fire/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    map(user => {
      if (user) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};