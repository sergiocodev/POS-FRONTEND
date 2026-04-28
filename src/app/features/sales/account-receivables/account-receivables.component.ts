import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountReceivableService } from '../../../core/services/account-receivable.service';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { AccountReceivableResponse, ReceivablePaymentMethod, AccountReceivablePaymentRequest } from '../../../core/models/account-receivable.model';
import { AccountReceivableListComponent } from './account-receivable-list/account-receivable-list.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-account-receivables',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AccountReceivableListComponent,
        ModalGenericComponent,
        ModalAlertComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './account-receivables.component.html'
})
export class AccountReceivablesComponent implements OnInit {
    private accountReceivableService = inject(AccountReceivableService);
    private cashSessionService = inject(CashSessionService);
    private modalService = inject(ModalService);

    // State
    receivables = signal<AccountReceivableResponse[]>([]);
    isLoading = signal<boolean>(false);

    // Modal State for Payment
    showPaymentModal = signal<boolean>(false);
    selectedReceivable = signal<AccountReceivableResponse | null>(null);
    paymentAmount = signal<number | null>(null);
    paymentMethod = signal<ReceivablePaymentMethod>(ReceivablePaymentMethod.EFECTIVO);
    paymentReference = signal<string>('');
    paymentNotes = signal<string>('');
    isPaying = signal<boolean>(false);

    paymentMethods = Object.values(ReceivablePaymentMethod);

    ngOnInit(): void {
        this.loadReceivables();
    }

    loadReceivables() {
        this.isLoading.set(true);
        this.accountReceivableService.getAll().subscribe({
            next: (response: any) => {
                const dataArray = Array.isArray(response) ? response : (response.data || []);
                const mappedData = dataArray.map((item: AccountReceivableResponse) => ({
                    ...item,
                    actions: [
                        { id: 'pay', icon: 'bi-cash-stack', class: 'btn-success', title: 'Cobrar' }
                    ]
                }));
                this.receivables.set(mappedData);
                this.isLoading.set(false);
            },
            error: (err: any) => {
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar las cuentas por cobrar', type: 'error' });
            }
        });
    }

    onPayAction(receivable: AccountReceivableResponse) {
        if (receivable.status === 'PAID') {
            this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta ya está totalmente cobrada.', type: 'warning' });
            return;
        }
        if (receivable.status === 'CANCELED') {
            this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta está anulada.', type: 'warning' });
            return;
        }
        this.selectedReceivable.set(receivable);
        this.paymentAmount.set(receivable.pendingBalance);
        this.showPaymentModal.set(true);
    }

    closePaymentModal() {
        this.showPaymentModal.set(false);
        this.selectedReceivable.set(null);
        this.paymentAmount.set(null);
        this.paymentMethod.set(ReceivablePaymentMethod.EFECTIVO);
        this.paymentReference.set('');
        this.paymentNotes.set('');
    }

    processPayment() {
        const receivable = this.selectedReceivable();
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

        this.cashSessionService.getActiveSession().subscribe({
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
                        this.closePaymentModal();
                        this.modalService.alert({ title: 'Éxito', message: 'Cobro registrado correctamente', type: 'success' });
                        this.loadReceivables();
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
