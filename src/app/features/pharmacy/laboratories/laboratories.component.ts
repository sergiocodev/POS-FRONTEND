import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaboratoriesListComponent } from './laboratories-list/laboratories-list.component';
import { LaboratoryFormComponent } from './laboratory-form/laboratory-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { LaboratoryResponse } from '../../../core/models/laboratory.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-laboratories',
    standalone: true,
    imports: [
        CommonModule,
        LaboratoriesListComponent,
        LaboratoryFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './laboratories.component.html',
    styleUrl: './laboratories.component.scss'
})
export class LaboratoriesComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    laboratories = signal<LaboratoryResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    showLaboratoryForm = signal(false);
    selectedLaboratoryId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.maintenanceService.getAllLaboratory().subscribe({
            next: (response) => {
                this.laboratories.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading laboratories:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar los laboratorios',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(laboratoryId: number | null = null) {
        this.selectedLaboratoryId.set(laboratoryId);
        this.showLaboratoryForm.set(true);
    }

    onFormSaved() {
        this.showLaboratoryForm.set(false);
        this.selectedLaboratoryId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showLaboratoryForm.set(false);
        this.selectedLaboratoryId.set(null);
    }

    async onDeleteLaboratory(laboratory: LaboratoryResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Laboratorio',
            message: `¿Está seguro de eliminar el laboratorio <b>${laboratory.name}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.maintenanceService.deleteLaboratoryById(laboratory.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Laboratorio eliminado correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'Error al eliminar el laboratorio', type: 'error' });
                }
            });
        }
    }

    async onToggleStatus(laboratory: LaboratoryResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Confirmación',
            message: `¿Está seguro de <b>${laboratory.active ? 'desactivar' : 'activar'}</b> el laboratorio ${laboratory.name}?`,
            btnColor: 'warning',
            confirmText: laboratory.active ? 'Desactivar' : 'Activar'
        });

        if (confirmed) {
            this.maintenanceService.updateLaboratoryById(laboratory.id, laboratory.name, !laboratory.active).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Éxito', message: `Laboratorio ${laboratory.active ? 'desactivado' : 'activado'} correctamente`, type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo cambiar el estado', type: 'error' });
                }
            });
        }
    }
}
