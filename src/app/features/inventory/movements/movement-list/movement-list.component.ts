import { Component, OnInit, signal, computed, input, output, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockMovementResponse, MovementType } from '../../../../core/models/inventory.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';

@Component({
    selector: 'app-movement-list',
    standalone: true,
    imports: [CommonModule, FormsModule, CustomTableComponent],
    templateUrl: './movement-list.component.html',
    styleUrl: './movement-list.component.scss'
})
export class MovementListComponent implements OnInit {
    @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
    @ViewChild('productTemplate', { static: true }) productTemplate!: TemplateRef<any>;
    @ViewChild('lotTemplate', { static: true }) lotTemplate!: TemplateRef<any>;
    @ViewChild('typeTemplate', { static: true }) typeTemplate!: TemplateRef<any>;
    @ViewChild('quantityTemplate', { static: true }) quantityTemplate!: TemplateRef<any>;
    @ViewChild('reasonTemplate', { static: true }) reasonTemplate!: TemplateRef<any>;

    movements = input<StockMovementResponse[]>([]);
    isLoading = input(false);

    pageSize = input<number>(10);
    totalElements = input<number>(0);
    currentPage = input<number>(0);

    pageChange = output<number>();
    pageSizeChange = output<number>();
    filterChange = output<any>();

    columns: TableColumn[] = [];

    ngOnInit() {
        this.setupColumns();
    }

    setupColumns() {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
            {
                key: 'createdAt',
                label: 'Fecha',
                type: 'template',
                templateRef: this.dateTemplate
            },
            {
                key: 'productName',
                label: 'Producto',
                type: 'template',
                filterable: true,
                templateRef: this.productTemplate
            },
            {
                key: 'lotCode',
                label: 'Lote',
                type: 'template',
                filterable: true,
                templateRef: this.lotTemplate
            },
            {
                key: 'type',
                label: 'Tipo',
                type: 'template',
                filterable: true,
                templateRef: this.typeTemplate
            },
            {
                key: 'quantity',
                label: 'Cant.',
                type: 'template',
                templateRef: this.quantityTemplate
            },
            {
                key: 'reason',
                label: 'Motivo',
                type: 'template',
                filterable: true,
                templateRef: this.reasonTemplate
            },
            {
                key: 'userName',
                label: 'Usuario',
                type: 'text',
                filterable: true,
                format: (val) => val || 'Sistema'
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

    getTypeClass(type: MovementType): string {
        switch (type) {
            case MovementType.PURCHASE:
            case MovementType.ADJUSTMENT_IN:
            case MovementType.TRANSFER_IN:
            case MovementType.SALE_RETURN:
                return 'bg-success';
            case MovementType.SALE:
            case MovementType.ADJUSTMENT_OUT:
            case MovementType.TRANSFER_OUT:
            case MovementType.VOID_RETURN:
                return 'bg-danger';
            default: return 'bg-info';
        }
    }

    isOutput(type: MovementType): boolean {
        return [
            MovementType.SALE,
            MovementType.ADJUSTMENT_OUT,
            MovementType.TRANSFER_OUT,
            MovementType.VOID_RETURN
        ].includes(type);
    }
}
