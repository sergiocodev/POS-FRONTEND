import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountPayableResponse, PayablePaymentMethod, AccountPayablePaymentRequest } from '../../../../core/models/account-payable.model';
import { AccountPayableService } from '../../../../core/services/account-payable.service';
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
  @Input() selectedPayable: AccountPayableResponse | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private accountPayableService = inject(AccountPayableService);
  private cashSessionService = inject(CashSessionService);
  private establishmentStateService = inject(EstablishmentStateService);
  private modalService = inject(ModalService);

  paymentAmount = signal<number | null>(null);
  paymentMethod = signal<PayablePaymentMethod>(PayablePaymentMethod.EFECTIVO);
  paymentReference = signal<string>('');
  paymentNotes = signal<string>('');
  isPaying = signal<boolean>(false);
  paymentMethods = Object.values(PayablePaymentMethod);

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['selectedPayable'] && this.selectedPayable) {
          this.paymentAmount.set(this.selectedPayable.pendingBalance);
          this.paymentMethod.set(PayablePaymentMethod.EFECTIVO);
          this.paymentReference.set('');
          this.paymentNotes.set('');
      }
  }

  closePaymentModal() {
      this.cancel.emit();
  }

  processPayment() {
      const payable = this.selectedPayable;
      const amount = this.paymentAmount();

      if (!payable || !amount || amount <= 0) {
          this.modalService.alert({ title: 'Error', message: 'Monto inválido', type: 'error' });
          return;
      }

      if (amount > payable.pendingBalance) {
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
                  this.modalService.alert({ title: 'Error', message: 'Debe tener una sesión de caja abierta para registrar pagos.', type: 'error' });
                  return;
              }

              const payload: AccountPayablePaymentRequest = {
                  accountPayableId: payable.id,
                  cashSessionId: session.id,
                  amount: amount,
                  paymentMethod: this.paymentMethod(),
                  reference: this.paymentReference(),
                  notes: this.paymentNotes()
              };

              this.accountPayableService.pay(payable.id, payload).subscribe({
                  next: () => {
                      this.isPaying.set(false);
                      this.modalService.alert({ title: 'Éxito', message: 'Pago registrado correctamente', type: 'success' });
                      this.success.emit();
                  },
                  error: (err: any) => {
                      this.isPaying.set(false);
                      this.modalService.alert({ title: 'Error', message: 'Error al registrar el pago', type: 'error' });
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
