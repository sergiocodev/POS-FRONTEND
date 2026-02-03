import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { CategoryResponse } from '../../../../core/models/category.model';

@Component({
    selector: 'app-categories-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './categories-list.component.html',
    styleUrl: './categories-list.component.scss'
})
export class CategoriesListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    categories = signal<CategoryResponse[]>([]);
    filteredCategories = signal<CategoryResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getCategories().subscribe({
            next: (categories) => {
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

    onStatusFilterChange(status: string) {
        if (status === '') {
            this.selectedStatusFilter.set(null);
        } else {
            this.selectedStatusFilter.set(status === 'true');
        }
        this.applyFilters();
    }

    createCategory() {
        this.router.navigate(['/pharmacy/categories/new']);
    }

    editCategory(id: number) {
        this.router.navigate(['/pharmacy/categories', id, 'edit']);
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
