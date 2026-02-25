import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActiveIngredientResponse } from '../../../../core/models/active-ingredient.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-active-ingredients-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './active-ingredients-list.component.html',
    styleUrl: './active-ingredients-list.component.scss'
})
export class ActiveIngredientsListComponent implements OnInit, OnChanges {
    @Input() activeIngredients: ActiveIngredientResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<ActiveIngredientResponse>();
    @Output() toggleStatus = new EventEmitter<ActiveIngredientResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || '-' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localActiveIngredients = signal<ActiveIngredientResponse[]>([]);
    filteredActiveIngredients = signal<ActiveIngredientResponse[]>([]);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination
    pageSize = 10;
    currentPage = 1;

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['activeIngredients']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localActiveIngredients.set(this.activeIngredients);
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.localActiveIngredients();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(ingredient =>
                ingredient.name.toLowerCase().includes(search) ||
                (ingredient.description && ingredient.description.toLowerCase().includes(search))
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(ingredient => ingredient.active === this.selectedStatusFilter());
        }

        this.filteredActiveIngredients.set(filtered);
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

    handleTableAction(e: { action: string, row: ActiveIngredientResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: ActiveIngredientResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
        e.row.active = !e.checked; // Optimistic toggle reversion to wait for parent reload
    }

    createActiveIngredient() {
        this.create.emit();
    }

    trackByIngredientId(index: number, ingredient: ActiveIngredientResponse): number {
        return ingredient.id;
    }
}
