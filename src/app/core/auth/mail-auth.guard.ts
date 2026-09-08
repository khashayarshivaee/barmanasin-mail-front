import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { MailAuthService } from './mail-auth.service';

export const mailAuthGuard: CanActivateFn = () => {
  const auth = inject(MailAuthService);
  const router = inject(Router);

  return auth.me().pipe(
    map(() => true),

    catchError(() =>
      of(
        router.createUrlTree(['/']),
      ),
    ),
  );
};
