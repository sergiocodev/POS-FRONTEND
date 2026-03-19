import { Component, OnInit, signal, computed, input, output, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryResponse } from '../../../../core/models/inventory.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, FormsModule, CustomTableComponent, TableFilterComponent],
    templateUrl: './inventory-list.component.html',
    styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit {
    @ViewChild('productTemplate', { static: true }) productTemplate!: TemplateRef<any>;
    @ViewChild('lotTemplate', { static: true }) lotTemplate!: TemplateRef<any>;
    @ViewChild('quantityTemplate', { static: true }) quantityTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

    inventory = input<InventoryResponse[]>([]);
    isLoading = input(false);

    adjust = output<InventoryResponse>();
    export = output<void>();

    searchTerm = signal<string>('');

    filteredInventory = computed(() => {
        const result = this.inventory();
        const term = this.searchTerm().toLowerCase();

        if (!term) {
            return result;
        }

        return result.filter(item =>
            item.productName.toLowerCase().includes(term) ||
            item.lotCode.toLowerCase().includes(term)
        );
    });

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
                key: 'lotCode',
                label: 'Lote',
                type: 'template',
                filterable: true,
                templateRef: this.lotTemplate
            },
            {
                key: 'expirationDate',
                label: 'Vencimiento',
                type: 'text',
                filterable: true,
                format: () => '-' // As per previous design it showed '-'
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

    resetFilters(): void {
        this.searchTerm.set('');
    }

    onAdjust(item: InventoryResponse): void {
        this.adjust.emit(item);
    }

    onExport(): void {
        this.export.emit();
    }
}
