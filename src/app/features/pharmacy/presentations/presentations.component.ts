import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresentationsListComponent } from './presentations-list/presentations-list.component';
import { PresentationFormComponent } from './presentation-form/presentation-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { PresentationResponse } from '../../../core/models/product.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-presentations',
    standalone: true,
    imports: [
        CommonModule,
        PresentationsListComponent,
        PresentationFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './presentations.component.html',
    styleUrl: './presentations.component.scss'
})
export class PresentationsComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    presentations = signal<PresentationResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    showForm = signal(false);
    selectedPresentationId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.maintenanceService.getAllPresentations().subscribe({
            next: (response) => {
                this.presentations.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading presentations:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar las presentaciones',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(presentationId: number | null = null) {
        this.selectedPresentationId.set(presentationId);
        this.showForm.set(true);
    }

    onFormSaved() {
        this.showForm.set(false);
        this.selectedPresentationId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showForm.set(false);
        this.selectedPresentationId.set(null);
    }

    async onDelete(presentation: PresentationResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Presentación',
            message: `¿Está seguro de eliminar la presentación <b>${presentation.description}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.maintenanceService.deletePresentationById(presentation.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Presentación eliminada correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'Error al eliminar la presentación', type: 'error' });
                }
            });
        }
    }
}
