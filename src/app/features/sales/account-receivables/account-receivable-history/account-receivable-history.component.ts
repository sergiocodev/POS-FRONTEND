import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountReceivableService } from '../../../../core/services/account-receivable.service';
import { AccountReceivablePaymentResponse, ReceivablePaymentMethod } from '../../../../core/models/account-receivable.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

@Component({
    selector: 'app-account-receivable-history',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent,
        ModuleHeaderComponent,
        RouterLink
    ],
    templateUrl: './account-receivable-history.component.html',
    styleUrl: './account-receivable-history.component.scss'
})
export class AccountReceivableHistoryComponent implements OnInit {
    private accountReceivableService = inject(AccountReceivableService);
    private modalService = inject(ModalService);

    payments = signal<AccountReceivablePaymentResponse[]>([]);
    isLoading = signal<boolean>(false);
    totalElements = signal<number>(0);
    currentPage = signal<number>(1);
    pageSize = signal<number>(10);

    // Filters
    startDate = signal<string>('');
    endDate = signal<string>('');
    paymentMethod = signal<string>('');
    paymentMethods = Object.values(ReceivablePaymentMethod);

    columns: TableColumn[] = [
        { key: 'id', label: 'ID', width: '70px' },
        { key: 'paymentDate', label: 'Fecha Cobro', format: (val) => new Date(val).toLocaleString() },
        { key: 'customerName', label: 'Cliente' },
        { key: 'amount', label: 'Este Cobro', format: (val) => `S/ ${val.toFixed(2)}`, classCallback: () => 'fw-bold text-success' },
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
        this.currentPage.set(page + 1); // 1-based

        const params: any = {
            page: page,
            size: this.pageSize(),
            sort: 'paymentDate,desc'
        };

        if (this.startDate()) params.startDate = this.startDate();
        if (this.endDate()) params.endDate = this.endDate();
        if (this.paymentMethod()) params.paymentMethod = this.paymentMethod();

        this.accountReceivableService.getPaymentHistory(params).subscribe({
            next: (response) => {
                this.payments.set(response.data.content);
                this.totalElements.set(response.data.totalElements);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudo cargar el historial de cobros', type: 'error' });
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
