import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TherapeuticActionListComponent } from './therapeutic-action-list/therapeutic-action-list.component';
import { TherapeuticActionFormComponent } from './therapeutic-action-form/therapeutic-action-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { TherapeuticActionResponse } from '../../../core/models/therapeutic-action.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-therapeutic-actions',
    standalone: true,
    imports: [
        CommonModule,
        TherapeuticActionListComponent,
        TherapeuticActionFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './therapeutic-actions.component.html',
    styleUrl: './therapeutic-actions.component.scss'
})
export class TherapeuticActionsComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    therapeuticActions = signal<TherapeuticActionResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    showForm = signal(false);
    selectedTherapeuticActionId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.maintenanceService.getAllTherapeuticActions().subscribe({
            next: (response) => {
                this.therapeuticActions.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading therapeutic actions:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar las acciones terapéuticas',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(actionId: number | null = null) {
        this.selectedTherapeuticActionId.set(actionId);
        this.showForm.set(true);
    }

    onFormSaved() {
        this.showForm.set(false);
        this.selectedTherapeuticActionId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showForm.set(false);
        this.selectedTherapeuticActionId.set(null);
    }


    async onDelete(tAction: TherapeuticActionResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Acción Terapéutica',
            message: `¿Está seguro de eliminar la acción terapéutica <b>${tAction.name}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.maintenanceService.deleteTherapeuticActionById(tAction.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Acción terapéutica eliminada correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'Error al eliminar el registro', type: 'error' });
                }
            });
        }
    }
}
