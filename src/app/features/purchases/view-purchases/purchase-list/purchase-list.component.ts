import { Component, OnInit, signal, Input, Output, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PurchaseResponse, PurchaseDocumentType } from '../../../../core/models/purchase.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-purchase-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './purchase-list.component.html',
    styleUrl: './purchase-list.component.scss'
})
export class PurchaseListComponent implements OnInit {
    @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
    @ViewChild('supplierNameTemplate', { static: true }) supplierNameTemplate!: TemplateRef<any>;
    @ViewChild('voucherTemplate', { static: true }) voucherTemplate!: TemplateRef<any>;
    @ViewChild('paymentConditionTemplate', { static: true }) paymentConditionTemplate!: TemplateRef<any>;
    @ViewChild('totalTemplate', { static: true }) totalTemplate!: TemplateRef<any>;
    @ViewChild('statusBadgeTemplate', { static: true }) statusBadgeTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

    @Input() purchases: PurchaseResponse[] = [];
    @Input() isLoading = false;
    @Input() totalItems = 0;
    @Input() totalPages = 0;
    @Input() currentPage = 0;
    @Input() pageSize = 10;

    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() tableFilterChange = new EventEmitter<any>();
    @Output() viewDetail = new EventEmitter<number>();
    @Output() cancelPurchase = new EventEmitter<number>();

    PurchaseDocumentType = PurchaseDocumentType;
    columns: TableColumn[] = [];

    ngOnInit(): void {
        this.setupColumns();
    }

    setupColumns() {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
            { key: 'issueDate', label: 'Fecha Emisión', type: 'template', filterable: true, templateRef: this.dateTemplate, align: 'center' },
            { key: 'documentType', label: 'Tipo Doc.', filterable: true, align: 'center' },
            { key: 'voucher', label: 'Comprobante', type: 'template', filterable: true, templateRef: this.voucherTemplate, align: 'center' },
            { key: 'supplierName', label: 'Proveedor', type: 'template', filterable: true, templateRef: this.supplierNameTemplate, align: 'center' },
            { key: 'userName', label: 'Usuario', filterable: true, format: (val: any, row: any) => row.username, align: 'center' },
            { key: 'total', label: 'Total', type: 'template', filterable: true, templateRef: this.totalTemplate, align: 'center' },
            { key: 'paymentCondition', label: 'Cond. Pago', type: 'template', filterable: true, templateRef: this.paymentConditionTemplate, align: 'center' },
            { key: 'status', label: 'Estado', type: 'template', filterable: true, templateRef: this.statusBadgeTemplate, align: 'center' },
            { key: 'actions', label: 'Acciones', type: 'template', templateRef: this.actionsTemplate, align: 'center' }
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

    handleTableAction(event: { action: string, row: PurchaseResponse }) {
        if (event.action === 'view') {
            this.viewDetail.emit(event.row.id);
        } else if (event.action === 'cancel') {
            this.cancelPurchase.emit(event.row.id);
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'RECEIVED': return 'badge-success';
            case 'PENDING': return 'badge-warning';
            case 'CANCELED': return 'badge-danger';
            default: return 'badge-secondary';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'RECEIVED': return 'RECIBIDO';
            case 'PENDING': return 'PENDIENTE';
            case 'CANCELED': return 'ANULADO';
            default: return status || 'DESCONOCIDO';
        }
    }

    getPaymentConditionBadgeClass(condition?: string): string {
        switch (condition) {
            case 'CASH':
            case 'CONTADO': return 'badge-info';
            case 'CREDIT':
            case 'CREDITO': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    getPaymentConditionLabel(condition?: string): string {
        switch (condition) {
            case 'CASH':
            case 'CONTADO': return 'CONTADO';
            case 'CREDIT':
            case 'CREDITO': return 'CRÉDITO';
            default: return condition || 'CONTADO';
        }
    }
}
