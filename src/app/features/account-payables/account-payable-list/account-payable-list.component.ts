import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountPayableService } from '../../../core/services/account-payable.service';
import { AccountPayableResponse, PayablePaymentMethod, AccountPayablePaymentRequest } from '../../../core/models/account-payable.model';
import { AuthService } from '../../../core/services/auth.service';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-account-payable-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        ModalAlertComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './account-payable-list.component.html',
    styleUrl: './account-payable-list.component.scss'
})
export class AccountPayableListComponent implements OnInit {
    private accountPayableService = inject(AccountPayableService);
    private authService = inject(AuthService);
    private modalService = inject(ModalService);

    payables = signal<AccountPayableResponse[]>([]);
    isLoading = signal<boolean>(false);

    // Modal State
    showPaymentModal = signal<boolean>(false);
    selectedPayable = signal<AccountPayableResponse | null>(null);
    paymentAmount = signal<number | null>(null);
    paymentMethod = signal<PayablePaymentMethod>(PayablePaymentMethod.EFECTIVO);
    paymentReference = signal<string>('');
    paymentNotes = signal<string>('');
    isPaying = signal<boolean>(false);
    
    paymentMethods = Object.values(PayablePaymentMethod);

    columns: TableColumn[] = [
        { key: 'id', label: 'ID', filterable: true, width: '80px' },
        { key: 'supplierName', label: 'Proveedor', filterable: true },
        { key: 'createdAt', label: 'Fecha Registro', format: (val) => new Date(val).toLocaleDateString() },
        { key: 'dueDate', label: 'Fecha Vencimiento', format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
        { key: 'totalAmount', label: 'Monto Total', format: (val) => `S/ ${val.toFixed(2)}` },
        { key: 'amountPaid', label: 'Pagado', format: (val) => `S/ ${val.toFixed(2)}` },
        { key: 'pendingBalance', label: 'Saldo Pendiente', format: (val) => `S/ ${val.toFixed(2)}` },
        {
            key: 'status', label: 'Estado', type: 'badge',
            classCallback: (val) => this.getStatusBadgeClass(val)
        },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    ngOnInit(): void {
        this.loadPayables();
    }

    loadPayables() {
        this.isLoading.set(true);
        this.accountPayableService.getAll().subscribe({
            next: (response) => {
                // Formatear acciones para el custom table
                const mappedData = response.data.map(item => ({
                    ...item,
                    actions: [
                        { id: 'pay', icon: 'bi-cash', class: 'btn-success', title: 'Pagar' }
                    ]
                }));
                this.payables.set(mappedData);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar las cuentas por pagar', type: 'error' });
            }
        });
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PAID': return 'bg-success text-white';
            case 'PARTIAL': return 'bg-warning text-dark';
            case 'PENDING': return 'bg-danger text-white';
            default: return 'bg-secondary text-white';
        }
    }

    onAction(event: { action: string, row: any }) {
        if (event.action === 'pay') {
            if (event.row.status === 'PAID') {
                this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta ya está totalmente pagada.', type: 'warning' });
                return;
            }
            this.selectedPayable.set(event.row);
            this.paymentAmount.set(event.row.pendingBalance);
            this.showPaymentModal.set(true);
        }
    }

    closePaymentModal() {
        this.showPaymentModal.set(false);
        this.selectedPayable.set(null);
        this.paymentAmount.set(null);
        this.paymentMethod.set(PayablePaymentMethod.EFECTIVO);
        this.paymentReference.set('');
        this.paymentNotes.set('');
    }

    async processPayment() {
        const payable = this.selectedPayable();
        const amount = this.paymentAmount();

        if (!payable || !amount || amount <= 0) {
            this.modalService.alert({ title: 'Error', message: 'Monto inválido', type: 'error' });
            return;
        }

        if (amount > payable.pendingBalance) {
            this.modalService.alert({ title: 'Error', message: 'El monto ingresado es mayor al saldo pendiente', type: 'error' });
            return;
        }

        const payload: AccountPayablePaymentRequest = {
            accountPayableId: payable.id,
            amount: amount,
            paymentMethod: this.paymentMethod(),
            reference: this.paymentReference(),
            notes: this.paymentNotes()
        };

        this.isPaying.set(true);
        this.accountPayableService.pay(payable.id, payload).subscribe({
            next: () => {
                this.isPaying.set(false);
                this.closePaymentModal();
                this.modalService.alert({ title: 'Éxito', message: 'Pago registrado correctamente', type: 'success' });
                this.loadPayables();
            },
            error: (err) => {
                this.isPaying.set(false);
                this.modalService.alert({ title: 'Error', message: 'Error al registrar el pago', type: 'error' });
            }
        });
    }
}
