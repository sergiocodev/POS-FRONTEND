import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountReceivableResponse, ReceivablePaymentMethod, AccountReceivablePaymentRequest } from '../../../../core/models/account-receivable.model';
import { AccountReceivableService } from '../../../../core/services/account-receivable.service';
import { CashSessionService } from '../../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

@Component({
  selector: 'app-register-pay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-pay.component.html',
  styleUrl: './register-pay.component.scss'
})
export class RegisterPayComponent implements OnChanges {
  @Input() selectedReceivable: AccountReceivableResponse | null = null;
  @Output() success = new EventEmitter<void>();

  private accountReceivableService = inject(AccountReceivableService);
  private cashSessionService = inject(CashSessionService);
  private establishmentStateService = inject(EstablishmentStateService);
  private modalService = inject(ModalService);

  paymentAmount = signal<number | null>(null);
  paymentMethod = signal<ReceivablePaymentMethod>(ReceivablePaymentMethod.EFECTIVO);
  paymentReference = signal<string>('');
  paymentNotes = signal<string>('');
  isPaying = signal<boolean>(false);
  paymentMethods = Object.values(ReceivablePaymentMethod);

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['selectedReceivable'] && this.selectedReceivable) {
          this.paymentAmount.set(this.selectedReceivable.pendingBalance);
          this.paymentMethod.set(ReceivablePaymentMethod.EFECTIVO);
          this.paymentReference.set('');
          this.paymentNotes.set('');
      }
  }

  processPayment() {
      const receivable = this.selectedReceivable;
      const amount = this.paymentAmount();

      if (!receivable || !amount || amount <= 0) {
          this.modalService.alert({ title: 'Error', message: 'Monto inválido', type: 'error' });
          return;
      }

      if (amount > receivable.pendingBalance) {
          this.modalService.alert({ title: 'Error', message: 'El monto ingresado es mayor al saldo pendiente', type: 'error' });
          return;
      }

      this.isPaying.set(true);

      const estId = this.establishmentStateService.selectedEstablishmentId();

      this.cashSessionService.getActiveSession(estId ? Number(estId) : undefined).subscribe({
          next: (sessionRes) => {
              const session = sessionRes.data;
              if (!session) {
                  this.isPaying.set(false);
                  this.modalService.alert({ title: 'Error', message: 'Debe tener una sesión de caja abierta para registrar cobros.', type: 'error' });
                  return;
              }

              const payload: AccountReceivablePaymentRequest = {
                  accountReceivableId: receivable.id,
                  cashSessionId: session.id,
                  amount: amount,
                  paymentMethod: this.paymentMethod(),
                  reference: this.paymentReference(),
                  notes: this.paymentNotes()
              };

              this.accountReceivableService.pay(receivable.id, payload).subscribe({
                  next: () => {
                      this.isPaying.set(false);
                      this.modalService.alert({ title: 'Éxito', message: 'Cobro registrado correctamente', type: 'success' });
                      this.success.emit();
                  },
                  error: (err: any) => {
                      this.isPaying.set(false);
                      this.modalService.alert({ title: 'Error', message: 'Error al registrar el cobro', type: 'error' });
                  }
              });
          },
          error: (err: any) => {
              this.isPaying.set(false);
              this.modalService.alert({ title: 'Error', message: 'Error al verificar sesión de caja', type: 'error' });
          }
      });
  }
}
