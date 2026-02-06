import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { ActiveIngredientResponse } from '../../../../core/models/active-ingredient.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { ActiveIngredientFormComponent } from '../active-ingredient-form/active-ingredient-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-active-ingredients-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        ActiveIngredientFormComponent,
        ModuleHeaderComponent
    ],

    templateUrl: './active-ingredients-list.component.html',
    styleUrl: './active-ingredients-list.component.scss'
})
export class ActiveIngredientsListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || '-' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    activeIngredients = signal<ActiveIngredientResponse[]>([]);
    filteredActiveIngredients = signal<ActiveIngredientResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Modal de Formulario
    showIngredientModal = signal(false);
    selectedIngredientId = signal<number | null>(null);

    // Pagination
    pageSize = 10;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getActiveIngredients().subscribe({
            next: (response) => {
                const ingredients = response.data;
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

    onStatusFilterChange(event: any) {
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: ActiveIngredientResponse }) {
        if (e.action === 'edit') {
            this.editActiveIngredient(e.row.id);
        } else if (e.action === 'delete') {
            this.deleteActiveIngredient(e.row);
        }
    }

    handleStatusToggle(e: { row: ActiveIngredientResponse, key: string, checked: boolean }) {
        this.toggleActiveIngredientStatus(e.row);
    }

    createActiveIngredient() {
        this.selectedIngredientId.set(null);
        this.showIngredientModal.set(true);
    }

    editActiveIngredient(id: number) {
        this.selectedIngredientId.set(id);
        this.showIngredientModal.set(true);
    }

    onIngredientSaved() {
        this.showIngredientModal.set(false);
        this.loadData();
    }

    onIngredientCancelled() {
        this.showIngredientModal.set(false);
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
