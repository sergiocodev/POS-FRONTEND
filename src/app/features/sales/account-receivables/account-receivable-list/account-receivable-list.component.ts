import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { AccountReceivableResponse } from '../../../../core/models/account-receivable.model';

@Component({
    selector: 'app-account-receivable-list',
    standalone: true,
    imports: [
        CommonModule,
        CustomTableComponent
    ],
    templateUrl: './account-receivable-list.component.html',
    styleUrl: './account-receivable-list.component.scss'
})
export class AccountReceivableListComponent implements OnInit {
    @Input() receivables: AccountReceivableResponse[] = [];
    @Input() isLoading = false;

    @Output() payAction = new EventEmitter<AccountReceivableResponse>();

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

    ngOnInit(): void {}

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PAID': return 'bg-success text-white';
            case 'PARTIAL': return 'bg-warning text-dark';
            case 'PENDING': return 'bg-danger text-white';
            case 'CANCELED': return 'bg-dark text-white';
            default: return 'bg-secondary text-white';
        }
    }

    onAction(event: { action: string, row: AccountReceivableResponse }) {
        if (event.action === 'pay') {
            this.payAction.emit(event.row);
        }
    }
}
