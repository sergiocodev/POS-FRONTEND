import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { CategoryResponse } from '../../../../core/models/category.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-categories-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        CategoryFormComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './categories-list.component.html',
    styleUrl: './categories-list.component.scss'
})
export class CategoriesListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Categoría', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    categories = signal<CategoryResponse[]>([]);
    filteredCategories = signal<CategoryResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Modal de Formulario
    showCategoryModal = signal(false);
    selectedCategoryId = signal<number | null>(null);

    // Pagination
    pageSize = 10;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getCategories().subscribe({
            next: (response) => {
                const categories = response.data;
                this.categories.set(categories);
                this.filteredCategories.set(categories);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading categories:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.categories();

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
            this.editCategory(e.row.id);
        } else if (e.action === 'delete') {
            this.deleteCategory(e.row);
        }
    }

    handleStatusToggle(e: { row: CategoryResponse, key: string, checked: boolean }) {
        this.toggleCategoryStatus(e.row);
    }

    createCategory() {
        this.selectedCategoryId.set(null);
        this.showCategoryModal.set(true);
    }

    editCategory(id: number) {
        this.selectedCategoryId.set(id);
        this.showCategoryModal.set(true);
    }

    onCategorySaved() {
        this.showCategoryModal.set(false);
        this.loadData();
    }

    onCategoryCancelled() {
        this.showCategoryModal.set(false);
    }

    toggleCategoryStatus(category: CategoryResponse) {
        if (confirm(`¿Está seguro de ${category.active ? 'desactivar' : 'activar'} la categoría "${category.name}"?`)) {
            this.maintenanceService.updateCategory(category.id, category.name, !category.active).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling category status:', error);
                    alert('Error al cambiar el estado de la categoría');
                }
            });
        }
    }

    deleteCategory(category: CategoryResponse) {
        if (confirm(`¿Está seguro de eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deleteCategory(category.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting category:', error);
                    alert('Error al eliminar la categoría');
                }
            });
        }
    }

    trackByCategoryId(index: number, category: CategoryResponse): number {
        return category.id;
    }
}
