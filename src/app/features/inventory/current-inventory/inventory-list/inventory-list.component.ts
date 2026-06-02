import { Component, OnInit, signal, computed, input, output, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryResponse } from '../../../../core/models/inventory.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, FormsModule, CustomTableComponent],
    templateUrl: './inventory-list.component.html',
    styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit {
    @ViewChild('productTemplate', { static: true }) productTemplate!: TemplateRef<any>;
    @ViewChild('unitTemplate', { static: true }) unitTemplate!: TemplateRef<any>;
    @ViewChild('priceTemplate', { static: true }) priceTemplate!: TemplateRef<any>;
    @ViewChild('lotTemplate', { static: true }) lotTemplate!: TemplateRef<any>;
    @ViewChild('quantityTemplate', { static: true }) quantityTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;
    inventory = input<InventoryResponse[]>([]);
    isLoading = input(false);

    pageSize = input<number>(10);
    totalElements = input<number>(0);
    currentPage = input<number>(0);

    adjust = output<InventoryResponse>();
    exportData = output<void>();

    pageChange = output<number>();
    pageSizeChange = output<number>();
    filterChange = output<any>();

    columns: TableColumn[] = [];

    ngOnInit() {
        this.setupColumns();
    }

    setupColumns() {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px' },
            {
                key: 'productName',
                label: 'Producto',
                type: 'template',
                filterable: true,
                templateRef: this.productTemplate
            },
            {
                key: 'unitName',
                label: 'Unidad',
                type: 'template',
                filterable: true,
                templateRef: this.unitTemplate
            },
            {
                key: 'lotCode',
                label: 'Lote',
                type: 'template',
                filterable: true,
                templateRef: this.lotTemplate
            },
            {
                key: 'expiryDate',
                label: 'Vencimiento',
                type: 'text',
                filterable: true,
                format: (val: any) => {
                    if (!val) return '-';
                    if (typeof val === 'string' && val.includes('-')) {
                        const parts = val.split('T')[0].split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                    if (Array.isArray(val) && val.length >= 3) {
                        return `${val[2].toString().padStart(2, '0')}/${val[1].toString().padStart(2, '0')}/${val[0]}`;
                    }
                    return val;
                }
            },
            {
                key: 'costPrice',
                label: 'Costo',
                type: 'text',
                filterable: true,
                format: (val: any) => val != null ? `S/ ${val}` : '-'
            },
            {
                key: 'salesPrice',
                label: 'Precio',
                type: 'template',
                filterable: true,
                templateRef: this.priceTemplate
            },
            {
                key: 'locationShelf',
                label: 'Ubicación',
                type: 'text',
                filterable: true,
                format: (val: any) => val || '-'
            },
            {
                key: 'quantity',
                label: 'Stock',
                type: 'template',
                filterable: true,
                templateRef: this.quantityTemplate
            },
            {
                key: 'actions',
                label: 'Acciones',
                type: 'template',
                templateRef: this.actionsTemplate
            }
        ];
    }

    handlePageChange(page: number) {
        this.pageChange.emit(page);
    }

    handlePageSizeChange(size: number) {
        this.pageSizeChange.emit(size);
    }

    handleFilterChange(filters: any) {
        this.filterChange.emit(filters);
    }

    onAdjust(item: InventoryResponse): void {
        this.adjust.emit(item);
    }

    onExport(): void {
        this.exportData.emit();
    }
}
