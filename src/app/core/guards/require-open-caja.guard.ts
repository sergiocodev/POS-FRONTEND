import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CashSessionService } from '../services/cash-session.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { EstablishmentStateService } from '../services/establishment-state.service';
import { ModalService } from '../../shared/components/confirm-modal/service/modal.service';

export const requireOpenCajaGuard: CanActivateFn = (route, state) => {
  const cashSessionService = inject(CashSessionService);
  const router = inject(Router);
  const establishmentStateService = inject(EstablishmentStateService);

  const modalService = inject(ModalService);

  const estId = establishmentStateService.selectedEstablishmentId();

  return cashSessionService.getActiveSession(estId ? Number(estId) : undefined).pipe(
    map(res => {
      // If we have an active session, allow navigation
      if (res && res.data && res.data.status === 'OPEN') {
        return true;
      }
      // Otherwise, redirect to the open cash register page
      return router.createUrlTree(['/cash/open']);
    }),
    catchError((err) => {
      // If the API throws a 400, it might be because the user has an open session in another branch
      if (err.status === 400 && err.error?.message) {
        modalService.alert({
          title: 'Acceso Denegado',
          message: err.error.message,
          type: 'error'
        });
        return of(router.createUrlTree(['/home']));
      }
      
      return of(router.createUrlTree(['/cash/open']));
    })
  );
};
