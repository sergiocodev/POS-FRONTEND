import { Component, OnInit, inject, signal, Input, Output, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { SaleResponse, SaleDocumentType } from '../../../../core/models/sale.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-sale-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './sale-list.component.html',
    styleUrl: './sale-list.component.scss'
})
export class SaleListComponent implements OnInit {
    @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
    @ViewChild('customerNameTemplate', { static: true }) customerNameTemplate!: TemplateRef<any>;
    @ViewChild('voucherTemplate', { static: true }) voucherTemplate!: TemplateRef<any>;
    @ViewChild('paymentConditionTemplate', { static: true }) paymentConditionTemplate!: TemplateRef<any>;
    @ViewChild('totalTemplate', { static: true }) totalTemplate!: TemplateRef<any>;
    @ViewChild('statusBadgeTemplate', { static: true }) statusBadgeTemplate!: TemplateRef<any>;
    @ViewChild('sunatBadgeTemplate', { static: true }) sunatBadgeTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

    // Inputs from Container
    @Input() sales: SaleResponse[] = [];
    @Input() isLoading = false;
    @Input() totalItems = 0;
    @Input() totalPages = 0;
    @Input() currentPage = 0;
    @Input() pageSize = 10;

    // Outputs to Container
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() tableFilterChange = new EventEmitter<any>();
    @Output() viewDetail = new EventEmitter<number>();
    @Output() cancelSale = new EventEmitter<number>();

    // Document Types for the UI helpers
    SaleDocumentType = SaleDocumentType;
    columns: TableColumn[] = [];

    ngOnInit(): void {
        this.setupColumns();
    }

    setupColumns() {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
            {
                key: 'date',
                label: 'Fecha',
                type: 'template',
                filterable: true,
                templateRef: this.dateTemplate,
                align: 'center'
            },
            {
                key: 'documentType',
                label: 'Tipo Doc.',
                filterable: true,
                align: 'center'
            },
            {
                key: 'voucher',
                label: 'Comprobante',
                type: 'template',
                filterable: true,
                templateRef: this.voucherTemplate,
                align: 'center'
            },
            {
                key: 'customerName',
                label: 'Cliente',
                type: 'template',
                filterable: true,
                templateRef: this.customerNameTemplate,
                align: 'center'
            },
            {
                key: 'userFullName',
                label: 'Vendedor',
                filterable: true,
                format: (val: any, row: any) => row.userFullName || row.username,
                align: 'center'
            },
            {
                key: 'total',
                label: 'Total',
                type: 'template',
                filterable: true,
                templateRef: this.totalTemplate,
                align: 'center'
            },
            {
                key: 'payments',
                label: 'Modo de pago',
                type: 'template',
                filterable: true,
                templateRef: this.paymentConditionTemplate,
                align: 'center'
            },
            {
                key: 'status',
                label: 'Estado',
                type: 'template',
                filterable: true,
                templateRef: this.statusBadgeTemplate,
                align: 'center'
            },
            {
                key: 'sunatStatus',
                label: 'Transmitido',
                type: 'template',
                filterable: true,
                templateRef: this.sunatBadgeTemplate,
                align: 'center'
            },
            {
                key: 'actions',
                label: 'Acciones',
                type: 'template',
                templateRef: this.actionsTemplate,
                align: 'center'
            }
        ];
    }

    handlePageChange(page: number): void {
        this.pageChange.emit(page);
    }

    handlePageSizeChange(size: number): void {
        this.pageSizeChange.emit(size);
    }

    handleTableFilter(filters: any): void {
        this.tableFilterChange.emit(filters);
    }

    handleTableAction(event: { action: string, row: SaleResponse }) {
        if (event.action === 'view') {
            this.viewDetail.emit(event.row.id);
        } else if (event.action === 'cancel') {
            this.cancelSale.emit(event.row.id);
        }
    }

    // --- Helpers for UI Classes ---

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'badge-success';
            case 'CANCELED':
            case 'VOIDED': return 'badge-danger';
            default: return 'badge-secondary';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'COMPLETADO';
            case 'CANCELED':
            case 'VOIDED': return 'ANULADO';
            default: return status || 'DESCONOCIDO';
        }
    }

    getSunatBadgeClass(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'badge-success';
            case 'PENDING': return 'badge-warning';
            case 'REJECTED': return 'badge-danger';
            default: return 'badge-info';
        }
    }

    getSunatLabel(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'SI';
            case 'PENDING': return 'PENDIENTE';
            case 'REJECTED': return 'RECHAZADO';
            default: return 'NO';
        }
    }

    getPaymentConditionBadgeClass(condition: string): string {
        switch (condition) {
            case 'CASH':
            case 'CONTADO': return 'badge-info';
            case 'CREDIT':
            case 'CREDITO': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    getPaymentConditionLabel(condition: string): string {
        switch (condition) {
            case 'CASH':
            case 'CONTADO': return 'CONTADO';
            case 'CREDIT':
            case 'CREDITO': return 'CRÉDITO';
            default: return condition || 'CONTADO';
        }
    }

    trackById(index: number, item: SaleResponse): number {
        return item.id;
    }
}