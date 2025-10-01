import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

export const redirectIfAuthGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    map(user => {
      if (user) {
        router.navigate(['schedule']);
        return false;
      }
      return true;
    })
  );
};
