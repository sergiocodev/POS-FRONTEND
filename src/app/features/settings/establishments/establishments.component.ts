import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// Eliminado: import { DialogModule } from 'primeng/dialog';
import { EstablishmentsListComponent } from './establishments-list/establishments-list.component';
import { EstablishmentFormComponent } from './establishment-form/establishment-form.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { EstablishmentResponse } from '../../../core/models/maintenance.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';

@Component({
    selector: 'app-establishments',
    standalone: true,
    imports: [
        CommonModule,
        EstablishmentsListComponent,
        EstablishmentFormComponent,
        ModuleHeaderComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent
    ],
    templateUrl: './establishments.component.html',
    styleUrl: './establishments.component.scss'
})
export class EstablishmentsComponent implements OnInit {
    private establishmentService = inject(EstablishmentService);
    private modalService = inject(ModalService);

    // State
    establishments = signal<EstablishmentResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    displayForm = signal(false);
    selectedEstablishmentId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.establishmentService.getAll().subscribe({
            next: (response) => {
                this.establishments.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading establishments:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar los establecimientos',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(establishmentId: number | null = null) {
        this.selectedEstablishmentId.set(establishmentId);
        this.displayForm.set(true);
    }

    onFormSaved() {
        this.displayForm.set(false);
        this.selectedEstablishmentId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.displayForm.set(false);
        this.selectedEstablishmentId.set(null);
    }

    async onDeleteEstablishment(est: EstablishmentResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Establecimiento',
            message: `¿Está seguro de eliminar el establecimiento <b>${est.name}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.establishmentService.delete(est.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Establecimiento eliminado correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error('Error deleting establishment:', error);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo eliminar el establecimiento', type: 'error' });
                }
            });
        }
    }

    async onToggleStatus(est: EstablishmentResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Confirmación',
            message: `¿Está seguro de <b>${est.active ? 'desactivar' : 'activar'}</b> el establecimiento <b>${est.name}</b>?`,
            btnColor: 'warning',
            confirmText: est.active ? 'Desactivar' : 'Activar'
        });

        if (confirmed) {
            const request = {
                name: est.name,
                address: est.address,
                codeSunat: est.codeSunat,
                active: !est.active
            };

            this.establishmentService.update(est.id, request).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Éxito', message: `Establecimiento ${est.active ? 'desactivado' : 'activado'} correctamente`, type: 'success' });
                },
                error: (error) => {
                    console.error('Error toggling status:', error);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo cambiar el estado', type: 'error' });
                }
            });
        }
    }
}