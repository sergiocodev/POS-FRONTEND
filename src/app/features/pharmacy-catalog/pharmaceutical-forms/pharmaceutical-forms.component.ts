import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PharmaceuticalFormListComponent } from './pharmaceutical-form-list/pharmaceutical-form-list.component';
import { PharmaceuticalFormFormComponent } from './pharmaceutical-form-form/pharmaceutical-form-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { PharmaceuticalFormResponse } from '../../../core/models/pharmaceutical-form.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-pharmaceutical-forms',
    standalone: true,
    imports: [
        CommonModule,
        PharmaceuticalFormListComponent,
        PharmaceuticalFormFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './pharmaceutical-forms.component.html',
    styleUrl: './pharmaceutical-forms.component.scss'
})
export class PharmaceuticalFormsComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    pharmaceuticalForms = signal<PharmaceuticalFormResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    showForm = signal(false);
    selectedFormId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.maintenanceService.getAllPharmaceuticalForms().subscribe({
            next: (response) => {
                this.pharmaceuticalForms.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading pharmaceutical forms:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar las formas farmacéuticas',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(formId: number | null = null) {
        this.selectedFormId.set(formId);
        this.showForm.set(true);
    }

    onFormSaved() {
        this.showForm.set(false);
        this.selectedFormId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showForm.set(false);
        this.selectedFormId.set(null);
    }

    async onDelete(pForm: PharmaceuticalFormResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Forma Farmacéutica',
            message: `¿Está seguro de eliminar la forma farmacéutica <b>${pForm.name}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.maintenanceService.deletePharmaceuticalFormById(pForm.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Forma farmacéutica eliminada correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'Error al eliminar la forma farmacéutica', type: 'error' });
                }
            });
        }
    }

}
