import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesListComponent } from './categories-list/categories-list.component';
import { CategoryFormComponent } from './category-form/category-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { CategoryResponse } from '../../../core/models/category.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [
        CommonModule,
        CategoriesListComponent,
        CategoryFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './categories.component.html',
    styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    categories = signal<CategoryResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    showCategoryForm = signal(false);
    selectedCategoryId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.maintenanceService.getAllCategory().subscribe({
            next: (response) => {
                this.categories.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading categories:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar las categorías',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(categoryId: number | null = null) {
        this.selectedCategoryId.set(categoryId);
        this.showCategoryForm.set(true);
    }

    onFormSaved() {
        this.showCategoryForm.set(false);
        this.selectedCategoryId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showCategoryForm.set(false);
        this.selectedCategoryId.set(null);
    }

    async onDeleteCategory(category: CategoryResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Categoría',
            message: `¿Está seguro de eliminar la categoría <b>${category.name}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.maintenanceService.deleteCategoryById(category.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Categoría eliminada correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'Error al eliminar la categoría', type: 'error' });
                }
            });
        }
    }

    async onToggleStatus(category: CategoryResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Confirmación',
            message: `¿Está seguro de <b>${category.active ? 'desactivar' : 'activar'}</b> la categoría ${category.name}?`,
            btnColor: 'warning',
            confirmText: category.active ? 'Desactivar' : 'Activar'
        });

        if (confirmed) {
            this.maintenanceService.updateCategoryById(category.id, category.name, !category.active).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Éxito', message: `Categoría ${category.active ? 'desactivada' : 'activada'} correctamente`, type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo cambiar el estado', type: 'error' });
                }
            });
        }
    }
}
