import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CashSessionService } from '../../../../../core/services/cash-session.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { EstablishmentStateService } from '../../../../../core/services/establishment-state.service';
import { SessionStatusResponse, CloseSessionRequest } from '../../../../../core/models/cash.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { ModuleHeaderComponent } from '../../../../../shared/components/module-header/module-header.component';

@Component({
  selector: 'app-cash-close',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ModuleHeaderComponent],
  templateUrl: './cash-close.component.html',
  styleUrl: './cash-close.component.scss',
})
export class CashCloseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cashService = inject(CashSessionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private establishmentStateService = inject(EstablishmentStateService);

  sessionForm: FormGroup = this.fb.group({
    closingBalance: [0, [Validators.required, Validators.min(0)]],
    notes: ['']
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  sessionStatusData = signal<SessionStatusResponse | null>(null);

  closingBalanceValue = toSignal(
    this.sessionForm.get('closingBalance')!.valueChanges.pipe(
      startWith(this.sessionForm.get('closingBalance')?.value || 0),
      map(v => Number(v) || 0)
    )
  );

  calculatedBalance = computed(() => this.sessionStatusData()?.calculatedBalance || 0);
  differenceAmount = computed(() => (this.closingBalanceValue() || 0) - this.calculatedBalance());

  ngOnInit(): void {
    this.loadCurrentStatus();
  }

  loadCurrentStatus(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.errorMessage.set('Usuario no autenticado.');
      return;
    }

    this.isLoading.set(true);
    const estId = this.establishmentStateService.selectedEstablishmentId();
    this.cashService.getCurrentSessionStatus(userId, estId ? Number(estId) : undefined).subscribe({
      next: (response) => {
        this.sessionStatusData.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar el estado de la sesión.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.errorMessage.set('Usuario no autenticado.');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.sessionForm.value;

    const request: CloseSessionRequest = {
      userId: userId,
      closingBalance: formValue.closingBalance,
      notes: formValue.notes
    };

    this.cashService.closeSessionAndReport(request).subscribe({
      next: () => this.router.navigate(['/cash']),
      error: (err) => {
        this.errorMessage.set('Error al cerrar la caja.');
        this.isLoading.set(false);
      }
    });
  }
}
