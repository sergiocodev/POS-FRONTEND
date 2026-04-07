import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CashSessionService } from '../services/cash-session.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const requireOpenCajaGuard: CanActivateFn = (route, state) => {
  const cashSessionService = inject(CashSessionService);
  const router = inject(Router);

  return cashSessionService.getActiveSession().pipe(
    map(res => {
      // If we have an active session, allow navigation
      if (res && res.data && res.data.status === 'OPEN') {
        return true;
      }
      // Otherwise, redirect to the open cash register page
      return router.createUrlTree(['/cash/open']);
    }),
    catchError(() => {
      // If the API throws an error (e.g. no active session), redirect
      return of(router.createUrlTree(['/cash/open']));
    })
  );
};
