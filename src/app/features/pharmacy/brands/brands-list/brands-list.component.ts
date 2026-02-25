import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandResponse } from '../../../../core/models/brand.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-brands-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './brands-list.component.html',
    styleUrl: './brands-list.component.scss'
})
export class BrandsListComponent implements OnInit, OnChanges {
    @Input() brands: BrandResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<BrandResponse>();
    @Output() toggleStatus = new EventEmitter<BrandResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Marca', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localBrands = signal<BrandResponse[]>([]);
    filteredBrands = signal<BrandResponse[]>([]);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination
    pageSize = 10;
    currentPage = 1;

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['brands']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localBrands.set(this.brands);
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.localBrands();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(brand =>
                brand.name.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(brand => brand.active === this.selectedStatusFilter());
        }

        this.filteredBrands.set(filtered);
        this.currentPage = 1;
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: BrandResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: BrandResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
        e.row.active = !e.checked; // Optimistic toggle reversion
    }

    createBrand() {
        this.create.emit();
    }

    trackByBrandId(index: number, brand: BrandResponse): number {
        return brand.id;
    }
}
