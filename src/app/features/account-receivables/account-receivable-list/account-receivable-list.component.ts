import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountReceivableService } from '../../../core/services/account-receivable.service';
import { AccountReceivableResponse, ReceivablePaymentMethod, AccountReceivablePaymentRequest, ReceivableStatus } from '../../../core/models/account-receivable.model';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-account-receivable-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        ModalAlertComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './account-receivable-list.component.html',
    styleUrl: './account-receivable-list.component.scss'
})
export class AccountReceivableListComponent implements OnInit {
    private accountReceivableService = inject(AccountReceivableService);
    private cashSessionService = inject(CashSessionService);
    private modalService = inject(ModalService);

    receivables = signal<AccountReceivableResponse[]>([]);
    isLoading = signal<boolean>(false);

    // Modal State
    showPaymentModal = signal<boolean>(false);
    selectedReceivable = signal<AccountReceivableResponse | null>(null);
    paymentAmount = signal<number | null>(null);
    paymentMethod = signal<ReceivablePaymentMethod>(ReceivablePaymentMethod.EFECTIVO);
    paymentReference = signal<string>('');
    paymentNotes = signal<string>('');
    isPaying = signal<boolean>(false);
    
    paymentMethods = Object.values(ReceivablePaymentMethod);

    columns: TableColumn[] = [
        { key: 'id', label: 'ID', filterable: true, width: '80px' },
        { key: 'customerName', label: 'Cliente', filterable: true },
        { key: 'saleId', label: 'Venta ID', filterable: true, width: '100px' },
        { key: 'createdAt', label: 'Fecha Registro', format: (val) => new Date(val).toLocaleDateString() },
        { key: 'dueDate', label: 'Fecha Vencimiento', format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
        { key: 'totalAmount', label: 'Monto Total', format: (val) => `S/ ${val.toFixed(2)}` },
        { key: 'amountPaid', label: 'Cobrado', format: (val) => `S/ ${val.toFixed(2)}` },
        { key: 'pendingBalance', label: 'Saldo Pendiente', format: (val) => `S/ ${val.toFixed(2)}` },
        {
            key: 'status', label: 'Estado', type: 'badge',
            classCallback: (val) => this.getStatusBadgeClass(val)
        },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    ngOnInit(): void {
        this.loadReceivables();
    }

    loadReceivables() {
        this.isLoading.set(true);
        this.accountReceivableService.getAll().subscribe({
            next: (response: any) => {
                const mappedData = response.data.map((item: AccountReceivableResponse) => ({
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

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PAID': return 'bg-success text-white';
            case 'PARTIAL': return 'bg-warning text-dark';
            case 'PENDING': return 'bg-danger text-white';
            case 'CANCELED': return 'bg-dark text-white';
            default: return 'bg-secondary text-white';
        }
    }

    onAction(event: { action: string, row: any }) {
        if (event.action === 'pay') {
            if (event.row.status === 'PAID') {
                this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta ya está totalmente cobrada.', type: 'warning' });
                return;
            }
            if (event.row.status === 'CANCELED') {
                this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta está anulada.', type: 'warning' });
                return;
            }
            this.selectedReceivable.set(event.row);
            this.paymentAmount.set(event.row.pendingBalance);
            this.showPaymentModal.set(true);
        }
    }

    closePaymentModal() {
        this.showPaymentModal.set(false);
        this.selectedReceivable.set(null);
        this.paymentAmount.set(null);
        this.paymentMethod.set(ReceivablePaymentMethod.EFECTIVO);
        this.paymentReference.set('');
        this.paymentNotes.set('');
    }

    async processPayment() {
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

        // Obtener sesión de caja activa
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
