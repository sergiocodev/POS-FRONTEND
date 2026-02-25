import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryResponse } from '../../../../core/models/category.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-categories-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './categories-list.component.html',
    styleUrl: './categories-list.component.scss'
})
export class CategoriesListComponent implements OnInit, OnChanges {
    @Input() categories: CategoryResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<CategoryResponse>();
    @Output() toggleStatus = new EventEmitter<CategoryResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Categoría', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localCategories = signal<CategoryResponse[]>([]);
    filteredCategories = signal<CategoryResponse[]>([]);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination
    pageSize = 10;
    currentPage = 1;

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['categories']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localCategories.set(this.categories);
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.localCategories();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(cat =>
                cat.name.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(cat => cat.active === this.selectedStatusFilter());
        }

        this.filteredCategories.set(filtered);
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

    handleTableAction(e: { action: string, row: CategoryResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: CategoryResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
        e.row.active = !e.checked; // Optimistic toggle reversion
    }

    createCategory() {
        this.create.emit();
    }

    trackByCategoryId(index: number, category: CategoryResponse): number {
        return category.id;
    }
}
