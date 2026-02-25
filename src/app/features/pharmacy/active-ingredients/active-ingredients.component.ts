import { Component, signal, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveIngredientsListComponent } from './active-ingredients-list/active-ingredients-list.component';
import { ActiveIngredientFormComponent } from './active-ingredient-form/active-ingredient-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ActiveIngredientResponse } from '../../../core/models/active-ingredient.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-active-ingredients',
    standalone: true,
    imports: [
        CommonModule,
        ActiveIngredientsListComponent,
        ActiveIngredientFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './active-ingredients.component.html',
    styleUrl: './active-ingredients.component.scss'
})
export class ActiveIngredientsComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    activeIngredients = signal<ActiveIngredientResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    showIngredientForm = signal(false);
    selectedIngredientId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.maintenanceService.getAllActiveIngredients().subscribe({
            next: (response) => {
                this.activeIngredients.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading active ingredients:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar los principios activos',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(ingredientId: number | null = null) {
        this.selectedIngredientId.set(ingredientId);
        this.showIngredientForm.set(true);
    }

    onFormSaved() {
        this.showIngredientForm.set(false);
        this.selectedIngredientId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showIngredientForm.set(false);
        this.selectedIngredientId.set(null);
    }

    async onDeleteIngredient(ingredient: ActiveIngredientResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Principio Activo',
            message: `¿Está seguro de eliminar el principio activo <b>${ingredient.name}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.maintenanceService.deleteActiveIngredientById(ingredient.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Principio activo eliminado correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'Error al eliminar el principio activo', type: 'error' });
                }
            });
        }
    }

    async onToggleStatus(ingredient: ActiveIngredientResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Confirmación',
            message: `¿Está seguro de <b>${ingredient.active ? 'desactivar' : 'activar'}</b> el principio activo ${ingredient.name}?`,
            btnColor: 'warning',
            confirmText: ingredient.active ? 'Desactivar' : 'Activar'
        });

        if (confirmed) {
            this.maintenanceService.updateActiveIngredientById(
                ingredient.id,
                ingredient.name,
                ingredient.description,
                !ingredient.active
            ).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Éxito', message: `Principio activo ${ingredient.active ? 'desactivado' : 'activado'} correctamente`, type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo cambiar el estado', type: 'error' });
                }
            });
        }
    }
}
