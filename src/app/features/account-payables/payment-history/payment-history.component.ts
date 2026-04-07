import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountPayableService } from '../../../core/services/account-payable.service';
import { AccountPayablePaymentResponse, PayablePaymentMethod } from '../../../core/models/account-payable.model';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { Page } from '../../../core/models/pagination.model';

@Component({
    selector: 'app-payment-history',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './payment-history.component.html',
    styleUrl: './payment-history.component.scss'
})
export class PaymentHistoryComponent implements OnInit {
    private accountPayableService = inject(AccountPayableService);
    private modalService = inject(ModalService);

    payments = signal<AccountPayablePaymentResponse[]>([]);
    isLoading = signal<boolean>(false);
    totalElements = signal<number>(0);
    currentPage = signal<number>(1);
    pageSize = signal<number>(10);

    // Filters
    startDate = signal<string>('');
    endDate = signal<string>('');
    paymentMethod = signal<string>('');
    paymentMethods = Object.values(PayablePaymentMethod);

    columns: TableColumn[] = [
        { key: 'id', label: 'ID', width: '70px' },
        { key: 'paymentDate', label: 'Fecha Pago', format: (val) => new Date(val).toLocaleString() },
        { key: 'supplierName', label: 'Proveedor' },
        { key: 'amount', label: 'Este Pago', format: (val) => `S/ ${val.toFixed(2)}`, classCallback: () => 'fw-bold text-primary' },
        { key: 'username', label: 'Usuario' },
        { key: 'paymentMethod', label: 'Método' },
        { key: 'reference', label: 'Ref.' },
        { key: 'notes', label: 'Notas' }
    ];

    ngOnInit(): void {
        this.loadHistory();
    }

    loadHistory(page: number = 0) {
        this.isLoading.set(true);
        this.currentPage.set(page + 1); // Guardar como 1-based para el componente

        const params: any = {
            page: page,
            size: this.pageSize(),
            sort: 'paymentDate,desc'
        };

        if (this.startDate()) params.startDate = this.startDate();
        if (this.endDate()) params.endDate = this.endDate();
        if (this.paymentMethod()) params.paymentMethod = this.paymentMethod();

        this.accountPayableService.getPaymentHistory(params).subscribe({
            next: (response) => {
                this.payments.set(response.data.content);
                this.totalElements.set(response.data.totalElements);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudo cargar el historial de pagos', type: 'error' });
            }
        });
    }

    onFilter() {
        this.loadHistory(0);
    }

    onPageChange(page: number) {
        this.loadHistory(page);
    }
}
