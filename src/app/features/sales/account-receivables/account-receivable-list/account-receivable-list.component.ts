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
    @Input() totalElements = 0;
    @Input() pageSize = 10;
    @Input() currentPage = 0;

    @Output() payAction = new EventEmitter<AccountReceivableResponse>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() filterChange = new EventEmitter<any>();

    columns: TableColumn[] = [
        { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
        { key: 'customerName', label: 'Cliente', filterable: true },
        { key: 'saleIdentifier', label: 'Venta', filterable: true, width: '150px' },
        { key: 'createdAt', label: 'Fecha Registro', format: (val) => new Date(val).toLocaleDateString(), filterable: true },
        { key: 'dueDate', label: 'Fecha Vencimiento', format: (val) => {
            if (!val) return 'N/A';
            const parts = String(val).split('-');
            if (parts.length === 3) return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
            return String(val);
        }, filterable: true },
        {
            key: 'daysUntilDue', label: 'Días a Vencer', type: 'badge',
            format: (val) => {
                if (val === null || val === undefined) return '-';
                if (val < 0) return 'VENCIDO';
                if (val === 0) return 'Vence hoy';
                return `${val} día${val === 1 ? '' : 's'}`;
            },
            classCallback: (val) => {
                if (val === null || val === undefined) return 'badge-neutral';
                if (val < 0) return 'badge-overdue';
                if (val === 0) return 'badge-today';
                if (val <= 7) return 'badge-warning';
                return 'badge-ok';
            }
        },
        { key: 'totalAmount', label: 'Monto Total', format: (val) => `S/ ${val.toFixed(2)}` },
        { key: 'amountPaid', label: 'Cobrado', format: (val) => `S/ ${val.toFixed(2)}` },
        { key: 'pendingBalance', label: 'Saldo Pendiente', format: (val) => `S/ ${val.toFixed(2)}` },
        {
            key: 'status', label: 'Estado', type: 'badge', filterable: true,
            format: (val) => this.translateStatus(val),
            classCallback: (val) => this.getStatusBadgeClass(val)
        },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    ngOnInit(): void { }

    translateStatus(status: string): string {
        switch (status) {
            case 'PAID':     return 'PAGADO';
            case 'PARTIAL':  return 'PARCIAL';
            case 'PENDING':  return 'PENDIENTE';
            case 'CANCELED': return 'ANULADO';
            default: return status;
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PAID':     return 'bg-success text-white';
            case 'PARTIAL':  return 'bg-warning text-dark';
            case 'PENDING':  return 'bg-secondary text-white';
            case 'CANCELED': return 'bg-dark text-white';
            default:         return 'bg-secondary text-white';
        }
    }

    onAction(event: { action: string, row: AccountReceivableResponse }) {
        if (event.action === 'pay') {
            this.payAction.emit(event.row);
        }
    }
}
