import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { EstablishmentResponse } from '../../../../core/models/maintenance.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { EstablishmentFormComponent } from '../establishment-form/establishment-form.component';

@Component({
    selector: 'app-establishments-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        EstablishmentFormComponent
    ],
    templateUrl: './establishments-list.component.html',
    styleUrl: './establishments-list.component.scss'
})
export class EstablishmentsListComponent implements OnInit {
    private establishmentService = inject(EstablishmentService);
    private router = inject(Router);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'name', label: 'Establecimiento', type: 'text' },
        { key: 'address', label: 'Dirección', type: 'text', format: (v: string) => v || 'Sin dirección' },
        { key: 'codeSunat', label: 'Cód. SUNAT', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Data Signals
    establishments = signal<EstablishmentResponse[]>([]);
    filteredEstablishments = signal<EstablishmentResponse[]>([]);
    isLoading = signal(false);

    // Filtros
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Modal de Formulario de Establecimiento
    showEstablishmentModal = signal(false);
    selectedEstablishmentId = signal<number | null>(null);

    // Pagination & Sorting (Handled by CustomTable)
    pageSize = 10;

    // Modal & Alerts
    showConfirmModal = false;
    modalMessage = '';
    modalActionType: 'delete' | 'status' = 'status';
    pendingAction: (() => void) | null = null;

    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.establishmentService.getAll().subscribe({
            next: (response) => {
                this.establishments.set(response.data);
                this.applyFilters();
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading establishments:', error);
                this.showAlert('Error', 'No se pudieron cargar los datos', 'danger');
                this.isLoading.set(false);
            }
        });
    }

    // --- Filter Logic ---

    applyFilters() {
        let filtered = this.establishments();
        const search = this.searchTerm().toLowerCase();

        if (search) {
            filtered = filtered.filter(est =>
                est.name.toLowerCase().includes(search) ||
                (est.address && est.address.toLowerCase().includes(search)) ||
                est.codeSunat.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(est => est.active === this.selectedStatusFilter());
        }

        this.filteredEstablishments.set(filtered);
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

    handleTableAction(e: { action: string, row: EstablishmentResponse }) {
        if (e.action === 'edit') {
            this.editEstablishment(e.row.id);
        } else if (e.action === 'delete') {
            this.confirmDelete(e.row);
        }
    }

    handleStatusToggle(e: { row: EstablishmentResponse, key: string, checked: boolean }) {
        this.confirmToggleStatus(e.row);
    }

    createEstablishment() {
        this.selectedEstablishmentId.set(null);
        this.showEstablishmentModal.set(true);
    }

    editEstablishment(id: number) {
        this.selectedEstablishmentId.set(id);
        this.showEstablishmentModal.set(true);
    }

    onEstablishmentSaved() {
        this.showEstablishmentModal.set(false);
        this.loadData();
    }

    onEstablishmentCancelled() {
        this.showEstablishmentModal.set(false);
    }

    // --- Modal Logic ---

    confirmToggleStatus(est: EstablishmentResponse) {
        this.modalActionType = 'status';
        this.modalMessage = `¿Está seguro de ${est.active ? 'desactivar' : 'activar'} el establecimiento <b>${est.name}</b>?`;
        this.showConfirmModal = true;

        this.pendingAction = () => {
            const request = {
                name: est.name,
                address: est.address,
                codeSunat: est.codeSunat,
                active: !est.active
            };

            this.establishmentService.update(est.id, request).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Éxito', `Establecimiento ${est.active ? 'desactivado' : 'activado'} correctamente`, 'success');
                },
                error: (error) => {
                    console.error('Error toggling status:', error);
                    this.showAlert('Error', 'No se pudo cambiar el estado', 'danger');
                }
            });
        };
    }

    confirmDelete(est: EstablishmentResponse) {
        this.modalActionType = 'delete';
        this.modalMessage = `¿Está seguro de eliminar el establecimiento <b>${est.name}</b>? Esta acción no se puede deshacer.`;
        this.showConfirmModal = true;

        this.pendingAction = () => {
            this.establishmentService.delete(est.id).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Eliminado', 'Establecimiento eliminado correctamente', 'success');
                },
                error: (error) => {
                    console.error('Error deleting establishment:', error);
                    this.showAlert('Error', 'No se pudo eliminar el establecimiento', 'danger');
                }
            });
        };
    }

    closeModal() {
        this.showConfirmModal = false;
        this.pendingAction = null;
    }

    executePendingAction() {
        if (this.pendingAction) this.pendingAction();
        this.closeModal();
    }

    // --- Alert Logic ---

    showAlert(title: string, message: string, type: string) {
        this.alertTitle = title;
        this.alertMessage = message;
        this.alertType = type;
        setTimeout(() => this.closeAlert(), 3000);
    }

    closeAlert() {
        this.alertMessage = '';
    }

    trackById(index: number, est: EstablishmentResponse): number {
        return est.id;
    }
}