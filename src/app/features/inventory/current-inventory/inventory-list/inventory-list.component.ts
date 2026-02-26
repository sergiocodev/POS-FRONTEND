import { Component, OnInit, OnChanges, SimpleChanges, signal, Input, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
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
export class InventoryListComponent implements OnInit, OnChanges {
    @ViewChild('productTemplate', { static: true }) productTemplate!: TemplateRef<any>;
    @ViewChild('lotTemplate', { static: true }) lotTemplate!: TemplateRef<any>;
    @ViewChild('quantityTemplate', { static: true }) quantityTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

    @Input() inventory: InventoryResponse[] = [];
    @Input() isLoading = false;

    @Output() adjust = new EventEmitter<InventoryResponse>();
    @Output() export = new EventEmitter<void>();

    searchTerm = signal<string>('');
    filteredInventory = signal<InventoryResponse[]>([]);
    columns: TableColumn[] = [];

    ngOnInit() {
        this.setupColumns();
        this.applyLocalFilters();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['inventory']) {
            this.applyLocalFilters();
        }
    }

    applyLocalFilters() {
        const result = this.inventory || [];
        const term = this.searchTerm().toLowerCase();

        if (!term) {
            this.filteredInventory.set(result);
            return;
        }

        const filtered = result.filter(item =>
            item.productName.toLowerCase().includes(term) ||
            item.lotCode.toLowerCase().includes(term)
        );

        this.filteredInventory.set(filtered);
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
        this.applyLocalFilters();
    }

    onAdjust(item: InventoryResponse): void {
        this.adjust.emit(item);
    }

    onExport(): void {
        this.export.emit();
    }
}
