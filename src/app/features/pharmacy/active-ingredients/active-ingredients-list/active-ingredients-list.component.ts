import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { ActiveIngredientResponse } from '../../../../core/models/active-ingredient.model';

@Component({
    selector: 'app-active-ingredients-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './active-ingredients-list.component.html',
    styleUrl: './active-ingredients-list.component.scss'
})
export class ActiveIngredientsListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    activeIngredients = signal<ActiveIngredientResponse[]>([]);
    filteredActiveIngredients = signal<ActiveIngredientResponse[]>([]);
    isLoading = signal(false);

    
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getActiveIngredients().subscribe({
            next: (ingredients) => {
                this.activeIngredients.set(ingredients);
                this.filteredActiveIngredients.set(ingredients);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading active ingredients:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.activeIngredients();

        
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

    createActiveIngredient() {
        this.router.navigate(['/pharmacy/active-ingredients/new']);
    }

    editActiveIngredient(id: number) {
        this.router.navigate(['/pharmacy/active-ingredients', id, 'edit']);
    }

    toggleActiveIngredientStatus(ingredient: ActiveIngredientResponse) {
        if (confirm(`¿Está seguro de ${ingredient.active ? 'desactivar' : 'activar'} el principio activo "${ingredient.name}"?`)) {
            this.maintenanceService.updateActiveIngredient(
                ingredient.id,
                ingredient.name,
                ingredient.description,
                !ingredient.active
            ).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling active ingredient status:', error);
                    alert('Error al cambiar el estado del principio activo');
                }
            });
        }
    }

    deleteActiveIngredient(ingredient: ActiveIngredientResponse) {
        if (confirm(`¿Está seguro de eliminar el principio activo "${ingredient.name}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deleteActiveIngredient(ingredient.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting active ingredient:', error);
                    alert('Error al eliminar el principio activo');
                }
            });
        }
    }

    trackByIngredientId(index: number, ingredient: ActiveIngredientResponse): number {
        return ingredient.id;
    }
}
